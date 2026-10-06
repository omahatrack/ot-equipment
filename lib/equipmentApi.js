import fs from 'node:fs/promises';
import path from 'node:path';

export function text(formData,key){return String(formData.get(key)||'').trim()}
export function numOrNull(v){if(v==null||v==='')return null;const n=Number(v);return Number.isFinite(n)?n:null}
export function safeStatus(v){return ['ACTIVE','OUT_OF_SERVICE','RETIRED','SOLD','ARCHIVED'].includes(v)?v:'ACTIVE'}
export async function saveUpload(file,prefix='equipment'){
  if(!file || typeof file.arrayBuffer!=='function' || !file.size) return null;
  const ext=(path.extname(file.name||'')||'.jpg').toLowerCase().replace(/[^.a-z0-9]/g,'');
  const name=`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
  const dir=path.join(process.cwd(),'public','assets','uploads'); await fs.mkdir(dir,{recursive:true});
  await fs.writeFile(path.join(dir,name),Buffer.from(await file.arrayBuffer()));
  return `/assets/uploads/${name}`;
}
export async function removeUpload(imagePath){
  if(!imagePath?.startsWith('/assets/uploads/'))return;
  try{await fs.unlink(path.join(process.cwd(),'public',imagePath.replace(/^\//,'')))}catch{}
}
