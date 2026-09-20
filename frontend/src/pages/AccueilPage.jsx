import { Link } from "react-router-dom";
import { ACCOMPAGNEMENT_ROLES, CONTINUITE_ROLES, PARCOURS_ROLES, PORTE_DIRECTION_ROLES, roleIsAllowed } from "../auth/access";
import { useRole } from "../auth/useRole";

const entreesPrincipales = [
  {
    titre: "Je suis avec une personne",
    texte: "Faire l’évaluation avec elle, sans afficher les notes professionnelles.",
    lien: "/evaluation-personne",
    bouton: "Ouvrir l’évaluation",
    roles: ACCOMPAGNEMENT_ROLES,
  },
  {
    titre: "Je regarde ma file active",
    texte: "Voir les urgences, les actions à faire, les échéances et les traces Insertis.",
    lien: "/pilotage-actions",
    bouton: "Ouvrir la file active",
    roles: ACCOMPAGNEMENT_ROLES,
  },
];

const raccourcis = [
  { label: "Parcours social / socio-professionnel", to: "/parcours-social-socio-professionnel", roles: PARCOURS_ROLES },
  { label: "Accompagnement global", to: "/accompagnement-global", roles: ACCOMPAGNEMENT_ROLES },
  { label: "Continuité de service", to: "/continuite-service", roles: CONTINUITE_ROLES },
  { label: "Direction", to: "/direction", roles: PORTE_DIRECTION_ROLES },
];

export function AccueilPage() {
  const { currentRole } = useRole();
  const entreesVisibles = entreesPrincipales.filter(({ roles }) => roleIsAllowed(currentRole, roles));
  const raccourcisVisibles = raccourcis.filter(({ roles }) => roleIsAllowed(currentRole, roles));

  return (
    <main className="accueil-simple">
      <div className="accueil-simple__wrap">
        <header className="accueil-simple__header">
          <img className="accueil-simple__logo" src="/logo-artag.png" alt="ARTAG" />
          <div>
            <p className="accueil-simple__label">Outil de parcours et d’appui insertion</p>
            <h1>Qu’est-ce que je fais maintenant ?</h1>
            <p className="accueil-simple__intro">
              Choisir le point d’entrée utile. Les informations détaillées restent dans le dossier et les espaces autorisés.
            </p>
          </div>
        </header>

        {entreesVisibles.length > 0 ? (
          <section className="accueil-simple__grid" aria-label="Actions principales">
            {entreesVisibles.map((entree) => (
              <Link className="accueil-simple__card" key={entree.lien} to={entree.lien}>
                <h2>{entree.titre}</h2>
                <p>{entree.texte}</p>
                <span>{entree.bouton}</span>
              </Link>
            ))}
          </section>
        ) : (
          <section className="accueil-simple__aide">
            Ce profil ouvre uniquement les espaces nécessaires à sa mission. Utilisez les accès proposés ci-dessous.
          </section>
        )}

        <nav className="accueil-simple__raccourcis" aria-label="Autres espaces autorisés">
          {raccourcisVisibles.map(({ label, to }) => (
            <Link key={to} to={to}>{label}</Link>
          ))}
        </nav>

        <section className="accueil-simple__aide">
          <strong>Repère :</strong> la page personne sert à échanger. La file active sert à prioriser. Le dossier professionnel sert à analyser et tracer.
        </section>

        <p className="accueil-simple__signature">Outil conçu par Sofia de los Rios dans le cadre de sa mission.</p>
      </div>
    </main>
  );
}
