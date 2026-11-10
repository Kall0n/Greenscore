# Recette v2 — résultats des tests de l'extension et du site

- **Dates :** 16 et 17/10/2026
- **Environnement :** Chrome (Windows), extension GreenScore installée depuis le Chrome Web Store, compte de test connecté sur https://greenscore.alwaysdata.net
- **Méthode, pour chaque page :**
  1. relevé de la **vérité terrain** dans la page avec l'API Resource Timing : requêtes, octets réellement transférés, nœuds DOM ;
  2. lecture de ce que GreenScore a enregistré (« Dernière page consultée ») ;
  3. lecture de la **variation du total** dans « Mes données ».
- **Colonne v3 :** calculée avec notre module [`calc/`](../../calc/) (SWDM v4, intensité annuelle France issue des données Ember, version `swdm4-ember-v1`).
- **Vidéos :** [`videos/`](videos/). Elles filment l'onglet ; le popup de l'extension, situé hors de l'onglet, n'y apparaît pas.

> ⚠️ Le compte de test contenait déjà la navigation personnelle de l'utilisateur au moment des tests. Les domaines personnels ne sont ni filmés ni reproduits ici.

## Synthèse : ce que la v2 affiche face à la réalité

| Test | Page | Réalité (transféré · requêtes) | **GreenScore v2** | **v3 (SWDM v4)** | Vidéo |
|---|---|---|---|---|---|
| T6b | Image JPEG unique | **14,7 Mo** · 1 | **A — « Bravo ! Ce site est un modèle de durabilité 🌿 »** (émission : « Données indisponibles ») | **1,26 g → F** | [T6](videos/greenscore-v2-T6-image-14Mo-notee-A.gif) |
| T1c | Wikipédia « Centre de données » | **596 Ko** · 36 | **G — « Alerte ! Impact environnemental majeur 🚨 » — « Destructeur des Écosystèmes »**, 2,6 g | **0,05 g → A** | [T1](videos/greenscore-v2-T1-wikipedia-596Ko-notee-G.gif) |
| T1b | Wikipédia « Informatique durable » | 231 Ko · 31 | **E**, 1,13 g, 17 requêtes | 0,02 g → A+ | — |
| T1a | Wikipédia « Empreinte carbone » | 444 Ko · 40 | **A**, 0,07 g, **1 requête** (mesure vide) | 0,04 g → A+ | — |
| T3-5 | Panier Amazon | 1,16 Mo · 118 | **B**, 0,49 g, 83 requêtes, « 46,6 s » de chargement | 0,10 g → B | [T3](videos/greenscore-v2-T3-parcours-amazon-panier.gif) |
| T6a | example.com | ≈ 1 Ko · 2 | A, 0,01 g | 0,0001 g → A+ | [T6](videos/greenscore-v2-T6-image-14Mo-notee-A.gif) |

**En une phrase :** la v2 note **A** une image de 14,7 Mo et **G** un article Wikipédia 25 fois plus léger. Le modèle v3 donne l'ordre inverse, qui est le bon.

## T0 — État initial du compte

| Indicateur affiché | Valeur | Commentaire |
|---|---|---|
| Total depuis la création du compte | **2 833,87 gCO2e** | Compte créé le jour même, quelques minutes de navigation : ≈ 2,8 kg, soit « 2,1 trajets Paris-Londres en train » |
| « Moyenne de l'empreinte carbone sur un jour » | **0,8 g** (autres utilisateurs : 1,7 g) | Incohérent avec 2 834 g en **un seul jour** → c'est une moyenne **par ligne enregistrée**, pas par jour (D-03) |
| Message | « Votre empreinte carbone quotidienne moyenne est faible par rapport à la moyenne globale » | Fondé sur l'indicateur faux ci-dessus |
| Badge | **A — « Gardien des Écosystèmes »** | Note maximale pour 2,8 kg en une journée |
| Site n° 1 du top 5 | Moteur de recherche ≈ 900 g | Invraisemblable pour des pages de résultats de quelques centaines de Ko |

## T1 / T4 / T5 — Pages Wikipédia, rechargement, cache

