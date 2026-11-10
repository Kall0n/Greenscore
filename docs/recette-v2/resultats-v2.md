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

## Vidéos avant / après

Animations générées le 10/11/2026 à partir des **mesures de cette recette**. *Avant* : ce que GreenScore v2 affichait. *Après* : le calcul v3 (SWDM v4, intensité annuelle France 44,18 gCO2e/kWh, Ember) appliqué aux octets mesurés pendant la recette. Chaque vidéo existe en MP4 (1280 × 720, 30 i/s) et en GIF (960 px, 12 i/s).

| Vidéo | Ce qu'elle montre |
|---|---|
| [`avant-apres-T6-image-14Mo`](videos/avant-apres-T6-image-14Mo.mp4) ([GIF](videos/avant-apres-T6-image-14Mo.gif)) | Image de 14,7 Mo : v2 **A** « modèle de durabilité » → v3 **F**, 1,26 g |
| [`avant-apres-T1-wikipedia-596Ko`](videos/avant-apres-T1-wikipedia-596Ko.mp4) ([GIF](videos/avant-apres-T1-wikipedia-596Ko.gif)) | Article de 596 Ko : v2 **G**, 2,6 g → v3 **A**, 0,051 g (×51) |
| [`avant-apres-T3-parcours-amazon`](videos/avant-apres-T3-parcours-amazon.mp4) ([GIF](videos/avant-apres-T3-parcours-amazon.gif)) | Parcours de 5 pages : v2 +20,53 g sans détail → v3 2,49 g, détaillé page par page |
| [`avant-apres-T7-application-monopage`](videos/avant-apres-T7-application-monopage.mp4) ([GIF](videos/avant-apres-T7-application-monopage.gif)) | Application monopage : v2 +1,32 g, mauvaise dernière page → v3 0,028 g sur 5 pages vues |
| [`avant-apres-synthese`](videos/avant-apres-synthese.mp4) ([GIF](videos/avant-apres-synthese.gif)) | Les quatre tests côte à côte |

Sources : [`videos/source/`](videos/source/) (`scene.html` + `render.mjs`, rendu image par image avec Chromium puis encodage ffmpeg). Le plugin corrigé (1.7.0) a aussi été contrôlé en conditions réelles contre la vérité terrain réseau : [`bench/results/plugin-v2-corrige-chrome-2026-11-10.md`](../../bench/results/plugin-v2-corrige-chrome-2026-11-10.md).

## Vidéos avant / après filmées dans Chromium

Enregistrées les 10 et 11/11/2026 dans Chromium 159, **avec les deux extensions installées en même temps** : GreenScore 1.6.2 (Chrome Web Store, *avant*) et GreenScore 1.7.0 (`plugin/chrome`, *après*). Les deux observent exactement le même chargement. Profil neuf à chaque site ; bandeaux cookies **refusés** quand le bouton de refus est reconnu.

Chaque vidéo (≈ 40 s) enchaîne quatre écrans :
1. **l'onglet filmé** (CDP screencast) avec, en direct, ce que Chromium reçoit réellement par le réseau ;
2. **1re visite** (cache vidé) : les vrais popups des deux extensions, les octets comptés par chacune et leur précision ;
3. **2e visite** : la même page rechargée **avec le cache du navigateur** ;
4. **le détail** : précision du poids mesuré, requêtes, intensité carbone, formule, résultat, 2e visite, écart restant et corrections.

