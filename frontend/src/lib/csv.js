function detectDelimiter(line) {
  const candidates = [";", ",", "\t"];

  return candidates
    .map((delimiter) => ({ delimiter, score: line.split(delimiter).length }))
    .sort((a, b) => b.score - a.score)[0].delimiter;
}

export function parseCsv(content) {
  const text = String(content || "");
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) || "";
  const delimiter = detectDelimiter(firstLine);
  const lines = [];
  let line = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (character === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === delimiter && !quoted) {
      line.push(value);
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      line.push(value);
      if (line.some((cell) => cell.trim())) lines.push(line);
      line = [];
      value = "";
    } else {
      value += character;
    }
  }

  line.push(value);
  if (line.some((cell) => cell.trim())) lines.push(line);
  if (lines.length < 2) return [];

  const headers = lines[0].map((header) => header.trim().replace(/^\uFEFF/, ""));

  return lines.slice(1).map((cells) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = String(cells[index] || "").trim();
    });
    return item;
  });
}