| | Réalité | GreenScore v2 | Variation du total | v3 |
|---|---|---|---|---|
| **T1a** « Empreinte carbone » | 40 req. · 444 163 o · 6 704 nœuds DOM | **A · 0,07 g · 1 requête** ; taille, pays, équivalents « Données indisponibles » | **+0,07 g** | 0,038 g · A+ |
| **T1b** « Informatique durable » | 31 req. · 230 625 o | **E · 1,13 g · 17 requêtes** · 1,6 s ; taille « indisponible » | **+1,20 g** | 0,020 g · A+ |
| **T4** même page rechargée (23 ressources sur 30 en cache) | 30 req. · 149 573 o (−35 %) | **E · 1,13 g · 17 requêtes** · 1,3 s | **+1,66 g** | 0,013 g · A+ |
| **T1c** « Centre de données » | 36 req. · 596 319 o · 8 946 nœuds DOM | **G · 2,6 g · 39 requêtes** · 3,5 s | +2,60 g | 0,051 g · A |

**Constats :**
1. **Mesure perdue (T1a).** La vraie mesure n'est jamais enregistrée. GreenScore affiche et comptabilise la mesure **quasi vide** envoyée au **début** de la navigation (1 requête sur 40). *Confirme A-07.*
2. **Double ligne (T1b).** La variation du total (+1,20 g) est égale à la mesure affichée (1,13 g) **plus** une mesure quasi vide (0,07 g). *Confirme A-07.*
3. **Comptes impossibles à réconcilier (T4).** Le total augmente de 1,66 g alors que la page est affichée à 1,13 g. La redirection « Sobriété numérique → Informatique durable » crée des lignes invisibles.
4. **Le cache est ignoré (T4).** 35 % de données en moins, mais un score identique. *Confirme A-04.*
5. **Le score ne dépend que du nombre de requêtes et de l'intensité.**
   - 1,13 g = 17 × 0,15 Wh × 442 ;
   - 2,6 g = 39 × 0,15 Wh × 444 ;
   - 0,07 g = 1 × 0,15 Wh × 442.
   
   Sur Chrome, la taille de la page n'est **jamais** disponible (*A-02*).
6. **Requêtes sous-comptées** : 17 sur 31, 1 sur 40. Seul T1c (39 sur 36) est proche de la réalité.
7. **Surestimation** d'un facteur **50 à 57** par rapport au SWDM v4 sur les pages Wikipédia.

## T3 — Parcours Amazon : accueil → recherche « gourde inox » → fiche produit → ajout au panier → panier

| Étape | Réalité (transféré · requêtes · nœuds DOM) | v3 |
|---|---|---|
| 1. Accueil (vidéo en lecture automatique) | 12,50 Mo · 150 · 2 251 | 1,07 g · F |
| 2. Résultats de recherche | 8,79 Mo · 194 · 11 385 | 0,75 g · F |
| 3. Fiche produit | 5,62 Mo · 250 · 8 447 | 0,48 g · F |
| 4. Confirmation d'ajout au panier | 0,97 Mo · 134 · 2 769 | 0,08 g · B |
| 5. Panier | 1,16 Mo · 118 · 2 587 | 0,10 g · B |
| **Parcours complet** | **29,04 Mo · 846 requêtes** | **2,49 g** (0,50 g par page en moyenne · F) |

**Ce que montre GreenScore v2 :**
- **Une seule page** : la dernière (panier) → **B, 0,49 g, 83 requêtes**. Aucune vue du parcours : la fonctionnalité de session n'existe pas (objectif O10).
- **Le total augmente de +20,53 g** pour le parcours, soit **≈ 8 fois** l'estimation v3. Il est impossible de savoir quelle page a coûté quoi.
- **Temps de chargement affiché : 46,6 s** pour une page chargée en ≈ 2 s. Le plugin mesure le temps entre la première et la dernière requête, y compris pendant la consultation de la page.
- **L'intensité change d'une page à l'autre.** Pour le panier : 0,49 g ÷ (83 × 0,15 Wh) ≈ **39 g/kWh**, l'intensité française du moment. Pour les pages Wikipédia, quelques minutes plus tôt : **442 g/kWh**, la valeur par défaut. C'est un écart d'un facteur 11 pour le même utilisateur au même endroit. *Confirme A-05.*
- **Conséquence :** le panier Amazon (1,16 Mo) est noté **B**, mieux que l'article Wikipédia « Informatique durable » (231 Ko), noté **E**.

## T6 — Poids contre requêtes

