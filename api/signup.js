// Fonction serverless Vercel — reçoit une inscription du formulaire,
// l'enregistre dans Upstash Redis (via l'intégration Vercel Storage), et
// envoie une notification email.
// Variables d'environnement requises (voir README.md) :
//   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN  (injectées automatiquement
//     quand on connecte une base Upstash au projet, dans Vercel > Storage)
//   GMAIL_USER / GMAIL_APP_PASSWORD

const { Redis } = require('@upstash/redis');
const nodemailer = require('nodemailer');

const redis = Redis.fromEnv();

const NOTIFY_EMAIL = 'adm.appcontacts@gmail.com';

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: NOTIFY_EMAIL,
      subject: 'Nouvelle inscription ADM — ' + name,
      text:
        'Nouvelle inscription à la liste d\'attente ADM :\n\n' +
        'Nom / Entreprise : ' + name + '\n' +
        'Téléphone : ' + phone + '\n' +
        'Email : ' + email + '\n' +
        'Domaine : ' + finalDomaine + '\n'
    });
  } catch (err) {
    // L'inscription est déjà enregistrée dans Redis : on ne fait pas échouer
    // la requête si seul l'envoi d'email a un problème (ex: identifiants
    // Gmail pas encore configurés). On le signale juste en log.
    console.error('Erreur envoi email:', err);
  }

  res.status(200).json({ status: 'success' });
};
