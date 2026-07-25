# ADM (Autour De Moi) — Site vitrine / liste d'attente

Page de pré-lancement pour **ADM**, la plateforme qui permet aux prestataires
indépendants (coiffeurs, esthéticiennes, barbers, traiteurs, photographes...)
de gagner en visibilité et de développer leur clientèle. L'objectif unique de
cette page : convertir un visiteur prestataire en inscrit à la liste d'attente.

Ce dossier est **autonome** : HTML / CSS / JS "vanilla", sans build, sans
dépendance, prêt à être poussé tel quel dans son propre dépôt Git et déployé
sur n'importe quel hébergeur statique (Vercel, Netlify, GitHub Pages, etc.).

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
├── mentions-legales.html Page légale (à compléter avant mise en ligne)
├── confidentialite.html  Politique de confidentialité (prête, pas encore liée en footer)
├── css/style.css         Tous les styles (variables CSS = design system ADM)
├── js/main.js            Menu mobile, validation des 2 formulaires, animations
├── assets/img/           Logo, favicon, icônes
└── README.md
```

## 🚀 Lancer en local

```bash
# Option 1 — ouvrir directement le fichier
open index.html

# Option 2 — servir le dossier (recommandé)
npx serve .
# ou
python3 -m http.server 8080
```

## 📬 Brancher les formulaires

Les deux formulaires (`#signupForm` et `#ideaForm` dans `index.html`, logique
dans `js/main.js`) font actuellement de la **validation côté client
uniquement** — ils affichent un message de confirmation simulé mais
n'envoient rien nulle part. Pour les rendre réellement fonctionnels :

### Option A — Formspree (le plus rapide, gratuit jusqu'à 50 envois/mois)
1. Créez un formulaire sur [formspree.io](https://formspree.io).
2. Ajoutez `action="https://formspree.io/f/VOTRE_ID"` et `method="POST"`
   sur les balises `<form>` concernées.
3. Dans `js/main.js`, remplacez le `showNote(...)` de succès par un vrai
   `fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })`.

### Option B — EmailJS (envoi direct depuis le navigateur, sans backend)
1. Créez un compte sur [emailjs.com](https://www.emailjs.com), un service
   d'envoi et un template.
2. Ajoutez le SDK EmailJS dans `index.html`.
3. Appelez `emailjs.sendForm(...)` dans les handlers de soumission à la
   place du `showNote(...)` de succès.

### Option C — Votre propre API / Google Sheet
Remplacez le `showNote(...)` par un appel à votre endpoint
(`POST /api/waitlist`, `POST /api/idea`) qui enregistre les leads (email +
domaine d'activité pour l'inscription).

Dans tous les cas, gardez la validation existante (`isValidEmail`, champs
requis, gestion du champ "Autre" pour le domaine) : elle continue à filtrer
les entrées invalides avant l'envoi.

## ⚖️ Avant mise en production

- [ ] Compléter `mentions-legales.html` avec les vraies informations
      (SIRET, hébergeur, adresse, directeur de publication...).
- [ ] Décider quand lier `confidentialite.html` depuis le footer (le fichier
      existe déjà et est à jour avec les 2 formulaires actuels — il suffit
      de remplacer le `<span class="footer-disabled">` par un `<a>` dans
      `index.html` une fois prêt).
- [ ] Brancher un vrai service d'envoi pour les 2 formulaires (voir
      ci-dessus) — sans ça, aucune inscription n'est réellement enregistrée.
- [ ] Vérifier l'adresse `adm.appcontacts@gmail.com` utilisée dans le footer
      et les pages légales.

## 📦 Déployer dans un nouveau dépôt

```bash
cd adm-site-vitrine
git init
git add .
git commit -m "Initial commit — site vitrine ADM"
git branch -M main
git remote add origin <url-de-votre-nouveau-repo>
git push -u origin main
```

Puis connectez le dépôt à Vercel / Netlify / GitHub Pages : aucune commande
de build n'est nécessaire, le dossier racine est directement servable
(fichier d'entrée : `index.html`).
