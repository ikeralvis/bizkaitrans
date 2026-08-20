/** Minimal RFC4180 CSV parser (quoted fields, escaped quotes) - no dependency needed for GTFS's simple files. */
function parseLine(line, delimiter) {
  const fields = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      fields.push(field);
      field = "";
    } else {
      field += ch;
    }
  }
  fields.push(field);
  return fields;
}

/** Parses a full CSV/TSV/semicolon-delimited text into an array of row objects keyed by the header line. */
export function parseCsv(text, delimiter = ",") {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const headers = parseLine(lines[0], delimiter).map((h) => h.trim());
  const rows = new Array(lines.length - 1);
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i], delimiter);
    const row = {};
    for (let j = 0; j < headers.length; j++) row[headers[j]] = values[j] ?? "";
    rows[i - 1] = row;
  }
  return rows;
}
