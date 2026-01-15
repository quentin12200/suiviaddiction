import Database from 'better-sqlite3';
import { readFileSync } from 'fs';

const db = new Database('dev.db');

console.log('🔄 Création de la table TaskItem...');

const sql = readFileSync('prisma/migrations/add_tasks.sql', 'utf-8');
db.exec(sql);

console.log('✅ Table TaskItem créée avec succès !');

// Vérifier que la table existe
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='TaskItem'").all();
console.log('📊 Tables créées:', tables);

db.close();
