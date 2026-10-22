import { execFileSync } from 'node:child_process';
import path from 'node:path';

// Inspect the Git index: only files that would be included in a commit.
const forbiddenExtensions = new Set([
  '.csv', '.tsv', '.xlsx', '.xls', '.ods', '.docx', '.doc', '.odt',
  '.rtf', '.pdf', '.jsonl', '.ndjson', '.sql', '.sqlite', '.sqlite3',
  '.db', '.db3', '.dump', '.bak', '.zip', '.7z', '.rar', '.tar', '.gz',
  '.pem', '.key', '.p12', '.pfx', '.p8',
]);
const forbiddenBasenames = new Set([
  '.npmrc', 'id_rsa', 'id_ed25519', 'credentials.json',
  'service-account.json', 'service_account.json', 'secrets.json',
]);
const privateDirectories = new Set([
  'private', 'local-data', 'imports', 'exports', 'dossiers-usagers',
]);

function isForbidden(filePath) {
  const parts = filePath.replaceAll('\\', '/').split('/');
  const name = parts.at(-1).toLowerCase();
  if (parts.slice(0, -1).some((segment) => privateDirectories.has(segment.toLowerCase()))) return true;
  if (name === '.env.example') return false;
  if (/^\.env(?:\.|$)/.test(name)) return true;
  if (forbiddenBasenames.has(name)) return true;
  if (forbiddenExtensions.has(path.extname(name))) return true;
  if (/^(?:beneficiaires|usagers|export[-_]?insertis)(?:[-_.]|$)/.test(name)
    && /\.(?:json|txt|xml|html?|jsonl|ndjson)$/.test(name)) return true;
  return false;
}

let trackedFiles;
try {
  trackedFiles = execFileSync('git', ['ls-files', '--cached', '-z'], {
    cwd: process.cwd(), encoding: 'utf8',
  }).split('\0').filter(Boolean);
} catch {
  console.error('PRIVACY CHECK FAILED: impossible de lire les fichiers suivis par Git.');
  process.exit(2);
}

const violations = trackedFiles.filter(isForbidden);
if (violations.length) {
  console.error('PRIVACY CHECK FAILED: fichiers sensibles ou exports dans le dépôt :');
  for (const file of violations) console.error(`- ${file}`);
  process.exit(1);
}
console.log(`Privacy check passed: ${trackedFiles.length} fichiers suivis contrôlés (noms, chemins, extensions).`);