| | Réalité | GreenScore v2 | Variation du total | v3 |
|---|---|---|---|---|
| example.com | ≈ 1 Ko · 2 requêtes | A · 0,01 g · 2 requêtes | — | 0,0001 g · A+ |
| Image JPEG 10 109 × 4 542 px | **14 679 474 o** · 1 requête | **A — « Bravo ! Ce site est un modèle de durabilité 🌿 »** ; émission et requêtes « Données indisponibles » | **+0,09 g** (avec example.com) | **1,26 g · F** |

**Constat :** un fichier de 14,7 Mo, soit **12 fois le poids** du panier Amazon, ne coûte presque rien en v2 et reçoit les félicitations de l'outil. C'est la démonstration directe du constat **A-01** (le poids ne compte pas) et du constat **A-02** (volume nul sur Chrome).

## T7 — Application monopage (documentation Svelte, navigation sans rechargement)

| | Réalité | GreenScore v2 | Variation du total | v3 |
|---|---|---|---|---|
| 5 pages consultées sans rechargement (Overview → Getting started → .svelte files → What are runes? → $state) | 59 requêtes · 328 064 o au total | Dernière page affichée : **« What are runes? »** (et non « $state », la vraie dernière page) · B · 0,46 g · 7 requêtes | **+1,32 g** (≈ 20 requêtes comptées sur 59) | 0,028 g au total · A+ |

**Constats :**
- **La dernière page n'est pas enregistrée.** La navigation rapide déclenche le verrou d'envoi (`sendInProgress`) et le délai d'une seconde, et les envois sont abandonnés. *Confirme A-08.*
- **Seulement ≈ 1/3 des requêtes sont comptées**, mais chacune est surévaluée à 0,15 Wh. Le total reste ≈ **47 fois** l'estimation v3.
- Le test sur YouTube a été remplacé par ce site neutre, pour ne pas filmer un fil de recommandations personnel. Quelques secondes sur l'accueil YouTube avaient ajouté **+11,97 g** au compte.

## T9 — Organisation (partiel : un seul membre)

Organisation de test « Recette GreenScore 2026 » créée depuis « Mon compte → Mon organisation → Créer mon organisation », sans SIRET (champ optionnel). Le 2ᵉ compte de test ne l'a **pas encore rejointe**.

| Constat | Détail | Lien |
|---|---|---|
| **L'historique passé du membre est attribué à l'organisation** | Dès sa création, l'organisation affiche un total de **2 884,21 g**, c'est-à-dire tout l'historique de l'administrateur avant même que l'organisation existe | A-09, EF-ORG |
| **Deux échelles contradictoires pour les mêmes données** | Avec un seul membre, l'organisation affiche **240,3 g par jour** et le badge **G « Grand consommateur »**. Le même compte, dans « Mes données », affiche **0,8 g par jour** et le badge **A « Gardien des Écosystèmes »**, soit un écart d'un facteur ≈ 300 | C5, A-09, D-03 |
| **Vie privée des membres** | L'administrateur voit le **nom complet et l'e-mail** de chaque membre. Avec 1 ou 2 membres, le « top 5 des sites » de l'organisation est celui **d'une personne identifiable** | EF-ORG-2, ENF-VIE-4 |
| Ergonomie | Le bouton de création d'organisation est libellé « Inscription ». Le code d'invitation (8 caractères) apparaît dans l'URL (`/inscription-organisation/<code>`) | — |

*À compléter : rattachement du 2ᵉ compte, vue « membre », vue administrateur avec deux membres, expulsion.*

## Constats d'interface relevés pendant les tests

