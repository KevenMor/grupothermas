// Script para criar um super admin no Firestore e no Auth se não existir
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.error('FIREBASE_SERVICE_ACCOUNT_JSON não definida!');
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();
const auth = getAuth();

function generatePassword(length = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  let pass = '';
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

async function main() {
  const email = process.argv[2];
  const name = process.argv[3] || 'Administrador';
  const phone = process.argv[4] || '';
  let uid = process.argv[5];
  let password = process.argv[6];

  if (!email) {
    console.error('Uso: node create-super-admin.js <email> [nome] [telefone] [uid] [senha]');
    process.exit(1);
  }

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    uid = userRecord.uid;
    console.log('Usuário já existe no Auth:', email, 'UID:', uid);
  } catch (e) {
    // Usuário não existe, criar
    password = password || generatePassword();
    userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      phoneNumber: phone || undefined,
      emailVerified: true,
      disabled: false
    });
    uid = userRecord.uid;
    console.log('Usuário criado no Auth:', email, 'UID:', uid, 'Senha:', password);
  }

  // Permissões administrativas completas
  const allPermissions = [
    'admin_users_view', 'admin_users_create', 'admin_users_edit', 'admin_users_delete',
    'admin_permissions_view', 'admin_permissions_edit',
    'admin_audit_view', 'admin_audit_export',
    'admin_config_view', 'admin_config_edit',
    'admin_sales_view', 'admin_sales_edit',
    'admin_leads_view', 'admin_leads_edit',
    'admin_flow_view', 'admin_flow_edit',
    'admin_training_view', 'admin_training_edit',
    'admin_webhook_view', 'admin_webhook_edit',
    'admin_memory_view', 'admin_memory_edit',
    'admin_status_view', 'admin_status_edit',
    'admin_test_view', 'admin_test_edit',
    'admin_media_view', 'admin_media_edit',
    'admin_qr_view', 'admin_qr_edit',
    'admin_openai_view', 'admin_openai_edit',
    'admin_zapi_view', 'admin_zapi_edit',
    'admin_atendimento_view', 'admin_atendimento_edit',
    'admin_kanban_view', 'admin_kanban_edit',
    'admin_contracts_view', 'admin_contracts_edit',
    'admin_dashboard_view', 'admin_dashboard_edit',
    'admin_global_view', 'admin_global_edit',
    'admin_super_admin'
  ];

  // Criar/atualizar documento no Firestore
  await db.collection('users').doc(uid).set({
    uid,
    email,
    name,
    phone,
    role: 'admin',
    isActive: true,
    permissions: allPermissions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }, { merge: true });

  console.log('Super admin cadastrado no Firestore com sucesso!');
  process.exit(0);
}

main(); 