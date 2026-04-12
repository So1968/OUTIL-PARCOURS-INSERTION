frontend/src/App.jsx

import React from "react";
import logoArtag from "../public/logo-artag.png";

const palette = {
  bg: "#FAF6EF",
  card: "#EFE4D2",
  cardAlt: "#E7DED0",
  primary: "#7A845F",
  secondary: "#A8B08D",
  accent: "#C2974A",
  text: "#3F372F",
  textSoft: "#6F6559",
  line: "#DCCFBE",
  whiteSoft: "#FAF8F3",
};

function ArtagLogo() {
  return (
    <div style={styles.logoWrap} aria-label="Logo ARTAG">
      <img src={logoArtag} alt="ARTAG" style={styles.logoImage} />
    </div>
  );
}

function DirectionDoorButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={styles.directionButton}
      aria-label="Accès direction"
      title="Accès direction"
    >
      <span style={styles.doorIcon}>
        <span style={styles.doorKnob} />
      </span>
      <span style={styles.directionLabel}>Direction</span>
    </button>
  );
}

function ParcoursEntryCard({ onClick }) {
  return (
    <button type="button" onClick={onClick} style={{ ...styles.entryCard, ...styles.entryCardLeft }}>
      <div style={styles.entryInnerCentered}>
        <div style={styles.parcoursTitleWrap}>
          <div style={styles.parcoursTitleLine1}>Parcours social</div>
          <div style={styles.parcoursTitleLine2}>socio-professionnel</div>
        </div>
        <p style={styles.entrySubtitleCentered}>
          Repérer la situation, consolider le socle, ouvrir les bons appuis
        </p>
      </div>
    </button>
  );
}

function TnsEntryCard({ onClick }) {
  return (
    <button type="button" onClick={onClick} style={{ ...styles.entryCard, ...styles.entryCardRight }}>
      <div style={styles.entryInnerCentered}>
        <h2 style={styles.entryTitleCentered}>Appui TNS</h2>
        <p style={styles.entrySubtitleCentered}>
          Clarifier l’activité, structurer les démarches, ajuster l’appui
        </p>
      </div>
    </button>
  );
}

function PathDecoration() {
  return (
    <svg
      viewBox="0 0 1200 180"
      preserveAspectRatio="none"
      style={styles.pathSvg}
      aria-hidden="true"
    >
      <path
        d="M20 115 C160 70, 240 150, 380 110 S610 55, 760 96 S1010 155, 1180 92"
        fill="none"
        stroke={palette.line}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M100 122 C240 86, 340 152, 470 118 S720 70, 860 108 S1040 140, 1140 104"
        fill="none"
        stroke={palette.secondary}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

export default function App() {
  const openParcours = () => {
    console.log("Entrée : Parcours social / socio-professionnel");
  };

  const openTns = () => {
    console.log("Entrée : Appui TNS");
  };

  const openDirection = () => {
    console.log("Accès direction");
  };

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <ArtagLogo />
          </div>

          <div style={styles.headerCenter}>
            <h1 style={styles.title}>Outil de parcours et d’appui</h1>
          </div>

          <div style={styles.headerRight}>
            <DirectionDoorButton onClick={openDirection} />
          </div>
        </header>

        <section style={styles.hero}>
          <p style={styles.subtitle}>
            Un outil partagé pour repérer, approfondir, orienter et assurer la
            continuité
          </p>
        </section>

        <main style={styles.main}>
          <div style={styles.entriesWrap}>
            <ParcoursEntryCard onClick={openParcours} />
            <TnsEntryCard onClick={openTns} />
          </div>

          <div style={styles.pathWrap}>
            <PathDecoration />
          </div>
        </main>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: palette.bg,
    color: palette.text,
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  shell: {
    maxWidth: 1240,
    margin: "0 auto",
    padding: "24px 24px 40px",
  },

  header: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: 16,
    minHeight: 82,
  },

  headerLeft: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
  },

  headerCenter: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  },

  headerRight: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
  },

  logoWrap: {
    display: "flex",
    alignItems: "center",
  },

  logoImage: {
    display: "block",
    height: 54,
    width: "auto",
    objectFit: "contain",
  },

  title: {
    margin: 0,
    fontSize: 34,
    lineHeight: 1.15,
    fontWeight: 700,
    color: palette.text,
  },

  hero: {
    marginTop: 18,
    marginBottom: 34,
    display: "flex",
    justifyContent: "center",
  },

  subtitle: {
    margin: 0,
    maxWidth: 760,
    textAlign: "center",
    fontSize: 17,
    lineHeight: 1.55,
    color: palette.textSoft,
  },

  directionButton: {
    border: `1px solid ${palette.line}`,
    background: palette.whiteSoft,
    color: palette.text,
    borderRadius: 999,
    padding: "8px 12px 8px 10px",
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
  },

  directionLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: palette.textSoft,
  },

  doorIcon: {
    position: "relative",
    width: 18,
    height: 28,
    border: `2px solid ${palette.primary}`,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    background: "transparent",
    display: "inline-block",
    boxSizing: "border-box",
  },

  doorKnob: {
    position: "absolute",
    right: 3,
    top: 14,
    width: 3,
    height: 3,
    borderRadius: "50%",
    background: palette.accent,
  },

  main: {
    position: "relative",
    paddingTop: 18,
    paddingBottom: 40,
  },

  entriesWrap: {
    position: "relative",
    zIndex: 2,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(300px, 1fr))",
    gap: 28,
    alignItems: "stretch",
  },

  entryCard: {
    border: `1px solid ${palette.line}`,
    cursor: "pointer",
    minHeight: 245,
    padding: 0,
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(63,58,52,0.05)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  },

  entryCardLeft: {
    background: palette.card,
    borderRadius: "42px 54px 46px 58px / 34px 42px 38px 44px",
  },

  entryCardRight: {
    background: palette.cardAlt,
    borderRadius: "58px 40px 54px 44px / 42px 34px 46px 36px",
  },

  entryInnerCentered: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    padding: "34px 34px 30px",
  },

  parcoursTitleWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 14,
  },

  parcoursTitleLine1: {
    fontSize: 30,
    lineHeight: 1.1,
    fontWeight: 700,
    color: palette.primary,
    textAlign: "center",
  },

  parcoursTitleLine2: {
    fontSize: 30,
    lineHeight: 1.1,
    fontWeight: 700,
    color: palette.primary,
    textAlign: "center",
  },

  entryTitleCentered: {
    margin: "0 0 14px",
    fontSize: 30,
    lineHeight: 1.15,
    fontWeight: 700,
    color: palette.primary,
    textAlign: "center",
  },

  entrySubtitleCentered: {
    margin: 0,
    fontSize: 17,
    lineHeight: 1.6,
    color: palette.text,
    maxWidth: 470,
    textAlign: "center",
  },

  pathWrap: {
    position: "relative",
    marginTop: -8,
    zIndex: 1,
    height: 120,
  },

  pathSvg: {
    width: "100%",
    height: "100%",
    display: "block",
  },
};
