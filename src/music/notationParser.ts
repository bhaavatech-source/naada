import {
  type SvaraId,
  type SvaraFamily,
  type Octave,
  isValidSvaraId,
  SvaraValidationError,
  ALL_SVARA_IDS,
} from './svaraValidation';

export interface ParseTokenContext {
  defaultVariants?: Partial<Record<SvaraFamily, SvaraId>>;
}

export interface ParsedSvaraToken {
  readonly raw: string;
  readonly svaraId: SvaraId;
  readonly octave: Octave;
  readonly isRest: boolean;
}

export function parseSvaraToken(
  token: string,
  context?: ParseTokenContext
): ParsedSvaraToken {
  if (typeof token !== 'string') {
    throw new SvaraValidationError(`Invalid token type: expected string, got ${typeof token}.`);
  }

  const raw = token.trim();
  if (raw.length === 0) {
    throw new SvaraValidationError('Cannot parse empty svara token.');
  }

  let cleanToken = raw.normalize('NFC');
  let octave: Octave = 0;
  let hasExplicitOctave = false;

  if (cleanToken === 'P_high') {
    cleanToken = 'P';
    octave = 1;
    hasExplicitOctave = true;
  } else if (/^[ṠṘĠṀṖḊṄ]/.test(cleanToken)) {
    octave = 1;
    hasExplicitOctave = true;
    const baseChar = cleanToken.charAt(0);
    const charMap: Record<string, string> = {
      'Ṡ': 'S',
      'Ṙ': 'R',
      'Ġ': 'G',
      'Ṁ': 'M',
      'Ṗ': 'P',
      'Ḋ': 'D',
      'Ṅ': 'N',
    };
    cleanToken = charMap[baseChar] + cleanToken.slice(1);
  } else if (/^(?:[ṣṛġṃḍṇṢṚṂḌṆ]|[pP]\u0323)/.test(cleanToken)) {
    octave = -1;
    hasExplicitOctave = true;
    const baseChar = cleanToken.charAt(0);
    const charMap: Record<string, string> = {
      'ṣ': 's',
      'ṛ': 'r',
      'ġ': 'g',
      'ṃ': 'm',
      'ḍ': 'd',
      'ṇ': 'n',
      'Ṣ': 's',
      'Ṛ': 'r',
      'Ṃ': 'm',
      'Ḍ': 'd',
      'Ṇ': 'n',
    };
    cleanToken = /^[pP]\u0323/.test(cleanToken)
      ? 'p' + cleanToken.slice(2)
      : charMap[baseChar] + cleanToken.slice(1);
  }

  if (cleanToken.endsWith("''") || cleanToken.endsWith('^^') || cleanToken.endsWith('..')) {
    // Apostrophes/carets and dots are upper-octave markers in this project's
    // canonical notation. Commas and underscores mark the lower octave.
    octave = 2;
    hasExplicitOctave = true;
    cleanToken = cleanToken.slice(0, -2);
  } else if (cleanToken.endsWith(',,') || cleanToken.endsWith('__')) {
    octave = -2;
    hasExplicitOctave = true;
    cleanToken = cleanToken.slice(0, -2);
  } else if (cleanToken.endsWith(',') || cleanToken.endsWith('_')) {
    octave = -1;
    hasExplicitOctave = true;
    cleanToken = cleanToken.slice(0, -1);
  } else if (cleanToken.endsWith('.') || cleanToken.endsWith("'") || cleanToken.endsWith('^')) {
    octave = 1;
    hasExplicitOctave = true;
    cleanToken = cleanToken.slice(0, -1);
  }

  // Legacy exercise notation uses lowercase for madhya sthāyi and uppercase
  // single-letter swaras for tāra sthāyi. Explicit octave marks take priority.
  if (!hasExplicitOctave && /^[SRGMPDN]$/.test(raw)) octave = 1;

  const upper = cleanToken.toUpperCase();
  if (isValidSvaraId(upper)) {
    return Object.freeze({
      raw,
      svaraId: upper,
      octave,
      isRest: false,
    });
  }

  if (upper === 'S') return Object.freeze({ raw, svaraId: 'S', octave, isRest: false });
  if (upper === 'P') return Object.freeze({ raw, svaraId: 'P', octave, isRest: false });

  const firstLetter = upper.charAt(0) as SvaraFamily;
  if (['R', 'G', 'M', 'D', 'N'].includes(firstLetter) && upper === firstLetter) {
    const resolved = context?.defaultVariants?.[firstLetter];
    if (resolved !== undefined) {
      if (!isValidSvaraId(resolved)) {
        throw new SvaraValidationError(`Invalid context variant "${String(resolved)}" for family "${firstLetter}".`);
      }
      if (resolved.charAt(0) !== firstLetter) {
        throw new SvaraValidationError(
          `Context variant "${resolved}" does not belong to svara family "${firstLetter}".`
        );
      }
      return Object.freeze({
        raw,
        svaraId: resolved,
        octave,
        isRest: false,
      });
    }

    throw new SvaraValidationError(
      `Ambiguous svara token "${raw}". Family "${firstLetter}" requires an explicit variant (e.g. ${firstLetter}1, ${firstLetter}2) or a raga context map.`
    );
  }

  throw new SvaraValidationError(
    `Unrecognized svara notation token: "${raw}". Valid identities are [${ALL_SVARA_IDS.join(', ')}].`
  );
}

