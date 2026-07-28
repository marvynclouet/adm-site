// Vérification du compte admin (email + mot de passe hashé bcrypt) pour
// api/leads.js. Volontairement pas de fonction de création de compte
// exposée nulle part : le seul compte admin est créé directement en base
// (voir README.md) pour éviter que n'importe qui puisse s'auto-inscrire
// depuis la page publique.

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function findAdminByEmail(email) {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, email, password_hash')
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function verifyAdmin(email, password) {
  if (!email || !password) return false;
  const admin = await findAdminByEmail(email);
  if (!admin) return false;
  return bcrypt.compare(password, admin.password_hash);
}

module.exports = { supabase, verifyAdmin };
