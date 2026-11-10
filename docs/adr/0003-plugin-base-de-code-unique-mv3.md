# ADR-0003 — Plugin : base de code unique TypeScript, Manifest V3

- **Statut :** Proposé
- **Date :** 2026-10-16
- **Exigences concernées :** FC1, EF-SES-6, ENF-PRE-2 ; constats A-02, A-03, X-01, X-02, X-05

## Contexte

Il existe deux copies du plugin (Firefox en MV2, Chrome en MV3), d'environ 800 lignes chacune. Elles divergent déjà : le calcul du volume est différent, et faux sur Chrome. Sur Chrome, l'état gardé en mémoire est perdu quand le service worker est mis en veille.

## Options envisagées

| Option | Avantages | Inconvénients |
|---|---|---|
| A. Garder deux copies | Aucun travail | Divergences, double maintenance, bugs différents par navigateur |
| B. **Une base TypeScript, compilée vers deux paquets MV3**, avec `webextension-polyfill` | Un seul code testé ; typage du calcul ; MV3 accepté par les deux boutiques | Une étape de compilation ; adaptation du code existant |
| C. Un framework d'extension (WXT, Plasmo…) | Outillage complet | Dépendance supplémentaire, courbe d'apprentissage |

## Décision

Option **B**, avec esbuild ou Vite. Deux manifestes générés à partir d'une base commune. État persisté dans `storage.session` et `storage.local`. Permissions réduites (CDCT §4.2). L'option C pourra être réévaluée si le temps de mise en place de B dépasse un demi-sprint.

## Conséquences

- La CI compile et vérifie (`web-ext lint`) les deux paquets à chaque PR.
- Les tests de bout en bout tournent sur Chromium (Playwright) et Firefox (`web-ext` + Selenium).
- À vérifier : écart Firefox / Chrome < 10 % sur le banc de test (O2).
