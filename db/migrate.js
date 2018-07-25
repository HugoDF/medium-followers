const { dbPromise } = require('./connect');

async function migrate() {
  const db = await dbPromise;
  await db.migrate();
}

if (require.main === module) {
  migrate()
    .then(() => console.log('Migrated Successfully'));
}

module.exports = migrate;