require('dotenv').config({ quiet: true });

if (process.env.NODE_ENV !== 'development') {
  console.error('Refusing to bootstrap test accounts: set NODE_ENV=development.');
  process.exitCode = 1;
} else {
  run().catch((error) => {
    if (error.code === 'BOOTSTRAP_EMAIL_CONFLICT' || error.code === 'BOOTSTRAP_PASSWORDS_REQUIRED') {
      console.error(error.message);
    } else if (error.code) {
      console.error(`Test-account bootstrap failed (${error.code}).`);
    } else {
      console.error('Test-account bootstrap failed due to a database or hashing error. No credentials were printed.');
    }
    process.exitCode = 1;
  });
}

async function run() {
  const pool = require('../src/config/database');
  const { bootstrapTestAccounts } = require('../src/modules/dev/bootstrap-test-accounts');
  try {
    const result = await bootstrapTestAccounts({ pool });
    console.log(`Created ${result.created.length} development test accounts:`);
    for (const account of result.created) console.log(`- ${account.fullName} <${account.email}> (${account.role})`);
  } finally {
    await pool.end();
  }
}
