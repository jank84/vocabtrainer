// Levenshtein distance for fuzzy matching
export function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] !== b[j - 1] ? 1 : 0)
      );
    }
  }
  return dp[m][n];
}

// Normalize text: lowercase, keep only letters (including Polish diacritics)
export function normalizeText(text) {
  return text.trim().toLowerCase().replace(/[^a-ząćęłńóśźż]/g, '');
}

// Decode HTML entities (e.g. &#x27; -> ')
export function decodeHTML(str) {
  const el = document.createElement('textarea');
  el.innerHTML = str;
  return el.value;
}

// Sanitize a filename into a safe slug for use as storage key prefix
export function slugify(filename) {
  return filename
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
