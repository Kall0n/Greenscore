# ADR-0004 — Authentification du plugin par jeton révocable

- **Statut :** Proposé
- **Date :** 2026-10-16
- **Exigences concernées :** EF-SEC-1, FC7 ; constats S-01, S-04, X-05

## Contexte

Le plugin lit le cookie de session du site (permission `cookies`) et le renvoie à l'API, mais l'API fait confiance au `user_id` envoyé dans le corps de la requête (S-01). Les écritures en GET ouvrent une faille CSRF (S-04).

## Options envisagées

| Option | Avantages | Inconvénients |
|---|---|---|
| A. Garder le cookie, mais prendre l'identité dans la session serveur | Changement minimal | Permission `cookies` conservée ; comportement des cookies tiers différent selon les navigateurs ; plugin lié à la session web (30 jours) |
| B. **Jeton de plugin** créé depuis « Mon compte », stocké haché côté serveur, envoyé en `Authorization: Bearer` | Indépendant des cookies ; révocable par appareil ; pas de CSRF ; permission `cookies` retirée | Écran d'association à développer |
| C. OAuth 2 complet (*device flow*) | Standard | Disproportionné pour le projet |

## Décision

Option **B**. Le jeton est aléatoire (256 bits) et le serveur n'en stocke que l'empreinte SHA-256. Il est listé et révocable dans « Mon compte ». L'identité vient **uniquement** du jeton ou de la session, et tout `user_id` présent dans le corps d'une requête est rejeté.

**Correctif immédiat (Sprint 2), avant ce chantier :** l'option A, appliquée à la route existante.

## Conséquences

- Nouvelle table `plugin_token` ; nouvelles routes `/api/v1/plugin-tokens`.
- Tests d'autorisation automatisés : jeton absent, révoqué ou d'un autre utilisateur.
