// Fonction serverless Vercel — renvoie la liste des inscriptions,
// protégée par le mot de passe ADMIN_PASSWORD (variable d'environnement).
// Appelée uniquement par la page admin secrète (voir README.md).
//
// Utilise la clé SECRÈTE Supabase (pas la clé publique/publishable) : elle
// contourne les policies RLS pour pouvoir tout lire, et ne doit vivre que
// dans cette fonction serverless — jamais côté navigateur.

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

module.exports = async (req, res) => {
  const password = req.query.password || req.headers['x-admin-password'];

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ status: 'error', message: 'Mot de passe incorrect' });
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
