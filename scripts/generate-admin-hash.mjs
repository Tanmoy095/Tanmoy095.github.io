import { createHash } from 'crypto';

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/generate-admin-hash.mjs <your-password>');
  process.exit(1);
}

const hash = createHash('sha256').update(password).digest('hex');
console.log('\nAdd this to GitHub Secrets as ADMIN_PASSWORD_HASH:');
console.log(hash);
console.log('\nAdd plain password to Vercel env as ADMIN_PASSWORD');
