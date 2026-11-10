# Recette de la version 2025-2026 (« v2 ») — plan de tests

> **But :** constituer la **situation de référence** (« avant ») exigée par le [CDCF §1.4 et §9](../CDCF.md#9-stratégie-de-preuve--comment-nous-démontrerons-les-améliorations). Chaque test sera rejoué à l'identique sur la v3 (« après »).
> **Cible testée :** extension GreenScore du Chrome Web Store (identifiant `lmepagkjddahkpjlkcgfolbnmbjkogco`) et site https://greenscore.alwaysdata.net.
> **Règles :**
> - aucune action destructrice ou abusive sur la production ;
> - aucun test d'intrusion (les failles S-01 et S-04 du CDCT sont documentées par lecture du code, **pas exploitées**) ;
> - un compte de test dédié, créé par un membre de l'équipe.

## Preuves collectées pour chaque test

| Preuve | Outil |
|---|---|
| Vidéo du parcours, popup compris | Enregistrement d'écran Windows (Xbox Game Bar, `Win + Alt + R`), car le popup d'une extension est hors de l'onglet ; GIF de l'onglet par l'agent de test |
| Ce qu'affiche GreenScore | Capture du popup et de la page « Dernière page consultée » : note, gCO2e, taille, requêtes, temps |
| Vérité terrain | Panneau Réseau des outils de développement (totaux « transférés » et « ressources », nombre de requêtes, cache désactivé) ; API Resource Timing lue dans la page (`transferSize`, nombre de nœuds DOM) |
| Calcul de contrôle | Formule v2 recalculée à la main ([méthodologie §2](../methodologie-calcul.md#2-le-modèle-hérité-v2-équipes-2024-2025-et-2025-2026)) et estimation SWDM v4 (§3) |

## Scénarios

| ID | Scénario | Ce qu'on veut montrer | Indicateur / constat visé |
|---|---|---|---|
| **T1** | Page sobre (article Wikipédia), cache désactivé | Taille mesurée vs taille réelle | O1 ; A-02 (Chrome : volume transféré nul) |
| **T2** | Page lourde (vidéo YouTube) | Idem, et effet du temps passé sur la page | O1 ; A-07 |
| **T3** | **Parcours Amazon** : accueil → recherche « gourde inox » → fiche produit → ajout au panier → panier | Ce que la v2 permet (ou non) de comprendre d'un **parcours** ; absence de sessions ; cumul affiché dans « Mes données » | O10 ; A-07 (double ligne par page), D-03 |
| **T4** | **Reproductibilité** : recharger 5 fois la même page (cache désactivé) | Variation de la note pour une page identique | O3 ; A-05 (intensité « en direct ») |
| **T5** | Cache : la même page **avec** cache | La v2 compte-t-elle les ressources en cache comme transférées ? | A-04 |
| **T6** | **Poids contre requêtes** : (a) une image unique de plusieurs Mo, puis (b) une page légère avec beaucoup de requêtes | La v2 juge-t-elle plus « polluante » la page la plus légère ? | O5 ; A-01 (96 % du score vient des requêtes) |
| **T7** | Application monopage (navigation interne, ex. YouTube ou Gmail) | Double comptage lors des changements d'URL sans rechargement | A-07 |
| **T8** | Compte : inscription, connexion, puis « Mes données » avant et après les parcours T1 à T7 | Historique, top 5, graphiques, comparaison avec l'utilisateur moyen, équivalents : cohérence des chiffres et lisibilité | C5 ; D-03 ; EF-PRE-5 |
| **T9** | Organisation : créer une organisation de test, la rejoindre avec un 2ᵉ compte de test | Agrégats d'organisation, note d'organisation | A-09 ; EF-ORG |
| **T10** | Confidentialité : comparer la politique de confidentialité aux données réellement envoyées | Écarts entre ce qui est annoncé et ce qui est fait | P-01, P-02 ; FC2 |
| **T11** | Site GreenScore lui-même | Poids, compression, ressources tierces de nos propres pages | ENF-PER-3 |

## Résultats

- Constats sur le site public (sans compte) : [constats-site-public.md](constats-site-public.md)
- Résultats des scénarios avec l'extension (T0, T1, T3 à T7) et vidéos : [resultats-v2.md](resultats-v2.md)
