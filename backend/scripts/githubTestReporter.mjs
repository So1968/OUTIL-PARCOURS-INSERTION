import { relative } from "node:path";

const escapeMessage = value => String(value).replaceAll("%", "%25")
  .replaceAll("\r", "%0D").replaceAll("\n", "%0A");
const escapeProperty = value => escapeMessage(value).replaceAll(",", "%2C").replaceAll(":", "%3A");

// En complément de TAP : rend les assertions visibles dans les contrôles PR,
// même si le téléchargement des archives de journaux est indisponible.
// Le runner Node conserve seul le résultat et le code de sortie des tests.
export default async function* githubTestReporter(source) {
  for await (const event of source) {
    if (event.type !== "test:fail") continue;
    const { file, line, name, details } = event.data;
    const error = details?.error?.cause ?? details?.error;
    const message = `${name}: ${error?.message ?? "Échec du test"}`.slice(0, 4000);
    const location = file ? ` file=${escapeProperty(relative(process.env.GITHUB_WORKSPACE || process.cwd(), file))}`
      + (Number.isInteger(line) && line > 0 ? `,line=${line}` : "") : "";
    yield `::error${location}::${escapeMessage(message)}\n`;
  }
}
