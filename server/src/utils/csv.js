// Cells starting with these characters can be interpreted as formulas by
// spreadsheet apps (CSV injection), so they are prefixed with a quote.
const FORMULA_CHARS = new Set(['=', '+', '-', '@', '\t', '\r']);

function escapeCell(value) {
  if (value === null || value === undefined) return '';
  let str = String(value);
  if (typeof value === 'string' && FORMULA_CHARS.has(str[0])) str = `'${str}`;
  if (/[",\n\r]/.test(str)) str = `"${str.replace(/"/g, '""')}"`;
  return str;
}

function toCsv(headers, rows) {
  const lines = [headers.map(escapeCell).join(',')];
  for (const row of rows) lines.push(row.map(escapeCell).join(','));
  return lines.join('\r\n');
}

module.exports = { escapeCell, toCsv };
