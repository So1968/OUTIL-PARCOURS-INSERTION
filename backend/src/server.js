import { createApp } from "./app.js";

// Pas d'écoute externe ni de déploiement production au stade du socle.
// La future mise en production demandera une authentification et une base validées.
if (process.env.NODE_ENV === "production") {
  throw new Error("Serveur ARTAG non déployable en production : authentification, DB et ACL non activées.");
}

const port = Number(process.env.PORT || "3101");
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT invalide.");
}

createApp().listen(port, "127.0.0.1", () => {
  console.info(`API ARTAG de développement accessible localement sur 127.0.0.1:${port}; routes métier désactivées.`);
});
