const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const db = new Database(dbPath);

console.log('🔍 Analysing Entry table...\n');

// Récupérer toutes les entrées récentes
const entries = db.prepare(`
  SELECT id, date, time, hasSmoked, jointCount, createdAt
  FROM Entry
  ORDER BY date DESC, time DESC
  LIMIT 10
`).all();

console.log('📊 Dernières 10 entrées:');
entries.forEach(entry => {
  const date = new Date(entry.date);
  console.log('\nID:', entry.id);
  console.log('  Date (brut):', entry.date);
  console.log('  Date (parsed):', date.toISOString());
  console.log('  Date (local):', date.toLocaleString('fr-FR'));
  console.log('  Time:', entry.time);
  console.log('  hasSmoked:', entry.hasSmoked);
  console.log('  jointCount:', entry.jointCount);
  console.log('  createdAt:', entry.createdAt);
});

// Aujourd'hui
const now = new Date();
const todayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
const tomorrowStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0));

console.log('\n\n🔍 Test de la requête "aujourd\'hui":');
console.log('Now:', now.toISOString());
console.log('Today start (UTC):', todayStart.toISOString());
console.log('Tomorrow start (UTC):', tomorrowStart.toISOString());

const todayEntries = db.prepare(`
  SELECT id, date, time, hasSmoked, jointCount
  FROM Entry
  WHERE date >= ? AND date < ?
  ORDER BY time DESC
`).all(todayStart.toISOString(), tomorrowStart.toISOString());

console.log('\n📊 Entrées trouvées pour aujourd\'hui:', todayEntries.length);
todayEntries.forEach(entry => {
  console.log('  -', entry.time + ':', entry.jointCount, 'joint(s), hasSmoked=' + entry.hasSmoked);
});

const totalJoints = todayEntries.reduce((sum, e) => sum + (e.hasSmoked ? e.jointCount : 0), 0);
console.log('\n✅ Total joints aujourd\'hui:', totalJoints);

db.close();
