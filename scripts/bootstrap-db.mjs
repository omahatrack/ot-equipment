import fs from 'node:fs/promises';
import path from 'node:path';
import mariadb from 'mariadb';
import { closePool } from '../lib/db.js';

const required=['DB_HOST','DB_PORT','DB_NAME','DB_USER','DB_PASSWORD'];
const missing=required.filter(k=>!process.env[k]);
if(missing.length){
  console.error(`Missing GoDaddy database variables: ${missing.join(', ')}`);
  process.exit(1);
}

const pool=mariadb.createPool({
  host:process.env.DB_HOST,
  port:Number(process.env.DB_PORT||3306),
  user:process.env.DB_USER,
  password:process.env.DB_PASSWORD,
  database:process.env.DB_NAME,
  allowPublicKeyRetrieval:true,
  connectionLimit:2,
  multipleStatements:true,
  connectTimeout:10000
});

async function main(){
  console.log('OTE database bootstrap: connecting to GoDaddy MySQL...');
  let conn;
  try{
    conn=await pool.getConnection();
    const migrationDir=path.join(process.cwd(),'database','migrations');
    const files=(await fs.readdir(migrationDir)).filter(f=>f.endsWith('.sql')).sort();
    await conn.query(`CREATE TABLE IF NOT EXISTS \`_AppMigration\` (\`id\` INT NOT NULL AUTO_INCREMENT, \`name\` VARCHAR(191) NOT NULL, \`appliedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`), UNIQUE KEY \`_AppMigration_name_key\` (\`name\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    console.log(`OTE database bootstrap: ${files.length} migration file(s) found.`);
    for(const file of files){
      const rows=await conn.query('SELECT name FROM `_AppMigration` WHERE name=? LIMIT 1',[file]);
      if(rows.length){ console.log(`Migration already applied: ${file}`); continue; }
      console.log(`Applying database migration ${file}...`);
      const sql=await fs.readFile(path.join(migrationDir,file),'utf8');
      await conn.query(sql);
      await conn.query('INSERT INTO `_AppMigration` (`name`) VALUES (?)',[file]);
    }
  } finally {
    if(conn) conn.release();
    await pool.end();
  }

  console.log('OTE database bootstrap: schema ready. Seeding reference data if needed...');
  // Seed via Prisma's JS driver adapter after the schema exists. No native Prisma engine is used.
  await import('../prisma/seed.mjs');
  // prisma/seed.mjs also uses lib/db.js for access-setting inserts.
  // Close that shared MariaDB pool so this bootstrap process can actually exit.
  await closePool();
  console.log('OTE database bootstrap complete.');
}

main().catch(err=>{console.error('Database bootstrap failed:',err);process.exit(1)});
