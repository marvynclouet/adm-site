// Fonction serverless Vercel — reçoit une inscription du formulaire,
// l'enregistre dans Upstash Redis (via l'intégration Vercel Storage), et
// envoie une notification email via EmailJS.
// Variables d'environnement requises (voir README.md) :
//   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN  (injectées automatiquement
//     quand on connecte une base Upstash au projet, dans Vercel > Storage)
//   EMAILJS_SERVICE_ID / EMAILJS_TEMPLATE_ID / EMAILJS_PUBLIC_KEY / EMAILJS_PRIVATE_KEY

const { Redis } = require('@upstash/redis');

const redis = Redis.fromEnv();

const NOTIFY_EMAIL = 'adm.appcontacts@gmail.com';

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function sendNotificationEmail(lead) {
  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      accessToken: process.env.EMAILJS_PRIVATE_KEY,
      template_params: {
        to_email: NOTIFY_EMAIL,
        lead_name: lead.name,
        lead_phone: lead.phone,
        lead_email: lead.email,
        lead_domaine: lead.domaine,
        lead_date: lead.date
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error('EmailJS: ' + response.status + ' ' + text);
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ status: 'error', message: 'Méthode non autorisée' });
    return;
  }

  const body = req.body || {};
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  const email = String(body.email || '').trim();
  const domaine = String(body.domaine || '').trim();
  const domaineAutre = String(body.domaine_autre || '').trim();

  if (!name || !phone || !isValidEmail(email) || !domaine) {
    res.status(400).json({ status: 'error', message: 'Champs manquants ou invalides' });
    return;
  }

  const finalDomaine = domaine === 'Autre' && domaineAutre ? domaineAutre : domaine;

  const lead = {
    date: new Date().toISOString(),
    name: name,
    phone: phone,
    email: email,
    domaine: finalDomaine
  };

  try {
    await redis.rpush('adm:leads', JSON.stringify(lead));
  } catch (err) {
    console.error('Erreur Redis:', err);
    res.status(500).json({ status: 'error', message: 'Erreur lors de l\'enregistrement' });
    return;
  }

  try {
    await sendNotificationEmail(lead);
  } catch (err) {
    // L'inscription est déjà enregistrée dans Redis : on ne fait pas échouer
    // la requête si seul l'envoi d'email a un problème (ex: identifiants
    // EmailJS pas encore configurés). On le signale juste en log.
    console.error('Erreur envoi email:', err);
  }

  res.status(200).json({ status: 'success' });
};
