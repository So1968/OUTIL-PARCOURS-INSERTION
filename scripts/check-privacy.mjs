import { execFileSync } from 'node:child_process';
import path from 'node:path';

// Vérification des fichiers indexés par Git ; ne lit jamais les dossiers OneDrive.
const permittedMigrations = new Set([
  "backend/prisma/migrations/20261023_initial_schema/migration.sql",
  "backend/prisma/migrations/20261023_worktask_request_id/migration.sql",
  "backend/prisma/migrations/20261024_shared_note_revisions/migration.sql",
]);
const forbiddenMigrationStatements = /\b(?:INSERT\s+INTO|UPDATE\s+\S+\s+SET|DELETE\s+FROM|COPY\s+\S+\s+(?:FROM|TO)|CREATE\s+(?:USER|ROLE|EXTENSION)|ALTER\s+ROLE|DROP\s+(?:TABLE|SCHEMA|DATABASE)|GRANT\s+|REVOKE\s+)\b/i;
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
const textExtensions = new Set([
  '.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.json', '.sql',
  '.md', '.txt', '.html', '.css', '.yml', '.yaml', '.xml',
]);
const indicators = [
  { name: 'jeton GitHub ou OpenAI', regex: /\b(?:github_pat_|gh[pousr]_|sk-(?:proj-)?)[A-Za-z0-9_-]{18,}\b/g },
  { name: 'clé AWS', regex: /\bAKIA[A-Z0-9]{16}\b/g },
  { name: 'clé privée', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { name: 'courriel', regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { name: 'téléphone français', regex: /\b(?:\+33[\s.-]?|0033[\s.-]?|0)[1-9](?:[\s.-]?[0-9]{2}){4}\b/g },
];
const allowedDemonstration = new Set(['0600000000', '0100000000']);

function isForbidden(filePath) {
  if (permittedMigrations.has(filePath)) return false;
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

function isAcceptedExample(indicator, match) {
  if (indicator.name === 'téléphone français') {
    return allowedDemonstration.has(match.replace(/\D/g, ''));
  }
  if (indicator.name === 'courriel') {
    return /@(?:example\.(?:com|org|net)|exemple\.invalid|localhost\.invalid)$/i.test(match);
  }
  return false;
}

let trackedFiles;
try {
  trackedFiles = execFileSync('git', ['ls-files', '--cached', '-z'], {
    cwd: process.cwd(), encoding: 'utf8',
  }).split('\0').filter(Boolean);
} catch {
  console.error('PRIVACY CHECK FAILED: impossible de lire l’index Git.');
  process.exit(2);
}

const violations = trackedFiles.filter(isForbidden).map(file => ({ file, reason: 'chemin ou extension interdits' }));
let inspectedTextFiles = 0;

for (const file of trackedFiles) {
  if (isForbidden(file) || !textExtensions.has(path.extname(file).toLowerCase())) continue;
  let contents;
  try {
    // Le contenu indexé est examiné, y compris lorsqu’il diffère du fichier local.
    contents = execFileSync('git', ['show', ':' + file], {
      encoding: 'utf8', maxBuffer: 4 * 1024 * 1024,
    });
  } catch {
    violations.push({ file, reason: 'lecture du contenu impossible' });
    continue;
  }
  inspectedTextFiles++;
  if (permittedMigrations.has(file)) {
    // Exception étroite : migrations schéma seulement, jamais contenu métier.
    // Le fichier ne peut contenir de DML, export, création de rôle ni extension.
    if (!/(?:CREATE\s+TABLE|ALTER\s+TABLE)/i.test(contents) || forbiddenMigrationStatements.test(contents) ||
      contents.length > 300000) {
      violations.push({ file, reason: 'migration SQL non limitée au schéma' });
    }
  }
  for (const indicator of indicators) {
    indicator.regex.lastIndex = 0;
    if ([...contents.matchAll(indicator.regex)].some(match => !isAcceptedExample(indicator, match[0]))) {
      violations.push({ file, reason: indicator.name });
    }
  }
}

if (violations.length) {
  console.error('PRIVACY CHECK FAILED : contenu ou fichier potentiellement confidentiel.');
  for (const { file, reason } of violations) console.error(`- ${file} : ${reason}`);
  console.error('Le détail détecté n’est jamais imprimé dans les journaux CI.');
  process.exit(1);
}

console.log(`Privacy check passed: ${trackedFiles.length} fichiers suivis, ${inspectedTextFiles} fichiers texte inspectés.`);
