import { type SvaraId, type SvaraFamily, type Octave, assertValidSvaraId } from './svaraValidation';
import { type SvaraDefinition, SVARA_REGISTRY } from './tuning';
import { parseSvaraToken } from './notationParser';
import { getMelakartaVariantMap } from './melakartaMapping';

export interface ResolvedJanyaNote {
  readonly token: string;
  readonly svaraId: SvaraId;
  readonly octave: Octave;
  readonly definition: SvaraDefinition;
}

export function resolveJanyaScale(
  tokens: string | string[],
  parentMelaNumber: number,
  anyaSwaras?: SvaraId[]
): ResolvedJanyaNote[] {
  const tokenList = Array.isArray(tokens) ? tokens : tokens.trim().split(/\s+/).filter(Boolean);
  const parentMap = getMelakartaVariantMap(parentMelaNumber);

  const variantMap: Record<SvaraFamily, SvaraId> = { ...parentMap };
  if (anyaSwaras && anyaSwaras.length > 0) {
    anyaSwaras.forEach((aswara) => {
      assertValidSvaraId(aswara);
      variantMap[SVARA_REGISTRY[aswara].family] = aswara;
    });
  }

  return tokenList.map((token) => {
    const parsed = parseSvaraToken(token, { defaultVariants: variantMap });
    return Object.freeze({
      token,
      svaraId: parsed.svaraId,
      octave: parsed.octave,
      definition: SVARA_REGISTRY[parsed.svaraId],
    });
  });
}
