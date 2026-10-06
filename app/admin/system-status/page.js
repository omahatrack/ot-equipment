import AppShell from '../../../components/AppShell';
import {getCurrentUser} from '../../../lib/session';
import {sql} from '../../../lib/db';
import {checkSupabaseStorage,getSupabaseStorageConfig} from '../../../lib/supabaseStorage';
import {notFound} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function SystemStatus({searchParams}){
  const user=await getCurrentUser();if(user?.role?.name!=='Admin')notFound();const sp=await searchParams;const migrated=Number(sp?.migrated||0);
  let db={ok:false,error:null,migrations:0,last:null};try{const rows=await sql('SELECT name,appliedAt FROM _AppMigration ORDER BY appliedAt DESC');db={ok:true,migrations:rows.length,last:rows[0]||null}}catch(e){db.error=e.message}
  const storage=await checkSupabaseStorage();const cfg=getSupabaseStorageConfig();
  const legacyDocs=(await sql(`SELECT (SELECT COUNT(*) FROM ServiceAttachment WHERE (storageProvider IS NULL OR storageProvider='database') AND data IS NOT NULL) + (SELECT COUNT(*) FROM EquipmentPhoto WHERE (storageProvider IS NULL OR storageProvider='database') AND data IS NOT NULL) total`))[0]?.total||0;
  const smtp=Boolean(process.env.SMTP_HOST&&process.env.SMTP_FROM);
  const secret=Boolean(process.env.SESSION_SECRET);
  const item=(name,ok,detail)=><div className={`statusItem ${ok?'ok':'warn'}`}><div><b>{name}</b><div className="muted">{detail}</div></div><span className="statusBadge">{ok?'Ready':'Needs Setup'}</span></div>;
  return <AppShell title="System Status" active="System Status"><section className="card"><h2>Production Readiness</h2>{migrated?<div className="callout success">Migrated {migrated} legacy file{migrated===1?'':'s'} to Supabase Storage.</div>:null}<div className="statusList">{item('MySQL Database',db.ok,db.ok?`${db.migrations} migrations applied${db.last?` • latest ${db.last.name}`:''}`:db.error||'Database unavailable')}{item('Supabase Storage',storage.ok,storage.ok?`Connected to bucket: ${cfg.bucket}`:storage.error||`Bucket: ${cfg.bucket}`)}{item('SMTP Email',smtp,smtp?'Outbound password-reset email is configured.':'Add SMTP_HOST, SMTP_USER and SMTP_PASSWORD in GoDaddy.')}{item('Permanent Session Secret',secret,secret?'SESSION_SECRET is configured.':'App can run with fallback, but users may be logged out after restart.')}</div>{storage.ok&&Number(legacyDocs)>0?<div className="callout" style={{marginTop:18}}><b>{Number(legacyDocs)} existing file{Number(legacyDocs)===1?'':'s'} are still stored in the MySQL database.</b><form method="post" action="/api/admin/migrate-storage" style={{marginTop:10}}><button className="btn primary">Move Existing Files to Supabase</button></form></div>:null}<div className="callout" style={{marginTop:18}}><b>Backup note:</b> GoDaddy MySQL and Supabase Storage are separate systems. Keep scheduled backups enabled for both before treating this as the only copy of operational records.</div></section></AppShell>
}
