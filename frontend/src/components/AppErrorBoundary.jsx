import { Component } from "react";

export class AppErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="status-page">
          <section className="status-page__card" role="alert">
            <p className="status-page__label">Erreur d’affichage</p>
            <h1>L’espace demandé n’a pas pu s’ouvrir.</h1>
            <p>
              Les données locales ne sont pas effacées. Rechargez la page ou revenez à l’accueil avant de reprendre la saisie.
            </p>
            <a href="/">Retour à l’accueil</a>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
