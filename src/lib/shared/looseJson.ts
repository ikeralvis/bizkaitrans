/**
 * apli.bizkaia.net's "_JSON" endpoints return a JS object literal, not JSON:
 * single-quoted keys/strings, wrapped in `(...)` like JSONP but without a
 * callback function. This converts that literal into valid JSON text without
 * eval/Function, so it's safe to run on untrusted network responses.
 *
 * Assumes string values don't contain literal single quotes (true for every
 * field observed in this API - place names use "/" not apostrophes).
 */
export function looseJsonToJson(text: string): string {
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
    out += ch;
  }
  return out;
}

export function parseLooseJson<T>(text: string): T {
  return JSON.parse(looseJsonToJson(text)) as T;
}
