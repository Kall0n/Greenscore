# ADR-0005 — Intensité carbone annuelle embarquée, pays choisi par l'utilisateur

- **Statut :** Proposé
- **Date :** 2026-10-16
- **Exigences concernées :** EF-PRE-3, EF-VIE-3, ENF-SOB-1 ; constats A-05, A-06, P-02, S-02

## Contexte

La v2 appelle ipwhois.app (en lui transmettant l'adresse IP de l'utilisateur), puis l'API Electricity Maps avec une clé exposée dans le code. Le résultat varie avec l'heure. Il peut même devenir négatif en cas d'erreur d'API. La même page n'a donc pas une note stable, et un développeur ne peut pas comparer « avant / après ».

## Options envisagées

| Option | Avantages | Inconvénients |
|---|---|---|
| A. Garder l'intensité en direct, avec la clé côté serveur | Valeur « du moment » | Non reproductible ; dépendance à un service externe et à ses quotas |
| B. **Intensité annuelle moyenne par pays (Ember, via CO2.js), embarquée ; pays choisi par l'utilisateur** | Déterministe ; aucun appel tiers ; hors ligne ; pas de clé | Ne reflète pas les variations horaires |
| C. Moyenne mondiale pour tout | Simplicité maximale | Ignore l'écart réel entre pays (ex. France vs Pologne) |

## Décision

Option **B**. Le pays est pré-rempli à partir du fuseau horaire du navigateur et modifiable dans les options. L'intensité en direct pourra être ajoutée comme **indicateur secondaire** (EF-PRE-6, Could), récupérée par le back-end.

## Conséquences

- La clé exposée doit être **révoquée** (elle reste dans l'historique public du dépôt 2025-2026).
- Le fichier `calc/grid-intensity.json` est daté et versionné avec le modèle. L'attribution Ember (CC BY-SA 4.0) est affichée.
- À vérifier : reproductibilité < 10 % de coefficient de variation (O3) et 0 appel tiers (moniteur réseau).
