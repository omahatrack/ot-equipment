import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const required = [
  'mariadb',
  'nodemailer',
  '@prisma/adapter-mariadb',
  '@prisma/client',
];

function missingPackages() {
  return required.filter((pkg) => {
    try {
      require.resolve(pkg);
      return false;
    } catch {
      return true;
    }
  });
}

let missing = missingPackages();

if (missing.length) {
  console.warn(`OTE prebuild: missing runtime dependencies: ${missing.join(', ')}`);
  console.warn('OTE prebuild: repairing production dependencies from package.json/package-lock.json...');

  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npmCmd, ['install', '--omit=dev', '--no-audit', '--no-fund'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });

  if (result.error || result.status !== 0) {
    console.error('OTE prebuild: npm dependency repair failed.');
    if (result.error) console.error(result.error);
    process.exit(result.status || 1);
  }

  missing = missingPackages();
}

if (missing.length) {
  console.error(`OTE prebuild: runtime dependencies are still missing after repair: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('OTE prebuild: required runtime dependencies are available.');
