# Plugin Chrome 1.7.0 (mesure réelle + SWDM v4) — 10/11/2026

Premier contrôle du plugin corrigé, **avant** le banc de test complet du Sprint 2 (corpus de 30 pages, export HAR, Firefox). C'est une vérification ponctuelle, pas la campagne de référence.

## Protocole

- Chromium 159 (build officiel), sans interface, profil neuf, plugin `plugin/chrome` chargé tel quel.
- Pour chaque page : un passage **sans cache** (`Network.clearBrowserCache`), puis un passage **avec cache**, dans un nouvel onglet.
- **Vérité terrain :** somme des `encodedDataLength` des événements CDP `Network.loadingFinished` (octets réellement reçus, en-têtes compris).
- **Plugin :** état interne du service worker 2,5 s après `networkidle0` (octets, requêtes vues / mesurées, gCO2e, note).
- Pays détecté : FR (intensité annuelle 44,18 gCO2e/kWh, Ember).
- 3 passages complets de la séquence : **résultats identiques** d'un passage à l'autre (même nombre d'octets à l'octet près pour le plugin).

## Résultats

| Page | Cache | Vérité terrain | Plugin | Requêtes vues / mesurées | Écart | Plugin v3 |
|---|---|---|---|---|---|---|
| example.com | sans | 2 026 o | 2 313 o | 2 / 2 | +14,2 % | 0,0002 g · A+ |
| Wikipédia « Centre de données » | sans | 654 918 o | 603 130 o | 37 / 37 | −7,9 % | 0,052 g · A |
| Wikipédia « Centre de données » | avec | 206 675 o | 199 953 o | 29 / 29 | −3,3 % | 0,017 g · A+ |
| Documentation Svelte | sans | 237 400 o | 256 257 o | 50 / 49 | +7,9 % | 0,022 g · A+ |
| Wikipédia « Empreinte carbone » | sans | 284 424 o | 248 590 o | 27 / 27 | −12,6 % | 0,021 g · A+ |
| lemonde.fr (accueil) | sans | 961 094 o | 949 738 o | 43 / 42 | −1,2 % | 0,081 g · B |
| lemonde.fr (accueil) | avec | 138 840 o | 137 764 o | 37 / 37 | −0,8 % | 0,012 g · A+ |

Avec cache, les pages example.com, Svelte et « Empreinte carbone » ne transfèrent que les en-têtes des réponses 304 (227 o à 5,6 Ko) : le plugin compte 0 octet.

**Comparaison avec la v2 :** sur Chrome, la v2 comptait **0 octet** pour toutes ces pages (constat A-02). La note ne dépendait que du nombre de requêtes.

## Lecture

- Le volume compté par le plugin est le **corps** des réponses (`Content-Length`, ou `transferSize` de Resource Timing). Les **en-têtes HTTP** ne sont pas comptés : c'est l'essentiel de l'écart négatif (≈ 1 à 2 Ko par requête en HTTP/2 ; 6 Ko pour un document avec cookies).
- L'écart positif (example.com, Svelte) vient de `transferSize`, qui ajoute une estimation fixe de 300 o d'en-têtes par ressource, et de requêtes vues par le plugin mais pas par l'onglet (préchargements).
- Écart médian sur les 5 pages sans cache : **−1,2 %** ; écart maximal : **14,2 %**. Objectif O1 (médiane < 5 %, P90 < 15 %) : tendance favorable, **à confirmer** sur le corpus de 30 pages et sur Firefox.
- Piste (CDCT §4.4) : ajouter une constante d'en-têtes par requête si le banc de test confirme un biais négatif systématique.

## Bug trouvé et corrigé pendant ce contrôle

Dans le service worker de Chrome, `webNavigation.onBeforeNavigate` peut arriver **après** la requête du document. La remise à zéro de la page effaçait alors le document HTML : jusqu'à −45 % sur une page Wikipédia, de façon aléatoire. La nouvelle page démarre désormais sur la requête `main_frame` de `webRequest`, dont l'ordre est garanti.
