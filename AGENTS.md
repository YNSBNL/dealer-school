# Dealer School - AGENTS.md

## Objectif produit
Dealer School est une plateforme premium de formation de dealers de casino.
Le code doit privilégier :
1. réalisme métier,
2. robustesse algorithmique,
3. cohérence UX,
4. maintenabilité.

## Règles globales
- Ne pas mélanger logique métier et rendu UI.
- Chaque jeu doit avoir un moteur séparé du composant React.
- Les règles doivent être déterministes, testables et configurables.
- Les variantes doivent passer par des rulesets, pas par des if dispersés dans l’UI.
- Les cartes ne doivent pas stocker les symboles Unicode ♠ ♥ ♦ ♣ dans le moteur.
- Utiliser suit = S/H/D/C côté logique, puis mapper en UI.
- Toute logique de payout doit être pure et testable.
- Toute logique de qualification dealer / 3e carte / résolution de mise doit être isolée dans des fonctions pures.
- Ne jamais hardcoder des pay tables si elles dépendent d’une variante de table.
- Préférer de petits modules réutilisables à de gros composants monolithiques.

## Architecture cible
Chaque jeu doit suivre cette structure si possible:

features/<game>/
- engine.ts
- rulesets.ts
- selectors.ts
- types.ts
- tests.spec.ts
- ui/

## Qualité attendue
Pour chaque modification sur un jeu:
- préserver ou améliorer le réalisme métier
- éviter les régressions UI
- ajouter ou mettre à jour des tests
- ne pas casser les routes existantes

## Validation
Quand tu modifies un moteur:
- exécute lint
- exécute build si possible
- exécute les tests liés au jeu si disponibles
- résume les fichiers modifiés
- liste les limites restantes

## Priorités de travail
1. corriger les bugs d’affichage et d’encodage des cartes
2. extraire les moteurs hors des composants React
3. fiabiliser roulette, blackjack, baccarat, ultimate texas
4. ajouter progressivement les autres jeux
