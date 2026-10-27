import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const curriculumPath = path.join(root, 'public/data/naadopaasana-master-curriculum-v2.json');
const data = JSON.parse(fs.readFileSync(curriculumPath, 'utf8'));
const categories = {
  sarali_varisai: 14,
  janta_varisai: 12,
  dhaatu_varisai: 3,
  mel_sthayi_varisai: 5,
  kil_sthayi_varisai: 5,
  alankaras: 9,
  suladi_sapta_tala_alankaras: 9,
};
const rgPairs = [['R1','G1'], ['R1','G2'], ['R1','G3'], ['R2','G2'], ['R2','G3'], ['R3','G3']];
const dnPairs = [['D1','N1'], ['D1','N2'], ['D1','N3'], ['D2','N2'], ['D2','N3'], ['D3','N3']];
const semitone = { S:0, R1:1, R2:2, R3:3, G1:2, G2:3, G3:4, M1:5, M2:6, P:7, D1:8, D2:9, D3:10, N1:9, N2:10, N3:11 };
const failures = [];
let checkedStrings = 0;
let checkedNoteTokens = 0;
let checkedExercises = 0;
const observedSolfaTokens = new Set();

function expectedVariants(number) {
  const [R, G] = rgPairs[Math.floor((number - 1) / 6) % 6];
  const [D, N] = dnPairs[(number - 1) % 6];
  return { S:'S', R, G, M:number <= 36 ? 'M1' : 'M2', P:'P', D, N };
}
function tokens(value) { return String(value ?? '').trim().split(/\s+/).filter(Boolean); }
function baseInfo(token, mode) {
  if (['|','||',',','-'].includes(token)) return { marker: token };
  if (token === 'P_high') return { family:'P', variant:'P', octave:1 };
  let t = token.normalize('NFC');
  let octave = 0;
  if (mode === 'solfa') {
    const diacritics = { 'Ṡ':'S','Ṙ':'R','Ġ':'G','Ṁ':'M','Ṗ':'P','Ḋ':'D','Ṅ':'N', 'ṣ':'S','ṛ':'R','ġ':'G','ṃ':'M','ḍ':'D','ṇ':'N' };
    if (diacritics[t[0]]) {
      octave = 'ṣṛġṃḍṇ'.includes(t[0]) ? -1 : 1;
      t = diacritics[t[0]] + t.slice(1);
    } else if (t.endsWith('_') || t.endsWith(',')) { octave = -1; t = t.slice(0,-1); }
    else if (t.endsWith('.') || t.endsWith("'") || t.endsWith('^')) { octave = 1; t = t.slice(0,-1); }
    else if (/^[SRGMPDN]$/.test(t)) octave = 1;
    const family = ({s:'S',r:'R',g:'G',m:'M',p:'P',d:'D',n:'N'})[t] ?? t;
    if (!'SRGMPDN'.includes(family)) return null;
    return { family, variant: family, octave };
  }
  const upperOctave = { 'Ṡ':'S','Ṙ':'R','Ġ':'G','Ṁ':'M','Ṗ':'P','Ḋ':'D','Ṅ':'N' };
  const lowerOctave = { 'ṣ':'S','ṛ':'R','ġ':'G','ṃ':'M','p̣':'P','P̣':'P','ḍ':'D','ṇ':'N','Ṣ':'S','Ṛ':'R','Ṃ':'M','Ḍ':'D','Ṇ':'N' };
  const first = t[0];
  // Pa has no precomposed dotted character, so its marker spans two code points.
  const lowerPrefix = Object.keys(lowerOctave).find(prefix => t.startsWith(prefix));
  if (upperOctave[first]) { octave = 1; t = upperOctave[first] + t.slice(1); }
  else if (lowerPrefix) { octave = -1; t = lowerOctave[lowerPrefix] + t.slice(lowerPrefix.length); }
  else if (t.endsWith('_') || t.endsWith(',')) { octave = -1; t = t.slice(0,-1); }
  const match = t.match(/^([SRGMPDN])([123])?$/i);
  if (!match) return null;
  const family = match[1].toUpperCase();
  const variant = family === 'S' || family === 'P' ? family : family + (match[2] ?? '');
  return { family, variant, octave };
}
function addFailure(where, message) { failures.push(`${where}: ${message}`); }

for (const token of ['p\u0323', 'P\u0323', 'p_', 'p,']) {
  assert.deepEqual(baseInfo(token, 'swarasthana'), { family: 'P', variant: 'P', octave: -1 });
}
assert.deepEqual(baseInfo('P', 'swarasthana'), { family: 'P', variant: 'P', octave: 0 });
assert.deepEqual(baseInfo('Ṗ', 'swarasthana'), { family: 'P', variant: 'P', octave: 1 });
assert.equal(baseInfo('p\u0323junk', 'swarasthana'), null);

