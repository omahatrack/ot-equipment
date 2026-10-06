import fs from 'node:fs';
import path from 'node:path';
import archiver from 'archiver';
const root=process.cwd();
const outPath=path.join(root,'OT_Equipment_GoDaddy_Deploy_v22.zip');
const excludedDirs=new Set(['node_modules','.next','.git']);
const excludedFiles=new Set(['OT_Equipment_GoDaddy_Deploy_v22.zip']);
function addTree(archive,absDir,relDir=''){for(const entry of fs.readdirSync(absDir,{withFileTypes:true})){if(entry.isDirectory()&&excludedDirs.has(entry.name))continue;if(!relDir&&excludedFiles.has(entry.name))continue;const abs=path.join(absDir,entry.name),rel=path.posix.join(relDir.split(path.sep).join('/'),entry.name);if(entry.isDirectory())addTree(archive,abs,rel);else if(entry.isFile())archive.file(abs,{name:rel})}}
try{fs.rmSync(outPath,{force:true})}catch{}
const output=fs.createWriteStream(outPath),archive=archiver('zip',{zlib:{level:9}});
const done=new Promise((resolve,reject)=>{output.on('close',resolve);output.on('error',reject);archive.on('warning',err=>err.code==='ENOENT'?console.warn(err.message):reject(err));archive.on('error',reject)});
archive.pipe(output);addTree(archive,root);await archive.finalize();await done;
const stat=fs.statSync(outPath);if(stat.size<1000)throw new Error(`Deployment ZIP is unexpectedly small (${stat.size} bytes)`);console.log(`Deployment ZIP created: ${outPath}`);console.log(`ZIP size: ${(stat.size/1024/1024).toFixed(2)} MB`);
