// Fonction serverless Vercel — création de compte admin (email + mot de
// passe, hashé avant d'être stocké dans Supabase). Utilisée par la page
// admin-x7f2k9.html. Variables d'environnement : SUPABASE_URL / SUPABASE_SECRET_KEY.

const { isValidEmail, findAdminByEmail, createAdmin } = require('../lib/adminAuth');

const MIN_PASSWORD_LENGTH = 8;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ status: 'error', message: 'Méthode non autorisée' });
    return;
  }

  const body = req.body || {};
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!isValidEmail(email)) {
    res.status(400).json({ status: 'error', message: 'Adresse email invalide.' });
    return;
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    res.status(400).json({ status: 'error', message: 'Le mot de passe doit faire au moins ' + MIN_PASSWORD_LENGTH + ' caractères.' });
    return;
  }

  try {
    const existing = await findAdminByEmail(email);
    if (existing) {
      res.status(409).json({ status: 'error', message: 'Un compte existe déjà avec cet email.' });
      return;
    }

    await createAdmin(email, password);
    res.status(200).json({ status: 'success' });
  } catch (err) {
    console.error('Erreur création admin:', err);
    res.status(500).json({ status: 'error', message: 'Erreur lors de la création du compte.' });
  }
};
