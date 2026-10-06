const DEFAULT_BUCKET='equipment-documents';

function cfg(){
  const url=String(process.env.SUPABASE_URL||'').replace(/\/$/,'');
  const key=String(process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||'');
  const bucket=String(process.env.SUPABASE_STORAGE_BUCKET||DEFAULT_BUCKET);
  return {url,key,bucket,configured:Boolean(url&&key&&bucket)};
}
function headers(extra={}){const c=cfg();const h={apikey:c.key,...extra};if(c.key&&!c.key.startsWith('sb_secret_'))h.Authorization=`Bearer ${c.key}`;return h}
export function getSupabaseStorageConfig(){const c=cfg();return {configured:c.configured,bucket:c.bucket,url:c.url}}
export async function checkSupabaseStorage(){
  const c=cfg(); if(!c.configured)return {ok:false,error:'Supabase Storage environment variables are not configured.',...getSupabaseStorageConfig()};
  try{const r=await fetch(`${c.url}/storage/v1/bucket/${encodeURIComponent(c.bucket)}`,{headers:headers(),cache:'no-store'});if(!r.ok)return {ok:false,error:`Bucket check failed (${r.status}).`,...getSupabaseStorageConfig()};return {ok:true,...getSupabaseStorageConfig()}}catch(e){return {ok:false,error:e.message,...getSupabaseStorageConfig()}}
}
async function ensureBucket(){const c=cfg();if(!c.configured)throw new Error('Supabase Storage is not configured.');const check=await fetch(`${c.url}/storage/v1/bucket/${encodeURIComponent(c.bucket)}`,{headers:headers(),cache:'no-store'});if(check.ok)return;if(check.status!==404)throw new Error(`Supabase bucket check failed (${check.status}).`);const create=await fetch(`${c.url}/storage/v1/bucket`,{method:'POST',headers:headers({'Content-Type':'application/json'}),body:JSON.stringify({id:c.bucket,name:c.bucket,public:false})});if(!create.ok&&!([400,409].includes(create.status)))throw new Error(`Supabase bucket creation failed (${create.status}): ${await create.text()}`)}
export async function uploadStorageObject(path,buffer,mimeType){
  const c=cfg(); if(!c.configured)throw new Error('Supabase Storage is not configured. Add SUPABASE_URL, SUPABASE_SECRET_KEY and SUPABASE_STORAGE_BUCKET.');await ensureBucket();
  const r=await fetch(`${c.url}/storage/v1/object/${encodeURIComponent(c.bucket)}/${path.split('/').map(encodeURIComponent).join('/')}`,{method:'POST',headers:headers({'Content-Type':mimeType,'x-upsert':'true'}),body:buffer});
  if(!r.ok)throw new Error(`Supabase upload failed (${r.status}): ${await r.text()}`);return {bucket:c.bucket,path};
}
export async function downloadStorageObject(bucket,path){
  const c=cfg(); if(!c.configured)throw new Error('Supabase Storage is not configured.');
  const b=bucket||c.bucket;const r=await fetch(`${c.url}/storage/v1/object/${encodeURIComponent(b)}/${String(path).split('/').map(encodeURIComponent).join('/')}`,{headers:headers(),cache:'no-store'});if(!r.ok)throw new Error(`Supabase download failed (${r.status}).`);return Buffer.from(await r.arrayBuffer());
}
export async function deleteStorageObject(bucket,path){
  const c=cfg(); if(!c.configured||!path)return;
  const b=bucket||c.bucket;const r=await fetch(`${c.url}/storage/v1/object/${encodeURIComponent(b)}/${String(path).split('/').map(encodeURIComponent).join('/')}`,{method:'DELETE',headers:headers()});
  if(!r.ok&&r.status!==404)throw new Error(`Supabase delete failed (${r.status}).`);
}
export function serviceAttachmentPath(equipmentId,serviceRecordId,fileName){
  const safe=String(fileName||'document').replace(/[^a-zA-Z0-9._-]+/g,'_').slice(-140);
  return `equipment/${equipmentId}/service/${serviceRecordId}/${Date.now()}-${safe}`;
}