if (!Array.isArray(data.melakartas) || data.melakartas.length !== 72) {
  addFailure('curriculum', `expected 72 Melakarta entries; got ${data.melakartas?.length ?? 'none'}`);
}
const seen = new Set();
for (const mela of data.melakartas ?? []) {
  const n = mela.mela_number;
  const where = `Mela ${n} ${mela.raga_name}`;
  if (seen.has(n)) addFailure(where, 'duplicate Melakarta number');
  seen.add(n);
  const variants = expectedVariants(n);
  for (const [category, expectedCount] of Object.entries(categories)) {
    const list = mela[category];
    if (!Array.isArray(list) || list.length !== expectedCount) {
      addFailure(where, `${category}: expected ${expectedCount} exercises, got ${Array.isArray(list) ? list.length : 'missing'}`);
      continue;
    }
    for (const ex of list) {
      checkedExercises++;
      const fields = [];
      for (const dir of ['arohana','avarohana']) {
        const item = ex[dir];
        if (item?.solfa) fields.push([`${category}/${ex.name}/${dir}`, item.solfa, item.swarasthana]);
      }
      for (const [i, part] of (ex.parts ?? ex.sections ?? []).entries()) {
        const note = part.notation ?? {};
        if (note.solfa) fields.push([`${category}/${ex.name}/part${i+1}`, note.solfa, note.swarasthana]);
      }
      for (const [key, note] of Object.entries(ex.notation ?? {})) {
        if (note?.solfa) fields.push([`${category}/${ex.name}/${key}`, note.solfa, note.swarasthana]);
      }
      for (const [label, solfa, swarasthana] of fields) {
        checkedStrings++;
        if (!swarasthana) { addFailure(`${where}/${label}`, 'missing swarasthana string'); continue; }
        const a = tokens(solfa), b = tokens(swarasthana);
        for (const token of a) if (!['|','||',',','-'].includes(token)) observedSolfaTokens.add(token);
        if (a.length !== b.length) {
          addFailure(`${where}/${label}`, `solfa/swarasthana token count mismatch (${a.length} vs ${b.length})`);
          continue;
        }
        for (let i=0; i<a.length; i++) {
          const x = baseInfo(a[i], 'solfa');
          const y = baseInfo(b[i], 'swarasthana');
          if (x?.marker || y?.marker) {
            if (x?.marker !== y?.marker) addFailure(`${where}/${label}`, `marker mismatch at token ${i+1}: ${a[i]} vs ${b[i]}`);
            continue;
          }
          if (!x || !y) { addFailure(`${where}/${label}`, `unrecognized token at ${i+1}: ${a[i]} / ${b[i]}`); continue; }
          checkedNoteTokens++;
          if (x.family !== y.family) addFailure(`${where}/${label}`, `swara family mismatch at token ${i+1}: ${a[i]} / ${b[i]}`);
          // A bare family in solfa is resolved from the Melakarta. A swarasthana spelling must match it.
          const expected = variants[x.family] ?? x.family;
          if (y.variant !== expected) addFailure(`${where}/${label}`, `wrong swarasthana at token ${i+1}: got ${y.variant}, expected ${expected}`);
          if (x.octave !== y.octave) addFailure(`${where}/${label}`, `octave mismatch at token ${i+1}: ${a[i]} (${x.octave}) vs ${b[i]} (${y.octave})`);
        }
      }
    }
  }
  // The first Sarali exercise should represent the complete Melakarta scale both ways.
  const first = mela.sarali_varisai?.[0];
  if (first?.arohana?.solfa && first?.avarohana?.solfa) {
    const expectedAsc = ['s','r','g','m','p','d','n','S'];
    const expectedDesc = ['S','n','d','p','m','g','r','s'];
    const getNotes = (s) => tokens(s).filter(t => !['|','||',',','-'].includes(t));
    if (JSON.stringify(getNotes(first.arohana.solfa)) !== JSON.stringify(expectedAsc)) addFailure(where, 'Sarali 1 ascent is not the expected full scale');
    if (JSON.stringify(getNotes(first.avarohana.solfa)) !== JSON.stringify(expectedDesc)) addFailure(where, 'Sarali 1 descent is not the expected reverse scale');
  } else addFailure(where, 'Sarali 1 missing ascent/descent');
}

// Confirm every solfa token used by the curriculum has a matching key/alias in the Rāga Library player.
const playerKeys = new Set(['s','r','g','m','p','d','n','S','R','G','M','P','D','N','s,','r,','g,','m,','p,','d,','n,','Ṡ','Ṙ','Ġ','Ṁ','Ṗ','Ṅ','P_high','ṇ','Ṣ','Ṛ','Ṃ','Ḍ','Ṇ','P̣','Ṗ2']);
for (const token of observedSolfaTokens) {
  const normalized = token.endsWith('_') ? `${token.slice(0,-1)},` : token;
  if (!playerKeys.has(token) && !playerKeys.has(normalized)) addFailure('player token map', `no Rāga Library playback mapping for token ${token}`);
}

// Confirm the app's expected static curriculum URL is present in the build's public tree.
if (!fs.existsSync(curriculumPath)) addFailure('asset path', 'expected public/data/naadopaasana-master-curriculum-v2.json is missing');
console.log(`Rāga Library curriculum audit: ${failures.length ? 'FAILED' : 'PASSED'}`);
console.log(`Melakartas: ${seen.size}/72; exercises checked: ${checkedExercises}; notation strings checked: ${checkedStrings}; note-token pairs checked: ${checkedNoteTokens}; unique player tokens: ${observedSolfaTokens.size}`);
for (const failure of failures.slice(0, 100)) console.error(`- ${failure}`);
if (failures.length > 100) console.error(`... plus ${failures.length - 100} more failures`);
if (failures.length) process.exitCode = 1;
