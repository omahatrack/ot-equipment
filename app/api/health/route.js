import {sql} from '../../../lib/db';
export const dynamic='force-dynamic';
export async function GET(){try{const rows=await sql('SELECT COUNT(*) AS count FROM `_AppMigration`');return Response.json({ok:true,app:'OTE Equipment Hub',database:'ok',migrations:Number(rows[0]?.count||0),runtime:'nodejs',time:new Date().toISOString()})}catch(e){return Response.json({ok:false,app:'OTE Equipment Hub',database:'error',message:String(e?.message||'Database unavailable').slice(0,160),time:new Date().toISOString()},{status:503})}}