| Vidéo | Réalité (1re visite) | Avant · 1.6.2 | Après · 1.7.0 | 2e visite (cache) : réalité · v2 · v3 |
|---|---|---|---|---|
| [`image-14Mo`](videos/chromium-avant-apres-image-14Mo.mp4) ([GIF](videos/chromium-avant-apres-image-14Mo.gif)) | 14,04 Mo · 2 req. | 0 octet · **0,07 g** « 10,57x inférieur à la moyenne » | 14,03 Mo (100 %) · 1,20 g · **F** | 1,6 Ko · 0,08 g · **0 g** |
| [`wikipedia`](videos/chromium-avant-apres-wikipedia.mp4) ([GIF](videos/chromium-avant-apres-wikipedia.gif)) | 706 Ko · 46 req. | 0 octet · 0,50 g | 643 Ko (91 %) · 0,055 g · **A** | 208 Ko · 0,23 g · 0,017 g |
| [`application-monopage`](videos/chromium-avant-apres-application-monopage.mp4) ([GIF](videos/chromium-avant-apres-application-monopage.gif)) | 300 Ko · 52 req. · 5 pages | 0 octet · 0,58 g, tout cumulé sur la dernière page | 319 Ko (106 %) · 5 pages vues · 0,027 g | 37 Ko · 0,07 g · 0,0032 g |
| [`example-com`](videos/chromium-avant-apres-example-com.mp4) ([GIF](videos/chromium-avant-apres-example-com.gif)) | 2,0 Ko · 2 req. | 0 octet · 0,01 g | 2,3 Ko · 0,0002 g · **A+** | 0,2 Ko · 0,01 g · **0 g** |
| [`amazon`](videos/chromium-avant-apres-amazon.mp4) ([GIF](videos/chromium-avant-apres-amazon.gif)) | 3,44 Mo · 156 req. | 0 octet · 1,78 g | 2,69 Mo (78 %) · 0,23 g · **D** | 54 Ko · **1,31 g** · 0,0023 g |
| [`airbnb`](videos/chromium-avant-apres-airbnb.mp4) ([GIF](videos/chromium-avant-apres-airbnb.gif)) | 4,60 Mo · 164 req. | 0 octet · 1,79 g | 4,48 Mo (97 %) · 0,38 g · **F** | 80 Ko · **1,66 g** · 0,0006 g |
| [`youtube`](videos/chromium-avant-apres-youtube.mp4) ([GIF](videos/chromium-avant-apres-youtube.gif)) | 4,17 Mo · 138 req. | 0 octet · 1,53 g | 3,66 Mo (88 %) · 0,31 g · **E** | 3,02 Mo · 1,32 g · 0,22 g |

**Ce que montrent ces vidéos :**
- **La v2 ne lit jamais le poids transféré** (0 octet sur les 7 sites) : son résultat dépend surtout du nombre de requêtes. Une photo de 14 Mo (0,07 g) sort mieux notée qu'une page Wikipédia (0,50 g).
- **La v2 ignore le cache** : au rechargement d'Amazon, Chromium ne reçoit que 54 Ko, mais la v2 affiche encore 1,31 g. La v3 suit la réalité (0,0023 g). YouTube retélécharge vraiment 3 Mo au rechargement (aperçus vidéo) : la v3 le voit aussi.
- **Précision du poids mesuré par la v3** : de 78 % à 106 % des octets reçus par Chromium. L'écart vient des **en-têtes HTTP** (≈ 1 Ko par requête, invisibles pour une extension), de quelques requêtes d'**autres domaines qui n'annoncent pas leur taille** (Amazon, Airbnb, YouTube) et, dans l'autre sens, des **300 o d'en-têtes estimés** que Resource Timing ajoute à chaque ressource (Svelte, example.com).

**À savoir :**
- La v2 calcule avec l'intensité carbone *en direct* d'Electricity Maps (≈ 72-73 g/kWh pendant ces enregistrements) : ses grammes changent d'une heure à l'autre pour la même page.
- Les équivalents « Pas de données » de la v3 ne viennent pas du plugin : le serveur de production ne renvoie aucun équivalent pour les valeurs inférieures à environ 1 g.
- **Amazon** : la zone « Livraison à … » (ville déduite de l'adresse IP) est masquée dans la vidéo. Amazon charge d'abord une petite page de vérification (5 requêtes) : la v3 compte donc 2 pages vues. Son bandeau cookies n'a pas pu être refusé automatiquement ; il reste affiché.
- Sites abandonnés : **Le Monde** (mur « accepter ou s'abonner », non accepté) et **Pinterest** (« Accès refusé » au navigateur automatisé, non contourné).
- **Correctif fait pendant ces enregistrements** : dans une application monopage, le site télécharge les données de la page suivante *avant* de changer d'URL. La v3 les rangeait dans l'ancienne page puis les perdait (la doc Svelte affichait 0 g). Les requêtes lancées moins de 3 s avant le changement d'URL sont désormais rattachées à la nouvelle page (`startSpaPage`).
- **Point à surveiller** : juste après un redémarrage du PC, sur un réseau très lent (71 s de chargement), deux enregistrements Wikipédia ont perdu le document HTML (−160 Ko). Non reproduit sur les 4 essais suivants ; à vérifier avec le banc de test du Sprint 2.

Sources et mesures brutes : [`videos/source-chromium/`](videos/source-chromium/) (`record.mjs` enregistre, `compose.html` + `render-rec.mjs` montent ; `mesures/*.json` contient pour chaque site la vérité réseau des deux visites, l'état interne des deux extensions et le texte exact de leurs popups).

## Enregistrements d'écran de la v2

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
