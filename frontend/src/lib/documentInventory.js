export function fileExtension(name) {
  const value = String(name || "");
  const index = value.lastIndexOf(".");
  return index > 0 ? value.slice(index + 1).toLowerCase() : "sans-extension";
}

export function fileFingerprint(file) {
  return `${String(file?.name || "").toLowerCase()}|${Number(file?.size || 0)}`;
}

export function buildFolderInventory(files, rootName, groupName, baseRoot, maxIndexedFiles = 80) {
  const list = Array.from(files || []);
  const relevant = list.filter((file) => {
    const relative = file.webkitRelativePath || file.name || "";
    const parts = relative.split("/").filter(Boolean);
    const detectedGroup = parts.length > 2 ? parts[1] : rootName;
    return detectedGroup === groupName;
  });

  const extensionCounts = {};
  let latestModified = 0;

  relevant.forEach((file) => {
    const ext = fileExtension(file.name);
    extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
    latestModified = Math.max(latestModified, Number(file.lastModified || 0));
  });

  const fingerprintCounts = new Map();
  relevant.forEach((file) => {
    const key = fileFingerprint(file);
    fingerprintCounts.set(key, (fingerprintCounts.get(key) || 0) + 1);
  });

  const prefix = String(baseRoot || "").replace(/[\\/]$/, "");
  const indexedFiles = relevant.slice(0, maxIndexedFiles).map((file) => {
    const relative = file.webkitRelativePath || file.name || "";
    const parts = relative.split("/").filter(Boolean);
    const insideGroup = parts.length > 2 ? parts.slice(2).join("\\") : file.name;
    const chemin = prefix
      ? `${prefix}\\${groupName}${insideGroup ? `\\${insideGroup}` : ""}`
      : relative.replaceAll("/", "\\");

    return {
      name: file.name,
      extension: fileExtension(file.name),
      size: Number(file.size || 0),
      lastModified: Number(file.lastModified || 0),
      relativePath: relative,
      chemin,
      duplicatePotential: (fingerprintCounts.get(fileFingerprint(file)) || 0) > 1,
    };
  });

  return {
    fileCount: relevant.length,
    indexedFileCount: indexedFiles.length,
    indexedFiles,
    extensionCounts,
    latestModified,
    truncated: relevant.length > indexedFiles.length,
  };
}

export function duplicateStats(files) {
  const counts = new Map();

  Array.from(files || []).forEach((file) => {
    const key = fileFingerprint(file);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  let duplicateFiles = 0;
  let duplicateGroups = 0;
  counts.forEach((count) => {
    if (count > 1) {
      duplicateGroups += 1;
      duplicateFiles += count;
    }
  });

  return { duplicateGroups, duplicateFiles };
}

export function humanFileSize(bytes) {
  const value = Number(bytes || 0);
  if (value < 1024) return `${value} o`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} Ko`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} Mo`;
  return `${(value / 1024 ** 3).toFixed(1)} Go`;
}


export function suggestedTriage(file) {
  if (file?.duplicatePotential) return "Doublon à vérifier";
  return "À décider";
}
