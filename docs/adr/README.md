# Décisions d'architecture (ADR)

Un ADR (*Architecture Decision Record*) trace une décision : son contexte, les options envisagées, le choix et ses conséquences. Un ADR n'est jamais supprimé. S'il est remplacé, il passe au statut « Remplacé par ADR-XXXX ».

Statuts possibles :
- **Proposé** : rédigé, pas encore validé ;
- **Accepté** : validé en revue avec le commanditaire ;
- **Rejeté** ;
- **Remplacé**.

| N° | Titre | Statut |
|---|---|---|
| [0001](0001-modele-de-calcul-swdm-v4.md) | Modèle de calcul : SWDM v4 via CO2.js, EcoIndex non intégré | Proposé |
| [0002](0002-donnees-agregees-pseudonymisees.md) | Données agrégées par jour × domaine et pseudonymisées | Proposé |
| [0003](0003-plugin-base-de-code-unique-mv3.md) | Plugin : base de code unique TypeScript, Manifest V3 | Proposé |
| [0004](0004-authentification-plugin-par-jeton.md) | Authentification du plugin par jeton révocable | Proposé |
| [0005](0005-intensite-carbone-embarquee.md) | Intensité carbone annuelle embarquée, pays choisi par l'utilisateur | Proposé |

Modèle pour un nouvel ADR : [`0000-modele.md`](0000-modele.md).
