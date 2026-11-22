const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

let dbPath = process.env.DB_PATH;
if (dbPath) {
  if (dbPath.startsWith('./server/') && process.cwd().endsWith('/server')) {
    dbPath = '.' + dbPath.slice(8);
  }
  dbPath = path.resolve(process.cwd(), dbPath);
} else {
  dbPath = path.resolve(__dirname, 'rescue.db');
}
const DB_PATH = dbPath;

let db = null;

function getDb() {
  if (db) return db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');
  db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  return db;
}

module.exports = { getDb };
