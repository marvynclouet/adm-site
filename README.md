# ADM (Autour De Moi) — Site vitrine / liste d'attente

Page de pré-lancement pour **ADM**, la plateforme qui permet aux prestataires
indépendants (coiffeurs, esthéticiennes, barbers, traiteurs, photographes...)
de gagner en visibilité et de développer leur clientèle. L'objectif unique de
cette page : convertir un visiteur prestataire en inscrit à la liste d'attente.

Ce dossier est **autonome** : HTML / CSS / JS "vanilla" côté site (aucun
build), + quelques fonctions serverless (`api/`) pour le formulaire
d'inscription. Ces fonctions enregistrent les inscriptions dans le **même
projet Supabase que l'application mobile ADM-APP**, donc **le déploiement
se fait sur Vercel** (pas n'importe quel hébergeur statique, contrairement
à une page 100% statique).

## 🎨 Identité visuelle

Palette reprise du design system réel de l'application (`src/theme/theme.ts`
et `src/constants/colors.ts` dans `ADM-APP/BeautyBookingApp`) :

| Rôle | Couleur |
|---|---|
| Navy (primaire, texte, header/footer) | `#1E2A4A` |
| Corail (accent — utilisé uniquement pour les boutons) | `#E07A5F` |
| Fond warm white | `#F9F7F4` |
| Texte principal | `#2D3142` |

Typographies : **Playfair Display** (titres, serif) + **Plus Jakarta Sans**
(texte courant), chargées depuis Google Fonts. Design volontairement épuré :
peu de couleurs, beaucoup d'espace, une seule couleur d'accent réservée aux
boutons d'action.

## 📁 Structure de la page (suit le cahier des contenus)

1. **Hero + Inscription** (`#top` / `#inscription`) — titre, sous-titre, et
   la carte d'inscription (email + domaine d'activité) visible directement
   au chargement, sans avoir à scroller.
2. **Comment ça fonctionne** (`#comment-ca-marche`) — texte de mission +
   4 points clés (profil, portfolio, disponibilités, réservations).
3. **Pourquoi rejoindre ADM** (`#pourquoi`) — grille des 7 bénéfices.
4. **Vos idées nous intéressent** (`#idee`) — formulaire de suggestion
   (message + email optionnel).
5. **Footer** — logo, mentions légales, politique de confidentialité
   (affichée en "bientôt", pas encore liée), email de contact.

```
adm-site-vitrine/
├── index.html            Page unique, sections ancrées
├── admin-x7f2k9.html      Page secrète : tableau des inscriptions (comptes admin email + mot de passe)
├── mentions-legales.html Page légale (à compléter avant mise en ligne)
├── confidentialite.html  Politique de confidentialité (prête, pas encore liée en footer)
├── css/style.css         Tous les styles (variables CSS = design system ADM)
├── js/main.js            Validation + envoi des formulaires, animations
├── api/signup.js         Fonction serverless : enregistre l'inscription + envoie l'email
├── api/leads.js          Fonction serverless : renvoie les inscriptions (protégée par compte admin)
├── api/admin-auth.js     Fonction serverless : création d'un compte admin (email + mot de passe)
├── lib/adminAuth.js       Logique partagée (hash/vérification bcrypt) entre les deux ci-dessus
├── package.json          Dépendances des fonctions serverless (@supabase/supabase-js, bcryptjs)
├── .env.example          Variables d'environnement nécessaires (à copier/configurer)
├── assets/img/           Logo, favicon, icônes, capture d'écran de l'app
└── README.md
```

## 🚀 Lancer en local

Le site (HTML/CSS/JS) s'ouvre directement sans rien installer :

```bash
open index.html
```

Mais le formulaire d'inscription (`/api/signup`) ne fonctionnera qu'une
fois déployé sur Vercel (ou via `vercel dev` en local, avec un fichier
`.env.local` rempli à partir de `.env.example` — plus avancé, pas
nécessaire pour juste consulter/modifier le design).

## 📬 Formulaire d'inscription : Supabase + Resend + page admin

Quand un prestataire remplit le formulaire d'inscription (`#signupForm`) :
1. La fonction serverless **`api/signup.js`** enregistre l'inscription
   (nom/entreprise, téléphone, email, domaine) dans une table du **même
   projet Supabase que l'application mobile** (aucun nouveau compte à
   créer pour le stockage).
2. Elle envoie un email de notification à `adm.appcontacts@gmail.com` via
   **Resend** — aucune connexion à un compte Gmail nécessaire (ni le
   vôtre, ni celui des clients) : juste une clé API.
3. Vous consultez toutes les inscriptions sur une page secrète du site :
   **`/admin-x7f2k9.html`**. Chaque administrateur crée son propre compte
   (email + mot de passe) directement sur cette page — les mots de passe
   sont hashés (bcrypt) avant d'être stockés dans une table Supabase
   `admin_users`, jamais en clair. Pas de mot de passe unique partagé.

Supabase utilise maintenant **deux clés différentes**, avec deux niveaux
de confiance différents :
- la clé **`publishable`** (anciennement "anon") : clé **publique**, sans
  danger à manipuler, mais qui ne peut faire que ce qu'une **policy RLS**
  autorise explicitement. Utilisée par `api/signup.js` pour *écrire* une
  inscription — avec une policy qui n'autorise que l'écriture, pas la
  lecture.
- la clé **`secret`** (anciennement "service_role") : contourne les
  policies, donc peut tout lire/écrire. Utilisée uniquement par
  `api/leads.js` (jamais côté navigateur) pour afficher les inscriptions
  sur la page admin.

