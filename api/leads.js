// Fonction serverless Vercel — renvoie la liste des inscriptions,
// protégée par un compte admin (email + mot de passe, vérifié contre le
// hash stocké dans Supabase — voir lib/adminAuth.js et api/admin-auth.js
// pour la création de compte). Appelée uniquement par la page admin
// secrète (voir README.md).
//
// La lecture des inscriptions utilise la clé SECRÈTE Supabase (pas la clé
// publique) : elle contourne les policies RLS, et ne doit vivre que dans
// cette fonction serverless — jamais côté navigateur.

const { supabase, verifyAdmin } = require('../lib/adminAuth');

module.exports = async (req, res) => {
  const email = String(req.headers['x-admin-email'] || req.query.email || '').trim().toLowerCase();
  const password = String(req.headers['x-admin-password'] || req.query.password || '');

  let authorized = false;
  try {
    authorized = await verifyAdmin(email, password);
  } catch (err) {
    console.error('Erreur vérification admin:', err);
    res.status(500).json({ status: 'error', message: 'Erreur lors de la vérification.' });
    return;
  }

  if (!authorized) {
    res.status(401).json({ status: 'error', message: 'Email ou mot de passe incorrect.' });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('adm_site_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const leads = (data || []).map(function (row) {
      return {
        date: row.created_at,
        name: row.name,
        phone: row.phone,
        email: row.email,
        domaine: row.domaine
      };
    });

    res.status(200).json({ status: 'success', leads: leads });
  } catch (err) {
    console.error('Erreur Supabase:', err);
    res.status(500).json({ status: 'error', message: 'Erreur lors de la lecture' });
  }
};
