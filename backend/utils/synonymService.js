const stringSimilarity = require('string-similarity');
const { config } = require('dotenv');
config();

// Use global fetch if available (Node 18+), otherwise try to require node-fetch
let fetchFn = global.fetch;
if (!fetchFn) {
  try {
    // eslint-disable-next-line global-require
    fetchFn = require('node-fetch');
  } catch (e) {
    fetchFn = null;
  }
}

// Simple in-memory cache for synonym sets
const synonymCache = new Map();
const CACHE_TTL_MS = parseInt(process.env.SYNONYM_CACHE_TTL_MS || '86400000', 10); // default 24h

function now() { return Date.now(); }

async function fetchSynonymsFromApi(token) {
  if (!fetchFn) return [];
  try {
    const api = `https://api.datamuse.com/words?max=20&ml=${encodeURIComponent(token)}`;
    const resp = await fetchFn(api, { timeout: 3000 });
    if (!resp || resp.status !== 200) return [];
    const json = await resp.json();
    // Datamuse returns objects with 'word' key
    return json.map(r => (r.word || '').toLowerCase()).filter(Boolean);
  } catch (e) {
    // Network error or fetch not available
    return [];
  }
}

async function getSynonymSet(token) {
  const t = (token || '').toString().toLowerCase().trim();
  if (!t) return new Set();

  const cached = synonymCache.get(t);
  if (cached && (now() - cached.ts) < CACHE_TTL_MS) {
    return new Set(cached.set);
  }

  // seed with the token itself
  const set = new Set([t]);

  // allow opt-out
  if (process.env.DISABLE_SYNONYM_LOOKUP === 'true') {
    synonymCache.set(t, { ts: now(), set: Array.from(set) });
    return new Set(set);
  }

  const synonyms = await fetchSynonymsFromApi(t);
  for (const s of synonyms) set.add(s);

  synonymCache.set(t, { ts: now(), set: Array.from(set) });
  return new Set(set);
}

// Normalize and split into tokens (basic)
function tokenize(text) {
  if (!text) return [];
  return text.toString().toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

// Compute lexical similarity between two texts using synonym expansion
async function lexicalSynonymSimilarity(textA, textB) {
  try {
    // Fast fallback to plain string similarity when fetch is unavailable
    if (!fetchFn || process.env.DISABLE_SYNONYM_LOOKUP === 'true') {
      return stringSimilarity.compareTwoStrings((textA||'').toLowerCase(), (textB||'').toLowerCase());
    }

    const tokensA = tokenize(textA);
    const tokensB = tokenize(textB);

    if (tokensA.length === 0 || tokensB.length === 0) {
      return stringSimilarity.compareTwoStrings((textA||'').toLowerCase(), (textB||'').toLowerCase());
    }

    // Build union set of synonyms for B for fast membership
    const setsB = await Promise.all(tokensB.map(t => getSynonymSet(t)));
    const unionB = new Set();
    for (const s of setsB) for (const w of s) unionB.add(w);

    // Count token matches where any synonym of tokenA appears in unionB
    let matches = 0;
    for (const ta of tokensA) {
      const setA = await getSynonymSet(ta);
      let matched = false;
      for (const w of setA) {
        if (unionB.has(w)) { matched = true; break; }
      }
      if (matched) matches++;
    }

    // compute a normalized similarity score
    const score = (2 * matches) / (tokensA.length + tokensB.length);
    // If score is zero, fall back to standard string similarity for a smoother result
    if (score === 0) return stringSimilarity.compareTwoStrings((textA||'').toLowerCase(), (textB||'').toLowerCase());
    return Math.min(1, Math.max(0, score));
  } catch (e) {
    // On any error, fall back to plain lexical similarity
    return stringSimilarity.compareTwoStrings((textA||'').toLowerCase(), (textB||'').toLowerCase());
  }
}

module.exports = { getSynonymSet, lexicalSynonymSimilarity };
