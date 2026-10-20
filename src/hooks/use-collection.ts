"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { enqueueGistPersist, loadHubSnapshot } from "@/lib/gist";
import { emptyCollections, nowIso } from "@/lib/schema";
import type {
  CollectionMap,
  CollectionName,
  SaveStatus,
} from "@/lib/types";

type HubState = {
  gistId: string | null;
  collections: CollectionMap;
  status: SaveStatus;
  error: string | null;
  bootstrapped: boolean;
};

type Listener = () => void;

const listeners = new Set<Listener>();

let hubState: HubState = {
  gistId: null,
  collections: emptyCollections(),
  status: "idle",
  error: null,
  bootstrapped: false,
};

let loadPromise: Promise<void> | null = null;

function emit() {
  listeners.forEach((l) => l());
}

function setHubState(partial: Partial<HubState>) {
  hubState = { ...hubState, ...partial };
  emit();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return hubState;
}

async function bootstrap() {
  if (hubState.bootstrapped) return;
  if (loadPromise) return loadPromise;

  setHubState({ status: "loading", error: null });
  loadPromise = loadHubSnapshot()
    .then((snap) => {
      setHubState({
        gistId: snap.gistId,
        collections: snap.collections,
        status: "saved",
        error: null,
        bootstrapped: true,
      });
    })
    .catch((err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar dados do Gist.";
      setHubState({
        status: "error",
        error: message,
        bootstrapped: true,
      });
    })
    .finally(() => {
      loadPromise = null;
    });

  return loadPromise;
}

export function useHubBootstrap() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    void bootstrap();
  }, []);

  return {
    status: state.status,
    error: state.error,
    bootstrapped: state.bootstrapped,
    gistId: state.gistId,
    refresh: () => {
      hubState = {
        ...hubState,
        bootstrapped: false,
      };
      emit();
      return bootstrap();
    },
  };
}

export function useCollection<K extends CollectionName>(name: K) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void bootstrap();
  }, []);

  const items = state.collections[name];

  const persist = useCallback(
    async (nextItems: CollectionMap[K]) => {
      const nextCollections: CollectionMap = {
        ...hubState.collections,
        [name]: nextItems,
      };
      setHubState({
        collections: nextCollections,
        status: "saving",
        error: null,
      });

      try {
        const gistId = await enqueueGistPersist({
          gistId: hubState.gistId,
          collections: nextCollections,
          dirty: name,
        });
        setHubState({
          gistId,
          status: "saved",
          error: null,
        });
        if (savedTimer.current) clearTimeout(savedTimer.current);
        savedTimer.current = setTimeout(() => {
          if (hubState.status === "saved") {
            setHubState({ status: "idle" });
          }
        }, 1600);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Erro ao salvar no Gist.";
        setHubState({ status: "error", error: message });
      }
    },
    [name],
  );

  const upsert = useCallback(
    async (item: CollectionMap[K][number]) => {
      const prev = hubState.collections[name] as CollectionMap[K];
      const stamped = {
        ...item,
        updatedAt: nowIso(),
      } as CollectionMap[K][number];
      const idx = prev.findIndex(
        (x) => (x as { id: string }).id === (item as { id: string }).id,
      );
      const list = (
        idx >= 0
          ? prev.map((x, i) => (i === idx ? stamped : x))
          : [stamped, ...prev]
      ) as CollectionMap[K];
      await persist(list);
    },
    [name, persist],
  );

  const remove = useCallback(
    async (id: string) => {
      const list = (hubState.collections[name] as CollectionMap[K]).filter(
        (x) => x.id !== id,
      ) as CollectionMap[K];
      await persist(list);
    },
    [name, persist],
  );

  const replaceAll = useCallback(
    async (next: CollectionMap[K]) => {
      await persist(next);
    },
    [persist],
  );

  return {
    items,
    loading: state.status === "loading" && !state.bootstrapped,
    saving: state.status === "saving",
    saved: state.status === "saved",
    error: state.error,
    status: state.status,
    upsert,
    remove,
    replaceAll,
    gistId: state.gistId,
  };
}

export function useSaveStatus() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    status: state.status,
    error: state.error,
  };
}
