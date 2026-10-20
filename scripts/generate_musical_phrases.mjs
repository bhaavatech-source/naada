/**
 * Batch generator for Bhāva musical phrases (v2 — scored, motif-based).
 *
 * Run from the project root (E:\nadopaasana-android):
 *   node scripts/generate_musical_phrases.mjs
 *
 * Options:
 *   --per-raga 36        phrases kept per Melakarta        (default 36 → 4 per duration×level)
 *   --pool 40            candidates sampled per kept phrase (default 40; higher = better, slower)
 *   --min-score 0.60     drop phrases scoring below this    (default 0.60)
 *   --max-similarity 0.72  how alike two kept phrases may be (default 0.72)
 *   --seed my-seed       change the random seed for a fresh set
 *   --only 15,29,65      only these Melakarta numbers
 *
 * Requires Node 22.18+ (it imports the TypeScript engine directly).
 * On an older Node:  npx tsx scripts/generate_musical_phrases.mjs
 *
 * Output (src/data/musical-phrases/):
 *   candidates/melakarta-NN.json   best phrases per rāga, each with notation + score
 *   metadata/manifest.json         counts, mean scores, shortfalls
 *
 * Everything is still labelled "needs-review": the score measures melodic shape,
 * rhythm, cadence and rāga-colour heuristics — it is not a rāga-grammar check.
 * Existing melakarta-NN.json files are overwritten; back up the old folder first.
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
  console.error('On an older Node run:  npx tsx scripts/generate_musical_phrases.mjs');
  process.exit(1);
}
const { generatePhraseCandidates, variantsFromNumber } = engine;

function args() {
  const a = process.argv.slice(2);
  const get = (name, fallback) => {
    const i = a.indexOf(`--${name}`);
    return i >= 0 && a[i + 1] !== undefined ? a[i + 1] : fallback;
  };
  return {
    perRaga: Math.max(1, Number(get('per-raga', 36))),
    pool: Math.max(5, Number(get('pool', 40))),
    minScore: Number(get('min-score', 0.6)),
    maxSimilarity: Number(get('max-similarity', 0.72)),
    seed: get('seed', 'bhava-phrase-v2'),
    only: get('only', '').split(',').map(s => Number(s.trim())).filter(Boolean),
  };
}

function parseMelakartas(source) {
  // Project format: mel(1,'Kanakaṅgi','…','…',1,1,5,8,9)
  // 5 numbers = R, G (variant index 1-3) and M, D, N (semitones).
  const results = [];
  const re = /\bmel\(\s*(\d+)\s*,\s*(['"])(.*?)\2\s*,\s*(['"])(.*?)\4\s*,\s*(['"])(.*?)\6\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g;
  for (const match of source.matchAll(re)) {
    const [, number, , name, , devanagari, , telugu, rawR, rawG, rawM, rawD, rawN] = match;
    const R = Number(rawR), G = Number(rawG), M = Number(rawM), D = Number(rawD), N = Number(rawN);
    results.push({
      number: Number(number), name, devanagari, telugu,
      notes: { R: R === 1 ? 1 : R === 2 ? 2 : 3, G: G === 1 ? 2 : G === 2 ? 3 : 4, M, D, N },
    });
  }
  return results;
}

const SEMI = { R1: 1, R2: 2, R3: 3, G1: 2, G2: 3, G3: 4, M1: 5, M2: 6, D1: 8, D2: 9, D3: 10, N1: 9, N2: 10, N3: 11 };

function checkAgainstTheory(raga) {
  const v = variantsFromNumber(raga.number);
  const expect = { R: SEMI[v.R], G: SEMI[v.G], M: SEMI[v.M], D: SEMI[v.D], N: SEMI[v.N] };
  return Object.keys(expect).filter(k => raga.notes[k] !== expect[k]);
}

function mean(xs) { return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0; }
const round3 = x => Math.round(x * 1000) / 1000;

function main() {
  const opt = args();
  if (!fs.existsSync(RAGAS_FILE)) {
    console.error(`Cannot find ${RAGAS_FILE}`);
    console.error('Adjust RAGAS_FILE in this script to match your actual Melakarta data file.');
    process.exitCode = 1;
    return;
  }
  let ragas = parseMelakartas(fs.readFileSync(RAGAS_FILE, 'utf8'));
  if (ragas.length === 0) {
    console.error('Could not parse any Melakarta records from ragas.ts.');
    console.error('This project may use a different data declaration. Nothing was generated.');
    process.exitCode = 1;
    return;
  }
  if (ragas.length !== 72) console.warn(`Warning: parsed ${ragas.length} Melakartas (expected 72).`);
  for (const r of ragas) {
    const bad = checkAgainstTheory(r);
    if (bad.length) console.warn(`Warning: #${r.number} ${r.name}: ragas.ts pitches for ${bad.join(', ')} differ from standard Melakarta theory — check the data.`);
  }
  if (opt.only.length) ragas = ragas.filter(r => opt.only.includes(r.number));

  fs.mkdirSync(path.join(outputRoot, 'candidates'), { recursive: true });
  fs.mkdirSync(path.join(outputRoot, 'metadata'), { recursive: true });

  const manifest = {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    generator: 'Bhāva rule-based phrase generator v2 (structured sampling + scoring)',
    settings: opt,
    totalCandidates: 0,
    meanScore: 0,
    shortfalls: [],
    note: 'All candidates require rāga/phrase review. Score = melodic shape, rhythm, cadence and rāga-colour heuristics, not rāga grammar.',
    files: [],
  };
  const allScores = [];
  const t0 = Date.now();

  for (const raga of ragas) {
    const phrases = generatePhraseCandidates(raga, {
      count: opt.perRaga,
      poolFactor: opt.pool,
      minScore: opt.minScore,
      maxSimilarity: opt.maxSimilarity,
      seed: opt.seed,
    });
    const scores = phrases.map(p => p.quality.total);
    allScores.push(...scores);
    if (phrases.length < opt.perRaga) manifest.shortfalls.push({ ragaNumber: raga.number, wanted: opt.perRaga, got: phrases.length });

    const fileName = `melakarta-${String(raga.number).padStart(2, '0')}.json`;
    fs.writeFileSync(path.join(outputRoot, 'candidates', fileName), JSON.stringify({
      schemaVersion: 2,
      raga: { number: raga.number, name: raga.name, devanagari: raga.devanagari, telugu: raga.telugu, family: 'melakarta' },
      generatedAt: new Date().toISOString(),
      candidateCount: phrases.length,
      meanScore: round3(mean(scores)),
      phrases,
    }, null, 2), 'utf8');
    manifest.totalCandidates += phrases.length;
    manifest.files.push({ file: `candidates/${fileName}`, ragaNumber: raga.number, ragaName: raga.name, count: phrases.length, meanScore: round3(mean(scores)) });
  }

  manifest.meanScore = round3(mean(allScores));
  fs.writeFileSync(path.join(outputRoot, 'metadata', 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Generated ${manifest.totalCandidates} phrases for ${ragas.length} Melakarta rāgas in ${((Date.now() - t0) / 1000).toFixed(1)} s.`);
  console.log(`Mean quality score: ${manifest.meanScore}  (min ${round3(Math.min(...allScores))}, max ${round3(Math.max(...allScores))})`);
  if (manifest.shortfalls.length) console.log(`${manifest.shortfalls.length} rāga(s) returned fewer than ${opt.perRaga} phrases (quality/diversity filter) — see manifest.json. Lower --min-score or raise --pool to get more.`);
  console.log(`Output: ${outputRoot}`);
  console.log('Note: JSON only; audition with tools/audition.html. All phrases remain "needs-review".');
}

main();
