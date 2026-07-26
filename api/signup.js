// Fonction serverless Vercel — reçoit une inscription du formulaire,
// l'enregistre dans Supabase (le même projet que l'app mobile), et envoie
// une notification email via Resend.
// Variables d'environnement requises (voir README.md) :
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY  (depuis le projet Supabase existant)
//   RESEND_API_KEY

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const NOTIFY_EMAIL = 'adm.appcontacts@gmail.com';
const FROM_EMAIL = 'ADM Site <onboarding@resend.dev>';

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function sendNotificationEmail(lead) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.RESEND_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [NOTIFY_EMAIL],
      subject: 'Nouvelle inscription ADM — ' + lead.name,
      text:
        'Nouvelle inscription à la liste d\'attente ADM :\n\n' +
        'Nom / Entreprise : ' + lead.name + '\n' +
        'Téléphone : ' + lead.phone + '\n' +
        'Email : ' + lead.email + '\n' +
        'Domaine : ' + lead.domaine + '\n'
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error('Resend: ' + response.status + ' ' + text);
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
    name: name,
    phone: phone,
    email: email,
    domaine: finalDomaine
  };

  try {
    const { error } = await supabase.from('adm_site_leads').insert(lead);
    if (error) throw error;
  } catch (err) {
    console.error('Erreur Supabase:', err);
    res.status(500).json({ status: 'error', message: 'Erreur lors de l\'enregistrement' });
    return;
  }

  try {
    await sendNotificationEmail(lead);
  } catch (err) {
    // L'inscription est déjà enregistrée dans Supabase : on ne fait pas
    // échouer la requête si seul l'envoi d'email a un problème (ex:
    // identifiants Resend pas encore configurés). On le signale en log.
    console.error('Erreur envoi email:', err);
  }

  res.status(200).json({ status: 'success' });
};
