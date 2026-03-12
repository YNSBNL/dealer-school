# CroupierPro.fr — chantier stabilisation front + backend

## Ce qui a été refait dans cette version

- auth context plus robuste avec fallback local quand Supabase n'est pas configuré
- middleware plus sûr pour éviter les blocages absurdes en local
- coach IA déplacé côté serveur via `/api/tutor`
- validation backend sur `/api/sessions` et `/api/progress`
- dashboard reconnecté aux vraies données au lieu d'un mock statique
- landing, navbar, login, register et profil refaits dans un système visuel plus cohérent
- premiers simulateurs branchés au backend avec enregistrement de session

## Setup rapide

### 1. Configurer Supabase

Copie `.env.local.example` vers `.env.local`, puis renseigne :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Ensuite exécute `supabase-schema.sql` dans l'éditeur SQL de Supabase.

### 2. Configurer le coach IA (optionnel)

Ajoute côté serveur :

- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL` (facultatif)

Sans clé, le tuteur reste testable via un mode démo propre.

### 3. Lancer

```bash
npm install
npm run dev
```

## Modes de fonctionnement

### Mode local / démo

Si Supabase n'est pas configuré :

- le site ne se bloque pas
- l'auth bascule en fallback local
- le dashboard charge des données de démonstration
- le coach IA répond via un mode de secours

### Mode live

Si Supabase est configuré :

- `/dashboard`, `/profil`, `/tuteur`, `/certification` sont protégés
- les API `/api/sessions` et `/api/progress` lisent et écrivent côté Supabase
- la progression et le niveau sont dérivés côté serveur

## Routes principales

| Route | Rôle |
|---|---|
| `/` | landing + accès simulateurs |
| `/auth/login` | connexion |
| `/auth/register` | inscription |
| `/dashboard` | progression réelle |
| `/profil` | réglages compte |
| `/tuteur` | coach IA serveur |
| `/catalogue` | catalogue jeux |
| `/simulateur/roulette` | simulateur roulette |
| `/simulateur/blackjack` | simulateur blackjack |
| `/simulateur/baccarat` | simulateur baccarat |
| `/simulateur/ultimate-texas` | simulateur ultimate texas |

## Prochaine étape recommandée

Terminer le branchement backend de tous les simulateurs restants avec une couche commune de `saveSession()` et une logique de certification entièrement calculée côté serveur.
