import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.join(root,'src','generated','prisma');
if(!fs.existsSync(dir)) throw new Error('Prisma generated-client folder was not created.');
const files=fs.readdirSync(dir).sort();
console.log('Generated Prisma files:', files.join(', '));
const candidates=['client.ts','client.mts','client.cts'];
const entry=candidates.find(f=>files.includes(f));
if(!entry) throw new Error(`Could not find PrismaClient entrypoint. Files found: ${files.join(', ')}`);
console.log(`PrismaClient entrypoint confirmed: src/generated/prisma/${entry}`);
// Prisma 6.16 prisma-client emits TypeScript source. For a source-shipped client,
// its relative imports must point to the generated TS files, not non-existent .js files.
const clientText=fs.readFileSync(path.join(dir,entry),'utf8');
if(/from ['"]\.\/[^'"]+\.js['"]/.test(clientText)) {
  throw new Error('Generated Prisma client still contains relative .js imports. Set importFileExtension = \"ts\" in schema.prisma and regenerate.');
}

const prismaFile=path.join(root,'lib','prisma.js');
const code=fs.readFileSync(prismaFile,'utf8');
if(!code.includes("../src/generated/prisma/client.ts")) throw new Error('lib/prisma.js does not import the generated client path.');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
for(const [name,cmd] of Object.entries({build:pkg.scripts?.build,prestart:pkg.scripts?.prestart,start:pkg.scripts?.start})){
  if(/prisma\s+(generate|db\s+push|migrate)/i.test(cmd||'')) throw new Error(`${name} still invokes Prisma CLI: ${cmd}`);
}
console.log('GoDaddy lifecycle scripts contain no Prisma generate/db push/migrate commands.');
