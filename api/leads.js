// Fonction serverless Vercel — renvoie la liste des inscriptions,
// protégée par le mot de passe ADMIN_PASSWORD (variable d'environnement).
// Appelée uniquement par la page admin secrète (voir README.md).

const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
  const password = req.query.password || req.headers['x-admin-password'];

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ status: 'error', message: 'Mot de passe incorrect' });
    return;
  }

  try {
    const raw = await kv.lrange('adm:leads', 0, -1);
    const leads = raw
      .map(function (item) {
        try {
          return typeof item === 'string' ? JSON.parse(item) : item;
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean)
      .reverse();

    res.status(200).json({ status: 'success', leads: leads });
  } catch (err) {
    console.error('Erreur KV:', err);
    res.status(500).json({ status: 'error', message: 'Erreur lors de la lecture' });
  }
};
