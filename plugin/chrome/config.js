const BASE_DOMAIN = "greenscore.alwaysdata.net";
const BASE_URL = `https://${BASE_DOMAIN}`;

const CONFIG = {
    BACKEND: {
      PLUGIN_BACKEND_URL: `${BASE_URL}/plugin`, // URL du backend du plugin
      
      DOMAIN: BASE_DOMAIN, // Utilisé pour récupérer l'ID utilisateur
      
      BASE_URL, // URL du site Greenscore
      
      LOGIN_URL: `${BASE_URL}/login`, // URL de la page de connexion
      DETAILS_URL: `${BASE_URL}/derniere-page-consultee`, // URL de la page de détails
      // Clé retirée à l'import (constat S-02 du CDCT) : à révoquer chez Electricity Maps.
      // Ne jamais versionner de clé ici ; la v3 n'appelle plus d'API d'intensité (ADR-0005).
      ELECTRICITY_MAP_API_KEY: ""
    }
  };
  
  if (typeof browser !== 'undefined') {
  } else if (typeof module !== 'undefined') {
    module.exports = CONFIG;
  }