| # | Constat | Occurrences |
|---|---|---|
| I1 | Sur « Dernière page consultée », les encarts **« Conseils pour la navigation » et « Conseils pour le développement » sont inversés** (ex. « Désactivez les logs en mode production » côté navigation, « Fermez les onglets inutilisés » côté développement). Sur « Mes données », ils sont corrects | 9 affichages sur 9 |
| I2 | Les **équivalents changent aléatoirement** à chaque chargement ; certains sont démesurés (« 21 807,9 litres d'eau du robinet ») | Chaque chargement |
| I3 | « Données indisponibles » apparaît jusqu'à **cinq fois** sur la page de détail, sans explication | T1a, T6b |
| I4 | « Bravo ! Ce site est un modèle de durabilité » s'affiche pour une mesure **échouée** (T1a) et pour une image de **14,7 Mo** (T6b) | 2 |
| I5 | Badges de « jeu » (« Gardien des Écosystèmes », « Destructeur des Écosystèmes », « Explorateur Imprudent ») attribués sur la base de chiffres faux | Systématique |
| I6 | Le temps de chargement affiché inclut le temps passé sur la page (46,6 s pour le panier Amazon) | T3 |
| I7 | Les pages « Dernière page consultée » et « Mes données » sont lentes à s'afficher : nos captures d'écran expiraient régulièrement après le chargement (graphiques animés, page d'accueil de 3 Mo non compressée) | Fréquent |
| I8 | L'inscription demande prénom et nom (non nécessaires) et regroupe CGU + confidentialité en une seule case ; pas de consentement spécifique au suivi de navigation | Formulaire d'inscription |

## Ce que ces tests prouvent pour le projet (lien avec le CDCF)

| Objectif (CDCF §1.4) | Situation de référence mesurée (v2) | Cible v3 |
|---|---|---|
| **O1** Volume mesuré | Chrome : **taille « indisponible »** sur les 9 pages consultées dans « Dernière page consultée » | Écart < 5 % vs vérité terrain |
| **O3** Reproductibilité | Même utilisateur, même pays, quelques minutes d'écart : intensité de **442 ou 39 g/kWh** (×11) | CV < 10 % |
| **O5** Sensibilité au poids | Image de 14,7 Mo notée **A**, page de 596 Ko notée **G** | Proportionnel au poids |
| **O10** Sessions | Un parcours de 5 pages produit **+20,5 g** sans aucun détail par page | Bilan de session par domaine |
| Fiabilité du total | Mesures **perdues** (T1a, T7), **doublées** (T1b) ou **invisibles** (T4) | Somme des pages = total |
| Ordre de grandeur | **8 à 57 fois** l'estimation SWDM v4 | Conforme au modèle de référence (O4) |

## Vidéos

> ⚠️ **Les fichiers vidéo ont été perdus** lors de la suppression du dossier du projet (novembre 2026). Les tableaux ci-dessus conservent toutes les mesures. Les vidéos sont **à réenregistrer** en rejouant les mêmes scénarios.

| Fichier | Contenu |
|---|---|
| [`greenscore-v2-T1-wikipedia-596Ko-notee-G.gif`](videos/greenscore-v2-T1-wikipedia-596Ko-notee-G.gif) | Article Wikipédia → note G « Destructeur des Écosystèmes » → total |
| [`greenscore-v2-T3-parcours-amazon-panier.gif`](videos/greenscore-v2-T3-parcours-amazon-panier.gif) | Parcours Amazon complet jusqu'au panier → note du panier → total (+20,5 g) |
| [`greenscore-v2-T6-image-14Mo-notee-A.gif`](videos/greenscore-v2-T6-image-14Mo-notee-A.gif) | example.com puis image de 14,7 Mo → « modèle de durabilité » |
| [`greenscore-v2-T7-application-monopage-svelte.gif`](videos/greenscore-v2-T7-application-monopage-svelte.gif) | 5 navigations internes → la dernière page n'est pas celle affichée |

*Les vidéos T3 montrent la zone de livraison approximative proposée par Amazon (code postal déduit de l'adresse IP). Vérifier si c'est acceptable avant de les diffuser.*

## Limites de cette recette

- **Firefox non testé** : seule la version Chrome a été mesurée. L'écart Firefox / Chrome (O2) reste à mesurer.
- La vérité terrain utilise l'API Resource Timing. Les ressources tierces sans autorisation (`Timing-Allow-Origin`) n'y donnent pas leur taille : jusqu'à 54 requêtes sur 194 pour Amazon. **Les octets réels sont donc légèrement supérieurs** aux valeurs indiquées, ce qui ne change aucune conclusion. Le banc de test du Sprint 2 utilisera l'export HAR, plus complet.
- Le popup de l'extension n'a pas pu être filmé par l'agent de test. Une vidéo complémentaire avec l'enregistrement d'écran Windows (`Win + Alt + R`) permettrait de le montrer.
- Les causes internes (verrou d'envoi, intensité par défaut) sont déduites du code et des chiffres observés. Elles seront confirmées par des tests unitaires au Sprint 2.
