/**
 * Group notation tokens by bar boundaries for phrase-aware responsive display.
 * The original token index is retained so playback/highlighting maps stay stable.
 */
export interface GroupedNotationToken {
  readonly tok: string;
  readonly ti: number;
}

export function groupNotationTokens(tokens: readonly string[]): GroupedNotationToken[][] {
  const groups: GroupedNotationToken[][] = [];
  let current: GroupedNotationToken[] = [];
  tokens.forEach((tok, ti) => {
    current.push({ tok, ti });
    if (tok === '|' || tok === '||') {
      groups.push(current);
      current = [];
    }
  });
  if (current.length) groups.push(current);
  return groups;
}
