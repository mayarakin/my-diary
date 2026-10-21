import { PageHeader } from "@/components/page-header";

type LinkItem = {
  label: string;
  href: string;
};

type LinkGroup = {
  id: string;
  title: string;
  links: LinkItem[];
};

const GROUPS: LinkGroup[] = [
  {
    id: "vp",
    title: "VP",
    links: [
      {
        label: "Árvore VP",
        href: "https://docs.google.com/spreadsheets/d/17jrSgqciZXfsfqyf1raKgx6HFbB4pt9XQfuFJZ_v1Iw/edit?gid=1551394691#gid=1551394691",
      },
      {
        label: "Queries VP",
        href: "https://us-east-1.quicksight.aws.amazon.com/sn/account/nu-qs-prod/dashboards/a9905b93-1382-49e5-8dc0-5c2a8d7077bd",
      },
      {
        label: "Planilha Scam",
        href: "https://docs.google.com/spreadsheets/d/1CvFJuSWhrsL3gR15w8SV943eUmBepR8HR_b7yEuD710/edit?gid=798226313#gid=798226313",
      },
      {
        label: "Calculadora de Jobs",
        href: "https://docs.google.com/spreadsheets/d/1JM_wiFTMyjwEZKOeQd60p8KWxARgRanWI3zcXsqKlx8/edit?gid=1092098658#gid=1092098658",
      },
    ],
  },
  {
    id: "id",
    title: "ID",
    links: [
      {
        label: "Gerador de análise",
        href: "https://script.google.com/a/macros/nubank.com.br/s/AKfycbzHeF6JzawAZw8_vJl17cHBqO--XxDpd531e55jmbCmRb-9AT3aX_CQ5w6FHw8vBXQK/exec",
      },
      {
        label: "PH3A",
        href: "https://www.ph3a.com.br/crm/account/login?returnUrl=https://www.ph3a.com.br:443/databusca",
      },
      {
        label: "Remoção de fotos",
        href: "https://nubank.atlassian.net/servicedesk/customer/portal/352",
      },
      {
        label: "Calculadora de Jobs",
        href: "https://docs.google.com/spreadsheets/d/1JM_wiFTMyjwEZKOeQd60p8KWxARgRanWI3zcXsqKlx8/edit?gid=1714061824#gid=1714061824",
      },
    ],
  },
  {
    id: "csat",
    title: "CSAT",
    links: [
      {
        label: "Dimensionamento",
        href: "https://ai-lab.longlived.nubankdev.com/qid-hub/dimensionamento",
      },
      {
        label: "Portal CSAT",
        href: "https://script.google.com/a/nubank.com.br/macros/s/AKfycbxGh6d5IlU0ctMMg-fqei6lRcNKDdEsCC6Hhyek0Hj6BvjgGruA7TP08Aw8HGyin-lt/exec?ts=1778678127393",
      },
      {
        label: "Casos Zendesk",
        href: "https://nubank.zendesk.com/agent/filters/52335011550995",
      },
      {
        label: "Gerador de macros",
        href: "https://script.google.com/a/macros/nubank.com.br/s/AKfycbymI0ifz5fdEkJZR-qbYQX7sFDTrMjc_1gu3gmd_lxgINH_9QmsyTvdOlcb5_czjWc6gg/exec",
      },
      {
        label: "Portal de reversão",
        href: "https://script.google.com/a/macros/nubank.com.br/s/AKfycbzjHxrAuqQicJZi2Cnn33nMGEvCRWEfc6C-bJMdKuzLvbTWGsKvOxijY1CVvTOowQY/exec",
      },
      {
        label: "Ajuste para Customer Offboarding",
        href: "https://nubank.atlassian.net/servicedesk/customer/portal/436",
      },
      {
        label: "Jira OBF",
        href: "https://nubank.atlassian.net/jira/servicedesk/projects/OBFS/queues/custom/10384",
      },
      {
        label: "Modelos Dossiê",
        href: "https://drive.google.com/drive/folders/1Z_xZ0cY2UV7Q5H9oie8UxDUIsVhABvwX",
      },
      {
        label: "Registro Dossiê",
        href: "https://drive.google.com/drive/folders/1X9Bx_YczYvvVE-mq1GkxSBgs4UA6G310",
      },
      {
        label: "Rascunho",
        href: "https://docs.google.com/presentation/d/1tBxobDgq-VkA8b1nwesAjpKGaG4FdZXnpjkmFbi7VK0/edit?slide=id.g3ef259f80a7_0_0#slide=id.g3ef259f80a7_0_0",
      },
    ],
  },
];

export default function LinksPage() {
  return (
    <div>
      <PageHeader
        title="Links"
        subtitle="Atalhos do dia a dia, separados por tipo de demanda."
      />

      <nav className="links-jump" aria-label="Tipos de demanda">
        {GROUPS.map((group) => (
          <a key={group.id} href={`#${group.id}`} className="links-jump__chip">
            {group.title}
          </a>
        ))}
      </nav>

      <div className="links-stack">
        {GROUPS.map((group) => (
          <section key={group.id} id={group.id} className="panel links-group">
            <h2 className="links-group__title">{group.title}</h2>
            <ul className="links-list">
              {group.links.map((link) => (
                <li key={`${group.id}-${link.label}-${link.href}`}>
                  <a
                    className="link-row"
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="link-row__label">{link.label}</span>
                    <span className="link-row__hint" aria-hidden="true">
                      Abrir
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
