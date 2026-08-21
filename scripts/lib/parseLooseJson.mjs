/**
 * Standalone copy of src/lib/shared/looseJson.ts's algorithm, kept dependency-free
 * so pipeline scripts run with plain `node` (no bundler/ts-node) - including from
 * a GitHub Action. Keep both copies in sync if the parsing logic ever changes.
 */
export function looseJsonToJson(text) {
  const body = text.trim().replace(/^\(/, "").replace(/\);?$/, "");
  let out = "";
  let inString = false;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === "'") {
      out += '"';
      inString = !inString;
      continue;
    }
    if (inString && ch === '"') {
      out += '\\"';
      continue;
    }
    if (inString && ch === "\\") {
      out += "\\\\";
      continue;
    }
    out += ch;
  }
  return out;
}

export function parseLooseJson(text) {
  return JSON.parse(looseJsonToJson(text));
}
