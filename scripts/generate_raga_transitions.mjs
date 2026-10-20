/**
 * Connected-rāga phrase generator (v2).
 *
 * Run from the project root:  node scripts/generate_raga_transitions.mjs
 *
 * What "connected" means now (v1 only counted shared pitch classes):
 *   - one-svara-change      the two Melakartas differ in exactly one svara variant
 *   - prati-madhyama-pair   the one change is Ma1 ↔ Ma2 (n and n+36)
 *   - two-svara-change      differ in two svaras (only with --max-distance 2)
 *   - graha-bhedam          shifting Sa onto another svara of A gives B's scale
 *
 * Each phrase starts in rāga A, lands on a svara both rāgas share (the pivot),
 * continues in rāga B through a svara that actually changed, and closes on Sa/Pa.
 * Phrases are scored with the same objective as the single-rāga generator.
 *
 * Options:
 *   --per-direction 2     phrases kept per direction (A→B and B→A)   (default 2)
 *   --max-distance 1      1 = one changed svara, 2 = up to two        (default 1)
 *   --no-graha-bhedam     skip graha-bhedam relatives
 *   --duration 8          target seconds per phrase                   (default 8)
 *   --level nipuṇa        saadhaka | nipuṇa | praveena                (default nipuṇa)
 *   --min-score 0.55      drop phrases below this score               (default 0.55)
 *   --seed my-seed
 *
 * Requires Node 22.18+ (imports the TypeScript engine). Older Node:
 *   npx tsx scripts/generate_raga_transitions.mjs
 *
 * Writes only to src/data/musical-phrases/transitions and metadata/transitions-manifest.json.
 * All output is "needs-review" — exploratory, not verified Carnatic practice.
 * Old transition-NN-MM.json files with the same names are overwritten.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const outputRoot = path.join(root, 'src', 'data', 'musical-phrases');
const RAGAS_FILE = path.join(root, 'src', 'data', 'ragas.ts');
const ENGINE_FILE = path.join(root, 'src', 'modules', 'Manodharma', 'phraseGenerator.ts');

let engine;
try {
  engine = await import(pathToFileURL(ENGINE_FILE).href);
} catch (err) {
  console.error(`Could not load the phrase engine at ${ENGINE_FILE}`);
  console.error(String(err && err.message ? err.message : err));
  console.error('This script needs Node 22.18+ (built-in TypeScript support).');
  console.error('On an older Node run:  npx tsx scripts/generate_raga_transitions.mjs');
  process.exit(1);
}
const { generateTransitionCandidates, ragaDistance, ragaRelations } = engine;

function args() {
  const a = process.argv.slice(2);
  const get = (name, fallback) => {
    const i = a.indexOf(`--${name}`);
    return i >= 0 && a[i + 1] !== undefined ? a[i + 1] : fallback;
  };
  return {
    perDirection: Math.max(1, Number(get('per-direction', 2))),
    maxDistance: Math.max(1, Math.min(5, Number(get('max-distance', 1)))),
    grahaBhedam: !a.includes('--no-graha-bhedam'),
    duration: Number(get('duration', 8)),
    level: get('level', 'nipuṇa'),
    minScore: Number(get('min-score', 0.55)),
    seed: get('seed', 'bhava-transition-v2'),
  };
}

function parseMelakartas(source) {
  const out = [];
  const re = /\bmel\(\s*(\d+)\s*,\s*(['"])(.*?)\2\s*,\s*(['"])(.*?)\4\s*,\s*(['"])(.*?)\6\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g;
  for (const m of source.matchAll(re)) {
    const [, num, , name, , devanagari, , telugu, rr, gg, mm, dd, nn] = m;
    const R = +rr, G = +gg, M = +mm, D = +dd, N = +nn;
    out.push({
      number: +num, name, devanagari, telugu,
      notes: { R: R === 1 ? 1 : R === 2 ? 2 : 3, G: G === 1 ? 2 : G === 2 ? 3 : 4, M, D, N },
    });
  }
  return out;
}

const pad = n => String(n).padStart(2, '0');
const round3 = x => Math.round(x * 1000) / 1000;

function main() {
  const opt = args();
  if (!['saadhaka', 'nipuṇa', 'praveena'].includes(opt.level)) {
    console.error(`Unknown --level "${opt.level}". Use saadhaka, nipuṇa or praveena.`);
    process.exitCode = 1;
    return;
  }
  if (!fs.existsSync(RAGAS_FILE)) { console.error(`Cannot find ${RAGAS_FILE}`); process.exitCode = 1; return; }
  const ragas = parseMelakartas(fs.readFileSync(RAGAS_FILE, 'utf8'));
  if (ragas.length !== 72) {
    console.error(`Expected 72 Melakarta records; parsed ${ragas.length}. No transitions generated.`);
    process.exitCode = 1;
    return;
  }

  const dir = path.join(outputRoot, 'transitions');
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(outputRoot, 'metadata'), { recursive: true });

  const files = [];
  let total = 0, pairs = 0, emptyPairs = 0;
  const scores = [];
  const t0 = Date.now();

  for (let i = 0; i < ragas.length; i++) {
    for (let j = i + 1; j < ragas.length; j++) {
      const a = ragas[i], b = ragas[j];
      const relation = ragaRelations(a.number, b.number);
      const near = ragaDistance(a.number, b.number) <= opt.maxDistance;
      const graha = opt.grahaBhedam && relation.includes('graha-bhedam');
      if (!near && !graha) continue;
      pairs++;

      const common = { count: opt.perDirection, durationSeconds: opt.duration, level: opt.level, minScore: opt.minScore, seed: opt.seed };
      const forward = generateTransitionCandidates(a, b, common);
      const backward = generateTransitionCandidates(b, a, common);
      const candidates = [...forward, ...backward];
      if (!candidates.length) { emptyPairs++; continue; }
      candidates.forEach(c => scores.push(c.quality.total));

      const file = `transition-${pad(a.number)}-${pad(b.number)}.json`;
      fs.writeFileSync(path.join(dir, file), JSON.stringify({
        schemaVersion: 2,
        type: 'experimental-raga-transitions',
        pair: { a: { number: a.number, name: a.name }, b: { number: b.number, name: b.name }, distance: ragaDistance(a.number, b.number), relation },
        candidates,
      }, null, 2), 'utf8');
      files.push({ file: `transitions/${file}`, a: a.number, b: b.number, relation, count: candidates.length });
      total += candidates.length;
    }
  }

  const manifest = {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    generator: 'Bhāva connected-rāga phrase generator v2',
    status: 'experimental-needs-musician-review',
    settings: opt,
    pairCount: files.length,
    pairsConsidered: pairs,
    pairsWithoutAcceptablePhrases: emptyPairs,
    candidateCount: total,
    meanScore: scores.length ? round3(scores.reduce((x, y) => x + y, 0) / scores.length) : 0,
    compatibilityRule: 'Pairs are related by one/two svara changes (Hamming distance on R,G,M,D,N variants) or by graha bhedam. Each phrase has a shared pivot svara and passes through a changed svara.',
    files,
    notes: [
      'Original candidates/ files are not changed.',
      'No WAV files are generated by this script.',
      'Use tools/audition.html to preview. Equal-tempered preview only: gamaka and śruti nuance are not modelled.',
    ],
  };
  fs.writeFileSync(path.join(outputRoot, 'metadata', 'transitions-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Generated ${total} transition phrases across ${files.length} rāga pairs in ${((Date.now() - t0) / 1000).toFixed(1)} s.`);
  console.log(`Mean quality score: ${manifest.meanScore}. ${emptyPairs} pair(s) had no phrase above --min-score.`);
  console.log(`Output: ${dir}`);
}

main();
