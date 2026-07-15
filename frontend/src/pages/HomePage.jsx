import { Link } from "react-router-dom";
import { useRole } from "../auth/RoleContext";
import { ROLE_PROFESSIONNELLE } from "../auth/roles";

const actionsPrincipales = [
  {
    titre: "Pilotage actions Insertis",
    texte: "Importer la liste, voir les actions à faire, ouvrir les dossiers et préparer les traces.",
    lien: "/pilotage-actions",
    bouton: "Ouvrir le pilotage",
    principal: true,
  },
  {
    titre: "Fiche minute",
    texte: "Noter rapidement un contact et préparer une trace courte.",
    lien: "/accompagnement-global/fiche-minute",
    bouton: "Ouvrir la fiche",
  },
  {
    titre: "Lecture globale",
    texte: "Qualifier la situation et préparer la prochaine action utile.",
    lien: "/accompagnement-global/lecture-globale",
    bouton: "Ouvrir la lecture",
  },
  {
    titre: "Échéances et vigilances",
    texte: "Surveiller les contrats, relances, documents et points à ne pas perdre.",
    lien: "/accompagnement-global/echeances-vigilances",
    bouton: "Voir les vigilances",
  },
];

const reperes = [
  "Importer le CSV Insertis dans le pilotage actions.",
  "Cliquer sur Actions à faire pour filtrer la liste.",
  "Ouvrir un dossier pour noter, prioriser et journaliser.",
];

const s = {
  page: {
    minHeight: "100vh",
    background: "#F7F1E8",
    color: "#443E37",
    padding: "34px 26px 70px",
    fontFamily: "Arial, system-ui, sans-serif",
  },
  wrap: {
    maxWidth: "1120px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "22px",
    paddingBottom: "22px",
    borderBottom: "1px solid #D2C4B3",
    marginBottom: "28px",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  logo: {
    width: "58px",
    height: "58px",
    objectFit: "contain",
    background: "#FBF7EF",
    border: "1px solid #D2C4B3",
    borderRadius: "10px",
    padding: "6px",
  },
  label: {
    margin: "0 0 6px",
    color: "#6F765D",
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
  },
  h1: {
    margin: 0,
    color: "#334052",
    fontSize: "30px",
    lineHeight: 1.12,
  },
  signature: {
    margin: 0,
    color: "#746B60",
    maxWidth: "280px",
    textAlign: "right",
    lineHeight: 1.35,
    fontSize: "14px",
  },
  hero: {
    background: "#FBF7EF",
    border: "1px solid #D2C4B3",
    borderRadius: "22px",
    padding: "28px",
    marginBottom: "20px",
    boxShadow: "0 10px 24px rgba(63,55,47,0.06)",
  },
  heroTitle: {
    margin: "0 0 10px",
    color: "#334052",
    fontSize: "34px",
    lineHeight: 1.1,
  },
  heroText: {
    margin: 0,
    color: "#5D554B",
    fontSize: "17px",
    lineHeight: 1.45,
    maxWidth: "820px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
    marginTop: "18px",
  },
  card: {
    background: "#FBF7EF",
    border: "1px solid #D2C4B3",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 8px 18px rgba(63,55,47,0.05)",
  },
  cardMain: {
    background: "#EFE6D7",
    border: "2px solid #7F8A69",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 10px 22px rgba(63,55,47,0.08)",
  },
  cardTitle: {
    margin: "0 0 10px",
    color: "#334052",
    fontSize: "21px",
    lineHeight: 1.2,
  },
  cardText: {
    margin: "0 0 16px",
    color: "#5D554B",
    lineHeight: 1.42,
  },
  button: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "40px",
    padding: "9px 15px",
    borderRadius: "999px",
    background: "#E8DDCC",
    color: "#334052",
    textDecoration: "none",
    fontWeight: 900,
    border: "1px solid #D2C4B3",
  },
  buttonMain: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "40px",
    padding: "9px 15px",
    borderRadius: "999px",
    background: "#7F8A69",
    color: "white",
    textDecoration: "none",
    fontWeight: 900,
    border: "1px solid #7F8A69",
  },
  aside: {
    background: "#FBF7EF",
    border: "1px solid #D2C4B3",
    borderRadius: "18px",
    padding: "20px",
    marginTop: "18px",
  },
  list: {
    margin: "10px 0 0",
    paddingLeft: "20px",
    color: "#5D554B",
    lineHeight: 1.6,
  },
  note: {
    marginTop: "18px",
    color: "#746B60",
    fontSize: "14px",
    lineHeight: 1.45,
  },
};

export function HomePage() {
  const { setCurrentRole } = useRole();
  const setProfessionalRole = () => setCurrentRole(ROLE_PROFESSIONNELLE);

  return (
    <main style={s.page} aria-label="Accueil poste de pilotage ARTAG">
      <div style={s.wrap}>
        <header style={s.header}>
          <div style={s.brand}>
            <img style={s.logo} src="/logo-artag.png" alt="ARTAG" />
            <div>
              <p style={s.label}>Outil de parcours et d’appui insertion</p>
              <h1 style={s.h1}>Poste de travail RSA — activité indépendante</h1>
            </div>
          </div>
          <p style={s.signature}>Outil conçu par Sofia de los Rios dans le cadre de sa mission.</p>
        </header>

        <section style={s.hero}>
          <p style={s.label}>Accueil</p>
          <h2 style={s.heroTitle}>Choisir l’action utile maintenant</h2>
          <p style={s.heroText}>
            Une entrée claire pour piloter la file active, préparer les actions et sécuriser les traces Insertis,
            sans décor inutile ni informations fictives.
          </p>
        </section>

        <section style={s.grid} aria-label="Actions principales">
          {actionsPrincipales.map((action) => (
            <article key={action.titre} style={action.principal ? s.cardMain : s.card}>
              <h3 style={s.cardTitle}>{action.titre}</h3>
              <p style={s.cardText}>{action.texte}</p>
              <Link
                style={action.principal ? s.buttonMain : s.button}
                to={action.lien}
                onClick={setProfessionalRole}
              >
                {action.bouton}
              </Link>
            </article>
          ))}
        </section>

        <section style={s.aside}>
          <p style={s.label}>Méthode simple</p>
          <ul style={s.list}>
            {reperes.map((repere) => (
              <li key={repere}>{repere}</li>
            ))}
          </ul>
        </section>

        <p style={s.note}>
          Insertis reste l’outil officiel. Ce poste de travail sert à préparer, prioriser et reprendre les informations
          utiles sans ajouter de bruit visuel.
        </p>
      </div>
    </main>
  );
}
