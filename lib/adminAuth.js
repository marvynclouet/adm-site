// Logique partagée entre api/admin-auth.js (création de compte) et
// api/leads.js (vérification à chaque consultation des inscriptions).

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function findAdminByEmail(email) {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, email, password_hash')
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function createAdmin(email, password) {
  const passwordHash = await bcrypt.hash(password, 10);
  const { error } = await supabase.from('admin_users').insert({ email, password_hash: passwordHash });
  if (error) throw error;
}

async function verifyAdmin(email, password) {
  if (!email || !password) return false;
  const admin = await findAdminByEmail(email);
  if (!admin) return false;
  return bcrypt.compare(password, admin.password_hash);
}

module.exports = { supabase, isValidEmail, findAdminByEmail, createAdmin, verifyAdmin };
