import {sql} from './db';
export async function writeAudit({userId=null,locationId=null,entityType,entityId=null,action,summary=null,details=null}){
  try{await sql(`INSERT INTO AuditLog(userId,locationId,entityType,entityId,action,summary,details) VALUES (?,?,?,?,?,?,?)`,[userId,locationId,entityType,String(entityId??'')||null,action,summary||null,details?JSON.stringify(details):null])}catch(e){console.error('Audit log failed:',e.message)}
}
