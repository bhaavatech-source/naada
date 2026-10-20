# Nāda Vidyā UI correction pass — 17 October 2026

## Implemented

- Grouped notation tokens into bar-delimited phrases while retaining each token's original index. The active-note index mapping therefore remains stable.
- Updated the Rāga Library notation layout so phrase groups wrap as units on narrow screens instead of leaving bar markers detached from their phrase.
- Tuned note spacing, card contrast, typography, and header wrapping for mobile/tablet/laptop widths.
- Removed visible Hz values from the active-note panels and scale-button tooltips in the active Rāga and Janya library screens. Hz remains in internal audio calculations.
- Added automated coverage for phrase grouping and preservation of token indexes.

## Verification

- `npm run test:svara`: PASS — 225 tests.
- TypeScript transpile/syntax check for the two edited TSX screens: PASS.
- `npm run build`: BLOCKED by incomplete local dependencies/type definitions in `node_modules` (missing React and several `@types` packages). This is an environment/dependency issue; a production build has not been verified.
- Browser/device visual QA and listening tests still need to be performed after dependencies are installed.

## Caution

Phrase-aware wrapping improves presentation but does not replace musical validation. The exercise's actual notation convention for comma holds, dashes/rests, and octave marks must remain validated against the playback scheduler and trusted Carnatic references.