### ✅ Déjà fait pour vous
Les tables Supabase et leurs règles de sécurité ont déjà été créées
directement en base (via `psql`) :

```sql
-- Inscriptions du formulaire du site
create table if not exists public.adm_site_leads (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null,
  phone text not null,
  email text not null,
  domaine text not null
);
alter table public.adm_site_leads enable row level security;
create policy "Écriture publique (formulaire du site)"
  on public.adm_site_leads for insert to anon with check (true);
-- (pas de policy de lecture : seule la clé secrète peut lire, via api/leads.js)

-- Comptes administrateurs de la page /admin-x7f2k9.html
create table if not exists public.admin_users (
  id bigint generated always as identity primary key,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
-- Aucune policy : accessible uniquement via la clé secrète, jamais côté client.
```

(Gardé ici pour référence — utile si vous reproduisez ce site sur un autre
projet Supabase, mais rien à refaire sur celui-ci.)

Il reste deux choses à configurer une seule fois :

### 1. Récupérer les clés Supabase
Onglet **Project Settings > API Keys** du projet Supabase (le même que
l'app mobile) :
- **URL du projet** : `https://swucggoffwltwyvwdbdj.supabase.co`
- Clé **`publishable`** (déjà en votre possession)
- Clé **`secret`** — celle-ci, il faut la révéler/copier depuis cette page.

### 2. Créer une clé Resend (aucune connexion Gmail nécessaire)
1. Créez un compte gratuit sur **[resend.com](https://resend.com)** avec
   n'importe quelle adresse email que vous possédez (100 emails/jour
   gratuits, largement suffisant).
2. **API Keys > Create API Key** → copiez la clé générée (elle ne sera
   affichée qu'une fois).
3. Rien d'autre à faire pour commencer à tester : Resend fournit un domaine
   d'expéditeur de test (`onboarding@resend.dev`) déjà utilisé dans le
   code. Si vous voulez envoyer depuis une adresse `@adm-app.fr` (ou autre
   domaine à vous) plus tard, il faudra vérifier ce domaine dans Resend —
   pas nécessaire pour que ça fonctionne dès maintenant.

### 3. Ajouter les variables d'environnement sur Vercel
Dans **Vercel > votre projet > Settings > Environment Variables**,
ajoutez :

| Nom | Valeur |
|---|---|
| `SUPABASE_URL` | `https://swucggoffwltwyvwdbdj.supabase.co` |
| `SUPABASE_ANON_KEY` | la clé `publishable` (étape 1) |
| `SUPABASE_SECRET_KEY` | la clé `secret` (étape 1) |
| `RESEND_API_KEY` | la clé de l'étape 2 |

Puis **redéployez** (Vercel > Deployments > ⋯ > Redeploy) pour que les
nouvelles variables soient prises en compte.

### Tester
1. Sur `/admin-x7f2k9.html`, onglet **"Créer un compte"** : créez votre
   premier compte admin (email + mot de passe, 8 caractères minimum).
2. Reconnectez-vous avec ce compte (onglet "Se connecter") → le tableau
   des inscriptions doit s'afficher (vide au départ).
3. Remplissez le formulaire d'inscription sur le site → un email doit
   arriver à `adm.appcontacts@gmail.com`, et l'inscription doit apparaître
   dans le tableau admin après un clic sur "Actualiser".

⚠️ **`/admin-x7f2k9.html` reste "secrète par obscurité"** : ne la liez
nulle part sur le site public, ne la partagez pas. N'importe qui trouvant
cette URL peut créer un compte et voir les inscriptions — si l'adresse
fuite un jour, changez le nom du fichier (et supprimez les comptes
suspects dans la table `admin_users`).

### Le formulaire "Vos idées nous intéressent" (`#ideaForm`)
Non branché à ce jour (le message reste local, rien n'est enregistré).
Dites-moi si vous voulez aussi router ces suggestions vers Supabase / un
email — même principe que ci-dessus.

## ⚖️ Avant mise en production

- [ ] Compléter `mentions-legales.html` avec les vraies informations
      (SIRET, hébergeur, adresse, directeur de publication...).
- [ ] Décider quand lier `confidentialite.html` depuis le footer (le fichier
      existe déjà et est à jour avec les 2 formulaires actuels — il suffit
      de remplacer le `<span class="footer-disabled">` par un `<a>` dans
      `index.html` une fois prêt).
- [x] Tables Supabase + policies RLS créées (`adm_site_leads`, `admin_users`).
- [ ] Configurer Resend + variables d'environnement (voir ci-dessus) —
      sans ça, les inscriptions ne sont enregistrées nulle part et aucun
      email n'est envoyé.
- [ ] Créer votre premier compte admin depuis `/admin-x7f2k9.html`.
- [ ] Vérifier l'adresse `adm.appcontacts@gmail.com` utilisée dans le footer
      et les pages légales.

## 📦 Déployer

Le dépôt est déjà initialisé et poussé sur
[github.com/marvynclouet/adm-site](https://github.com/marvynclouet/adm-site).
Pour déployer sur Vercel : **vercel.com/new** → Import Git Repository →
`marvynclouet/adm-site` → Deploy (aucune config de build nécessaire, Vercel
détecte automatiquement le dossier `api/` et installe les dépendances de
`package.json`). Pensez à configurer les 3 variables d'environnement
ci-dessus après le premier déploiement.
