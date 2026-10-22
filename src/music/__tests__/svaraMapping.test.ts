// src/music/__tests__/svaraMapping.test.ts
import { MELAKARTAS } from '../../data/ragas';
import { saraliVarisaiMmg } from '../../data/mmg/sarali';
import { groupNotationTokens } from '../notationLayout';
import { TONIC_OPTIONS } from '../../data/tonics';

import {
  ALL_SVARA_IDS,
  SVARA_REGISTRY,
  getSvaraDefinition,
  getSvarasBySemitone,
  resolveSvaraPitch,
  getMelakartaSvaraIds,
  getMelakartaChakraName,
  parseSvaraToken,
  parseNotationPhrase,
  parseNotationSequence,
  resolveJanyaScale,
  calculateCentsFromRatio,
  SvaraValidationError,
  validateSvaraRegistry,
} from '../svaraMapping';

export function runAllTests(): { passed: boolean; testCount: number } {
  let count = 0;

  // 1. Registry & Shodasa Svarasthanas
  if (ALL_SVARA_IDS.length !== 16) throw new Error('Registry length mismatch');
  count++;

  // 2. Distinct vivadi pairs at semitone 2, 3, 9, 10
  const s2 = getSvarasBySemitone(2);
  if (s2.length !== 2 || !s2.some((s) => s.id === 'R2') || !s2.some((s) => s.id === 'G1')) {
    throw new Error('Semitone 2 disambiguation failed');
  }
  const s3 = getSvarasBySemitone(3);
  if (s3.length !== 2 || !s3.some((s) => s.id === 'R3') || !s3.some((s) => s.id === 'G2')) {
    throw new Error('Semitone 3 disambiguation failed');
  }
  const s9 = getSvarasBySemitone(9);
  if (s9.length !== 2 || !s9.some((s) => s.id === 'D2') || !s9.some((s) => s.id === 'N1')) {
    throw new Error('Semitone 9 disambiguation failed');
  }
  const s10 = getSvarasBySemitone(10);
  if (s10.length !== 2 || !s10.some((s) => s.id === 'D3') || !s10.some((s) => s.id === 'N2')) {
    throw new Error('Semitone 10 disambiguation failed');
  }
  count += 4;

  // 3. Mathematical validation of all 72 Melakartas
  for (let m = 1; m <= 72; m++) {
    const s = getMelakartaSvaraIds(m);
    if (s.length !== 7 || s[0] !== 'S' || s[4] !== 'P') {
      throw new Error(`Melakarta ${m} scale corrupted`);
    }
    const chakraName = getMelakartaChakraName(m);
    if (!chakraName) throw new Error(`Melakarta ${m} missing chakra`);
    count++;
  }

  // Check specific flagship ragas:
  // Kanakangi (#1): S R1 G1 M1 P D1 N1
  const m1 = getMelakartaSvaraIds(1);
  if (JSON.stringify(m1) !== JSON.stringify(['S', 'R1', 'G1', 'M1', 'P', 'D1', 'N1'])) {
    throw new Error('Mela 1 Kanakangi mismatch');
  }
  // Mayamalavagowla (#15): S R1 G3 M1 P D1 N3
  const m15 = getMelakartaSvaraIds(15);
  if (JSON.stringify(m15) !== JSON.stringify(['S', 'R1', 'G3', 'M1', 'P', 'D1', 'N3'])) {
    throw new Error('Mela 15 Mayamalavagowla mismatch');
  }
  // Kharaharapriya (#22): S R2 G2 M1 P D2 N2
  const m22 = getMelakartaSvaraIds(22);
  if (JSON.stringify(m22) !== JSON.stringify(['S', 'R2', 'G2', 'M1', 'P', 'D2', 'N2'])) {
    throw new Error('Mela 22 Kharaharapriya mismatch');
  }
  // Sankarabharanam (#29): S R2 G3 M1 P D2 N3
  const m29 = getMelakartaSvaraIds(29);
  if (JSON.stringify(m29) !== JSON.stringify(['S', 'R2', 'G3', 'M1', 'P', 'D2', 'N3'])) {
    throw new Error('Mela 29 Sankarabharanam mismatch');
  }
  // Kalyani (#65): S R2 G3 M2 P D2 N3
  const m65 = getMelakartaSvaraIds(65);
  if (JSON.stringify(m65) !== JSON.stringify(['S', 'R2', 'G3', 'M2', 'P', 'D2', 'N3'])) {
    throw new Error('Mela 65 Mechakalyani mismatch');
  }
  count += 5;

  // 4. Pure Just Intonation & 12-TET calculation
  const tonic = 261.63; // C4
  const paJI = resolveSvaraPitch({ svaraId: 'P', tonicHz: tonic, tuningPolicy: 'just_intonation' });
  if (Math.abs(paJI.frequencyHz - tonic * 1.5) > 0.01 || paJI.cents !== 701.96) {
    throw new Error('Pa JI ratio mismatch');
  }
  const paET = resolveSvaraPitch({ svaraId: 'P', tonicHz: tonic, tuningPolicy: 'equal_temperament' });
  if (Math.abs(paET.frequencyHz - tonic * Math.pow(2, 7 / 12)) > 0.01 || paET.cents !== 700) {
    throw new Error('Pa 12-TET mismatch');
  }
  count += 2;

  // 5. Cents dynamic calculation
  const c15_8 = calculateCentsFromRatio(15 / 8);
  if (Math.abs(c15_8 - 1088.27) > 0.05) throw new Error('Kakali Nishadam cents mismatch');
  count++;

  // 5b. Registry ratios and declared cents remain internally consistent
  const registryErrors = validateSvaraRegistry();
  if (registryErrors.length) throw new Error(`Registry validation failed: ${registryErrors.join('; ')}`);
  count++;

  // Custom ratios must affect both pitch and reported cents.
  const customJI = resolveSvaraPitch({
    svaraId: 'R1',
    tonicHz: tonic,
    tuningPolicy: 'just_intonation',
    customRatio: 1.25,
  });
  if (Math.abs(customJI.frequencyHz - tonic * 1.25) > 0.01 ||
      Math.abs(customJI.cents - calculateCentsFromRatio(1.25)) > 0.01 ||
      !customJI.formula.includes('1.25')) {
    throw new Error('Custom JI ratio metadata mismatch');
  }
  count++;

  // Reject malformed family tokens instead of resolving them by first letter.
  try {
    parseSvaraToken('Rfoo', { defaultVariants: { R: 'R1' } });
    throw new Error('Failed to reject malformed token Rfoo');
  } catch (e) {
    if (!(e instanceof SvaraValidationError)) throw e;
  }
  count++;

  // 6. Strict validation: unknown IDs and bad octaves reject explicitly
  try {
    resolveSvaraPitch({ svaraId: 'X' as any, tonicHz: tonic });
    throw new Error('Failed to reject invalid svara ID X');
  } catch (e) {
    if (!(e instanceof SvaraValidationError)) throw e;
  }
  try {
    resolveSvaraPitch({ svaraId: 'S', tonicHz: tonic, octave: 5 as any });
    throw new Error('Failed to reject invalid octave 5');
  } catch (e) {
    if (!(e instanceof SvaraValidationError)) throw e;
  }
  count += 2;

  // 7. Notation parsing & diacritics
  const taraSa = parseSvaraToken('Ṡ');
  if (taraSa.svaraId !== 'S' || taraSa.octave !== 1) throw new Error('Failed to parse Ṡ');
  const mandraPa = parseSvaraToken('p,');
  if (mandraPa.svaraId !== 'P' || mandraPa.octave !== -1) throw new Error('Failed to parse p,');
  const phrase = parseNotationPhrase('s r g m p d n Ṡ', {
    defaultVariants: { R: 'R1', G: 'G3', M: 'M1', D: 'D1', N: 'N3' },
  });
  if (phrase.length !== 8 || phrase[1].svaraId !== 'R1' || phrase[2].svaraId !== 'G3' || phrase[7].octave !== 1) {
    throw new Error('Phrase parsing mismatch');
  }
  count += 3;

  // 7a. Phrase grouping keeps bar boundaries with the preceding phrase and preserves source indexes.
  const grouped = groupNotationTokens(['s', 'r', 'g', 'm', '|', 'p', ',', '-', 'd', '||', 'S.']);
  if (grouped.length !== 3 || grouped[0].map((t) => t.tok).join(' ') !== 's r g m |' ||
      grouped[1].map((t) => t.tok).join(' ') !== 'p , - d ||' ||
      grouped[2][0].tok !== 'S.' || grouped[2][0].ti !== 10) {
    throw new Error('Phrase grouping split a bar group or changed token indexes');
  }
  count++;

  // 7b. Explicit upper-octave dot convention and exercise punctuation parsing.
  const upperSaLegacy = parseSvaraToken('S');
  const middleSaLegacy = parseSvaraToken('s');
  if (upperSaLegacy.octave !== 1 || middleSaLegacy.octave !== 0) {
    throw new Error('Legacy case-based octave convention mismatch');
  }
  const upperSaDot = parseSvaraToken('S.');
  if (upperSaDot.svaraId !== 'S' || upperSaDot.octave !== 1) {
    throw new Error('S. must resolve to upper-octave Sa');
  }
  const sequence = parseNotationSequence('s r g m | p , - d || S.', {
    defaultVariants: { R: 'R1', G: 'G3', M: 'M1', D: 'D1', N: 'N3' },
  });
  const noteItems = sequence.filter((item) => item.kind === 'note');
  if (sequence.filter((item) => item.kind === 'bar').length !== 2 ||
      sequence.filter((item) => item.kind === 'rest').length !== 1 ||
      noteItems[4].durationBeats !== 2 ||
      noteItems[noteItems.length - 1].kind !== 'note' ||
      noteItems[noteItems.length - 1].token.octave !== 1) {
    throw new Error('Exercise notation parsing lost a bar, hold, rest, or octave marker');
  }
  count += 3;

  // Every Sarali line must keep display and playback notation aligned and parse cleanly.
  for (const exercise of saraliVarisaiMmg) {
    for (const line of exercise.lines) {
      const normalize = (value: string) => value.trim().split(/\s+/).join(' ');
      if (normalize(line.display) !== normalize(line.tokens)) {
        throw new Error(`${exercise.name}: display/tokens mismatch: "${line.display}" vs "${line.tokens}"`);
      }
      const parsedLine = parseNotationSequence(line.tokens, {
        defaultVariants: { R: 'R1', G: 'G3', M: 'M1', D: 'D1', N: 'N3' },
      });
      if (!parsedLine.some((item) => item.kind === 'note')) {
        throw new Error(`${exercise.name}: notation line contains no notes`);
      }
      count++;
    }
  }

  // 7c. Cross-check every data-driven Melakarta against canonical swara semitones.
  const semitoneBySvara: Record<string, number> = {
    S: 0, R1: 1, R2: 2, R3: 3, G1: 2, G2: 3, G3: 4,
    M1: 5, M2: 6, P: 7, D1: 8, D2: 9, D3: 10, N1: 9, N2: 10, N3: 11,
  };
  if (MELAKARTAS.length !== 72) throw new Error(`Expected 72 data Melakartas, got ${MELAKARTAS.length}`);
  for (let index = 0; index < MELAKARTAS.length; index++) {
    const raga = MELAKARTAS[index];
    const ids = getMelakartaSvaraIds(index + 1);
    if (raga.number !== index + 1) throw new Error(`Melakarta ordering mismatch at ${index + 1}`);
    const ascendingIds = raga.ascending.slice(0, 7);
    const expectedIds = [...ids];
    if (JSON.stringify(ascendingIds) !== JSON.stringify(expectedIds)) {
      throw new Error(`Melakarta ${index + 1} ascending identity mismatch: ${ascendingIds.join(' ')} vs ${expectedIds.join(' ')}`);
    }
    if (JSON.stringify(raga.descending) !== JSON.stringify([...raga.ascending].reverse())) {
      throw new Error(`Melakarta ${index + 1} descending sequence is not the reverse of ascending`);
    }
    const expectedPositions = [0, ...ids.slice(1).map((id) => semitoneBySvara[id])];
    const actualPositions = [0, raga.notes.R, raga.notes.G, raga.notes.M, 7, raga.notes.D, raga.notes.N];
    if (JSON.stringify(actualPositions) !== JSON.stringify(expectedPositions)) {
      throw new Error(`Melakarta ${index + 1} semitone map mismatch: ${actualPositions.join(',')} vs ${expectedPositions.join(',')}`);
    }
    count++;
  }

  // 8. Janya scale resolution with anya svaras
  const bhairaviAro = resolveJanyaScale('s r g m p d n S', 20); // Natabhairavi (D1)
  if (bhairaviAro[5].svaraId !== 'D1') throw new Error('Natabhairavi arohana D1 expected');
  const bhairaviBhashanga = resolveJanyaScale('s r g m p d n S', 20, ['D2']); // Bhashanga override D2
  if (bhairaviBhashanga[5].svaraId !== 'D2') throw new Error('Bhairavi Bhashanga D2 override failed');
  count += 2;

  const tonicLabels = ['A3', 'A#3', 'B3', 'C4 (Sa)', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4'];
  if (JSON.stringify(TONIC_OPTIONS.map(option => option.label)) !== JSON.stringify(tonicLabels)) {
    throw new Error('Tonic choices must cover every chromatic pitch from A3 through B4');
  }
  count++;
  if (new Set(TONIC_OPTIONS.map(option => option.hz)).size !== 15) {
    throw new Error('Tonic frequencies must be unique');
  }
  count++;
  if (TONIC_OPTIONS.find(option => option.label === 'C4 (Sa)')?.hz !== 261.63) {
    throw new Error('The default C4 tonic must remain unchanged');
  }
  count++;
  TONIC_OPTIONS.forEach((option, index) => {
    const expected = 220 * 2 ** (index / 12);
    if (Math.abs(option.hz - expected) > 0.01) {
      throw new Error(`Invalid tonic tuning for ${option.label}: ${option.hz}`);
    }
    count++;
  });

  return { passed: true, testCount: count };
}

// Self-executing runner if executed via node / ts-node / tsx
const result = runAllTests();
console.log(`[PASS] Modular Svara Architecture Test Suite: ${result.testCount} tests passed successfully.`);