export type ParsedNotationItem =
  | { readonly kind: 'note'; readonly token: ParsedSvaraToken; readonly durationBeats: number }
  | { readonly kind: 'rest'; readonly raw: '-'; readonly durationBeats: number }
  | { readonly kind: 'bar'; readonly raw: '|' | '||' };

/**
 * Parse an exercise phrase without losing rhythmic/display markers.
 * A standalone comma lengthens the preceding note by one beat; a dash is a
 * half-beat rest (the legacy Raga Library convention); bars are display-only.
 * A comma attached to a swara remains its lower-octave marker.
 */
export function parseNotationSequence(
  phrase: string,
  context?: ParseTokenContext
): ParsedNotationItem[] {
  if (typeof phrase !== 'string') {
    throw new SvaraValidationError(`Phrase must be a string, received ${typeof phrase}`);
  }
  const rawTokens = phrase.trim().split(/\s+/).filter(Boolean);
  const result: ParsedNotationItem[] = [];
  for (const raw of rawTokens) {
    if (raw === '|' || raw === '||') {
      result.push(Object.freeze({ kind: 'bar', raw }));
      continue;
    }
    if (raw === ',') {
      let previousIndex = result.length - 1;
      while (previousIndex >= 0 && result[previousIndex].kind === 'bar') previousIndex--;
      const previous = result[previousIndex];
      if (!previous || previous.kind !== 'note') {
        throw new SvaraValidationError('A standalone duration comma must follow a note.');
      }
      result[previousIndex] = Object.freeze({
        kind: 'note', token: previous.token, durationBeats: previous.durationBeats + 1,
      });
      continue;
    }
    if (raw === '-') {
      result.push(Object.freeze({ kind: 'rest', raw: '-', durationBeats: 0.5 }));
      continue;
    }
    result.push(Object.freeze({ kind: 'note', token: parseSvaraToken(raw, context), durationBeats: 1 }));
  }
  return result;
}

export function parseNotationPhrase(
  phrase: string,
  context?: ParseTokenContext
): ParsedSvaraToken[] {
  if (typeof phrase !== 'string') {
    throw new SvaraValidationError(`Phrase must be a string, received ${typeof phrase}`);
  }
  const tokens = phrase.trim().split(/\s+/).filter(Boolean);
  return tokens.map((token) => parseSvaraToken(token, context));
}
