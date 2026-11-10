# Recette v2 — constats sur le site public (sans compte)

- **Date :** 16/10/2026
- **Cible :** https://greenscore.alwaysdata.net (production)
- **Navigateur :** navigateur intégré (moteur Chromium), sans extension
- **Méthode :** lecture des pages publiques ; mesures avec l'API Resource Timing dans la page ; en-têtes HTTP des fichiers statiques. Aucun formulaire soumis, aucune écriture.

## 1. Poids et sobriété de notre propre page d'accueil (T11)

| Mesure | Valeur |
|---|---|
| Requêtes | 33 |
| Octets transférés | **3 087 224 o (≈ 3,09 Mo)** |
| dont images (16) | 2 218 019 o (72 %) |
| dont scripts (11) | 669 427 o |
| dont CSS (1) | 97 617 o |
| dont polices et préchargements (4) | 95 772 o |
| Nœuds DOM | 453 |
| Domaines tiers chargés | `fonts.googleapis.com`, `cdnjs.cloudflare.com`, `img.youtube.com` |

**Constats :**
- **Les scripts et le CSS sont servis sans compression.** Le fichier principal `arcjmX7f.js` fait 566 209 o, sans en-tête `Content-Encoding`, et la taille transférée est égale à la taille décodée. Avec gzip ou brotli, ces fichiers seraient typiquement 3 à 5 fois plus légers. C'est le premier conseil d'éco-conception… que le site ne s'applique pas.
- Le cache des fichiers statiques est bien configuré (`Cache-Control: public, max-age=31536000, immutable`).
- **Trois services tiers sont chargés à chaque visite** : polices Google, CDN, miniatures YouTube. Ils reçoivent l'adresse IP du visiteur, ce qui n'est pas mentionné dans la politique de confidentialité (§3).

**Note de la page d'accueil selon les modèles :**

| Modèle | Calcul | Résultat |
|---|---|---|
| v2, plugin **Chrome** (volume transféré = 0, A-02) | (0,002875 Gio × 0,065 + 33 × 0,00015) = 0,005137 kWh | 0,26 g (B) si l'intensité vaut 50 g/kWh ; **2,27 g (G)** avec la valeur par défaut de 442 |
| v2, plugin **Firefox** (pas de compression, donc pas de division) | 0,002875 × 0,519 + 0,002875 × 0,065 + 33 × 0,00015 = 0,006629 kWh | 0,33 g (B) avec 50 g/kWh ; 2,93 g (G) avec 442 |
| v3 (SWDM v4), France (50 g/kWh, illustratif) | 0,003087 Go × 86,5 g/Go | **0,27 g → D** |
| v3 (SWDM v4), pays inconnu (494 g/kWh) | 0,003087 Go × 148,2 g/Go | 0,46 g → F |

→ La même page obtient **B ou G** selon l'état de l'API d'intensité, et des valeurs **différentes de 29 %** entre Firefox et Chrome. Avec le modèle v3, notre propre page d'accueil serait notée **D**. L'objectif ENF-PER-3 (note A) demande donc d'optimiser nos images et d'activer la compression : c'est un « avant / après » facile à démontrer sur notre propre site.

## 2. Contenu de la page d'accueil

| # | Constat | Gravité |
|---|---|---|
| H1 | La section « Comment le GreenScore est-il calculé ? » cite le **temps de chargement** comme critère. **Le code ne l'utilise pas** : il est calculé, mais n'entre pas dans la formule (`calculateCarbonEmissions`). | Majeure (information fausse) |
| H2 | L'échelle affichée s'arrête à « G ≤ 1,75 gCO2e », alors que le code attribue G à **toute** valeur ≥ 1,50 g. Rien n'est dit au-delà de 1,75 g, alors qu'une page moyenne dépasse souvent ce seuil avec la v2 (intensité par défaut de 442). | Majeure |
| H3 | L'échelle n'est **pas sourcée**. Elle n'est pas l'EcoIndex, que la documentation du projet évoquait. | Majeure |
| H4 | Des chiffres-clés sans source : « 5,5 milliards d'internautes en 2025 », « 34 milliards d'équipements en 2019 », « 47 % du poids des sites = images », « 300 kt de CO2 pour la vidéo », « −15 % de CO2 possibles grâce à l'éco-conception ». | Mineure |
| H5 | Le conseil « Videz régulièrement le cache et les cookies » est **contre-productif** : le cache évite de retransférer les données, et le vider **augmente** les transferts. | Majeure (conseil faux) |
| H6 | Mélange de langues dans la version anglaise : « these results enable**comparer efficacement** of energy consumption… » (traduction incomplète). | Mineure |

## 3. Politique de confidentialité et CGU (T10)

| # | Ce qu'annonce le site | Ce que fait le code (CDCT §2.3) | Gravité |
|---|---|---|---|
| C1 | Données collectées : identité, préférences, IP, navigateur, système, horodatage, cookies. **Aucune mention de l'historique de navigation.** | Le plugin envoie l'**URL complète** de chaque page visitée, avec le domaine, le volume, les requêtes, le pays et l'identifiant de l'utilisateur (P-01). | **Critique** |
| C2 | Partage « uniquement avec nos prestataires (hébergement, maintenance) » | L'IP est envoyée à **ipwhois.app** ; le plugin appelle **Electricity Maps** ; le serveur appelle **restcountries.com** et **flagcdn.com** ; les pages chargent **Google Fonts, cdnjs, YouTube** (P-02). | Majeure |
| C3 | Bases légales : contrat, intérêt légitime, obligation légale | Le suivi de la navigation devrait reposer sur un **consentement** explicite (CDCF §7.6). | Majeure |
| C4 | Données du compte conservées « jusqu'à la désinscription » | À la suppression du compte, les mesures sont conservées avec `user_id = NULL`, URL comprises (D-02). | Majeure |
| C5 | « Un bandeau vous informe sur les cookies lors de votre première visite » | Aucun bandeau affiché lors de la première visite (navigateur neuf). | Mineure |
| C6 | CGU §6 : « Vous ne pouvez pas reproduire, distribuer ou utiliser [les codes] sans autorisation écrite » | Contradictoire avec l'objectif de **publication open source** (EF-OSS). | À corriger lors du choix de licence |

## 4. Parcours sans compte

- « Dernière page consultée » sans paramètre **redirige vers la page de connexion**.
- Le cas d'usage réel d'un utilisateur sans compte passe par le bouton « détails » du popup, qui ajoute à l'URL **l'adresse complète de la page analysée** (P-03). Ce parcours sera testé **avec l'extension**. Nous ne l'avons pas reproduit à la main avec des valeurs inventées, car cette route écrit en base pour un utilisateur connecté (S-04).

## 5. Non testé à ce stade

- **Fiche Chrome Web Store** (version, nombre d'utilisateurs, date de mise à jour) : elle ne s'affiche pas dans le navigateur de test. **À relever manuellement** pour le rapport.
- Tous les scénarios avec l'extension et un compte (T1 à T9) : voir le [plan de tests](plan-de-tests.md).
