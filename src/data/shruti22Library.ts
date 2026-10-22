/**
 * shruti22Library.ts
 * Nāda Vidyā / Medhā Platform
 *
 * Master Microtonal 22-Śruti Frequency Ratio & Tuning Library.
 * Provides exact mathematical frequency ratios, cent values, and Web Audio tuning helpers
 * for 22-Śruti microtonal Carnatic audio synthesis.
 */

export interface SrutiDefinition {
  readonly sruti_index: number;
  readonly sruti_name: string;
  readonly swarasthana_code: string;
  readonly swarasthana_name: string;
  readonly ratio_fraction: string;
  readonly ratio_decimal: number;
  readonly cents: number;
  readonly traditional_grāma: string;
  readonly classical_description: string;
  readonly primary_swara_mapping: string;
}

export const SHRUTI_22_DATABASE: readonly SrutiDefinition[] = Object.freeze([
  {
    "sruti_index": 1,
    "sruti_name": "Tīvrā",
    "swarasthana_code": "S",
    "swarasthana_name": "Shadjam",
    "ratio_fraction": "1/1",
    "ratio_decimal": 1.0,
    "cents": 0.0,
    "traditional_grāma": "Ṣaḍja Grāma",
    "classical_description": "Acyuta / Sthira Shadja - Fundamental tonic reference (Sa).",
    "primary_swara_mapping": "S"
  },
  {
    "sruti_index": 2,
    "sruti_name": "Kumudvatī",
    "swarasthana_code": "R1_flat",
    "swarasthana_name": "Eka-Śruti Rishabham",
    "ratio_fraction": "256/243",
    "ratio_decimal": 1.0534979423868314,
    "cents": 90.22499567306306,
    "traditional_grāma": "Ṣaḍja Grāma",
    "classical_description": "Minimally flattened Suddha Rishabham (Pythagorean Limma / 90.22 cents).",
    "primary_swara_mapping": "R1"
  },
  {
    "sruti_index": 3,
    "sruti_name": "Mandā",
    "swarasthana_code": "R1",
    "swarasthana_name": "Suddha Rishabham (Shuddha Ri)",
    "ratio_fraction": "16/15",
    "ratio_decimal": 1.0666666666666667,
    "cents": 111.73128526977774,
    "traditional_grāma": "Ṣaḍja Grāma",
    "classical_description": "Standard Suddha Rishabham (Just Minor Second / 111.73 cents). Used in Mayamalavagowla, Todi.",
    "primary_swara_mapping": "R1"
  },
  {
    "sruti_index": 4,
    "sruti_name": "Chandovatī",
    "swarasthana_code": "R2_flat",
    "swarasthana_name": "Tri-Śruti Rishabham / Chatushruti Ri (Flat)",
    "ratio_fraction": "10/9",
    "ratio_decimal": 1.1111111111111112,
    "cents": 182.40371213406007,
    "traditional_grāma": "Madhyama Grāma",
    "classical_description": "Minor Whole Tone (182.40 cents). Used in Shankarabharanam Ri.",
    "primary_swara_mapping": "R2"
  },
  {
    "sruti_index": 5,
    "sruti_name": "Dayāvatī",
    "swarasthana_code": "R2",
    "swarasthana_name": "Chatushruti Rishabham / Suddha Gandharam",
    "ratio_fraction": "9/8",
    "ratio_decimal": 1.125,
    "cents": 203.91000173077484,
    "traditional_grāma": "Ṣaḍja Grāma",
    "classical_description": "Major Whole Tone (203.91 cents). Standard Chatushruti Rishabham (R2 / G1).",
    "primary_swara_mapping": "R2 / G1"
  },
  {
    "sruti_index": 6,
    "sruti_name": "Ranjanī",
    "swarasthana_code": "G2_flat",
    "swarasthana_name": "Sadharana Gandharam (Flat)",
    "ratio_fraction": "32/27",
    "ratio_decimal": 1.1851851851851851,
    "cents": 294.13499740383764,
    "traditional_grāma": "Gāndhāra Grāma",
    "classical_description": "Pythagorean Minor Third (294.13 cents). Soft Sadharana Gandharam.",
    "primary_swara_mapping": "G2"
  },
  {
    "sruti_index": 7,
    "sruti_name": "Raktikā",
    "swarasthana_code": "G2",
    "swarasthana_name": "Sadharana Gandharam (Standard)",
    "ratio_fraction": "6/5",
    "ratio_decimal": 1.2,
    "cents": 315.64128700055255,
    "traditional_grāma": "Ṣaḍja Grāma",
    "classical_description": "Just Minor Third (315.64 cents). Standard Sadharana Gandharam in Kharaharapriya.",
    "primary_swara_mapping": "G2 / R3"
  },
  {
    "sruti_index": 8,
    "sruti_name": "Raudrī",
    "swarasthana_code": "G3_flat",
    "swarasthana_name": "Antara Gandharam (Flat)",
    "ratio_fraction": "5/4",
    "ratio_decimal": 1.25,
    "cents": 386.3137138648348,
    "traditional_grāma": "Ṣaḍja Grāma",
    "classical_description": "Just Major Third (386.31 cents). Pure Antara Gandharam in Shankarabharanam / Kalyani.",
    "primary_swara_mapping": "G3"
  },
  {
    "sruti_index": 9,
    "sruti_name": "Krodhā",
    "swarasthana_code": "G3",
    "swarasthana_name": "Tīvra Antara Ga / Cyuta Madhyama Ga",
    "ratio_fraction": "81/64",
    "ratio_decimal": 1.265625,
    "cents": 407.8200034615497,
    "traditional_grāma": "Madhyama Grāma",
    "classical_description": "Pythagorean Major Third (407.82 cents). High Antara Ga leaning towards Suddha Ma.",
    "primary_swara_mapping": "G3"
  },
  {
    "sruti_index": 10,
    "sruti_name": "Vajrikā",
    "swarasthana_code": "M1_flat",
    "swarasthana_name": "Suddha Madhyamam (Standard)",
    "ratio_fraction": "4/3",
    "ratio_decimal": 1.3333333333333333,
    "cents": 498.0449991346125,
    "traditional_grāma": "Ṣaḍja Grāma",
    "classical_description": "Just Perfect Fourth (498.04 cents). Suddha Madhyamam anchor.",
    "primary_swara_mapping": "M1"
  },
  {
    "sruti_index": 11,
    "sruti_name": "Prasāriṇī",
    "swarasthana_code": "M1",
    "swarasthana_name": "Tīvra Suddha Madhyamam / Cyuta Pa Ma",
    "ratio_fraction": "27/20",
    "ratio_decimal": 1.35,
    "cents": 519.5512887313275,
    "traditional_grāma": "Madhyama Grāma",
    "classical_description": "Acute Fourth (519.55 cents). Suddha Madhyamam sharpened towards Panchama.",
    "primary_swara_mapping": "M1"
  },
  {
    "sruti_index": 12,
    "sruti_name": "Prīti",
    "swarasthana_code": "M2_flat",
    "swarasthana_name": "Prati Madhyamam (Soft) / Mrdu Pa",
    "ratio_fraction": "45/32",
    "ratio_decimal": 1.40625,
    "cents": 590.2237155956096,
    "traditional_grāma": "Madhyama Grāma",
    "classical_description": "Augmented Fourth / Diatonic Tritone (590.22 cents). Prati Madhyamam in Varali.",
    "primary_swara_mapping": "M2"
  },
  {
    "sruti_index": 13,
    "sruti_name": "Mārjinī",
    "swarasthana_code": "M2",
    "swarasthana_name": "Tīvra Prati Madhyamam",
    "ratio_fraction": "729/512",
    "ratio_decimal": 1.423828125,
    "cents": 611.7300051923246,
    "traditional_grāma": "Ṣaḍja Grāma",
    "classical_description": "Pythagorean Tritone (611.73 cents). Sharp Prati Madhyamam in Kalyani, Pantavarali.",
    "primary_swara_mapping": "M2"
  },
  {
    "sruti_index": 14,
    "sruti_name": "Kṣitī",
    "swarasthana_code": "P",
    "swarasthana_name": "Panchamam (Sthira Pa)",
    "ratio_fraction": "3/2",
    "ratio_decimal": 1.5,
    "cents": 701.9550008653874,
    "traditional_grāma": "Ṣaḍja Grāma",
    "classical_description": "Acyuta / Sthira Panchamam - Perfect Fifth (701.96 cents). Constant consonant anchor.",
    "primary_swara_mapping": "P"
  },
  {
    "sruti_index": 15,
    "sruti_name": "Raktā",
    "swarasthana_code": "D1_flat",
    "swarasthana_name": "Eka-Śruti Dhaivatam / Suddha Dhaivatam (Flat)",
    "ratio_fraction": "128/81",
    "ratio_decimal": 1.5802469135802468,
    "cents": 792.1799965384502,
    "traditional_grāma": "Ṣaḍja Grāma",
    "classical_description": "Pythagorean Minor Sixth (792.18 cents). Soft Suddha Dhaivatam.",
    "primary_swara_mapping": "D1"
  },
  {
    "sruti_index": 16,
    "sruti_name": "Sāndīpinī",
    "swarasthana_code": "D1",
    "swarasthana_name": "Suddha Dhaivatam (Standard)",
    "ratio_fraction": "8/5",
    "ratio_decimal": 1.6,
    "cents": 813.6862861351652,
    "traditional_grāma": "Ṣaḍja Grāma",
    "classical_description": "Just Minor Sixth (813.69 cents). Standard Suddha Dhaivatam in Mayamalavagowla.",
    "primary_swara_mapping": "D1"
  },
  {
    "sruti_index": 17,
    "sruti_name": "Madantī",
    "swarasthana_code": "D2_flat",
    "swarasthana_name": "Tri-Śruti Dhaivatam / Chatushruti Dhaivatam (Flat)",
    "ratio_fraction": "5/3",
    "ratio_decimal": 1.6666666666666667,
    "cents": 884.3587129994474,
    "traditional_grāma": "Madhyama Grāma",
    "classical_description": "Just Major Sixth (884.36 cents). Chatushruti Dhaivatam in Shankarabharanam.",
    "primary_swara_mapping": "D2"
  },
  {
    "sruti_index": 18,
    "sruti_name": "Rohiṇī",
    "swarasthana_code": "D2",
    "swarasthana_name": "Chatushruti Dhaivatam / Suddha Nishadam",
    "ratio_fraction": "27/16",
    "ratio_decimal": 1.6875,
    "cents": 905.8650025961623,
    "traditional_grāma": "Ṣaḍja Grāma",
    "classical_description": "Pythagorean Major Sixth (905.87 cents). Standard Chatushruti Dhaivatam (D2 / N1).",
    "primary_swara_mapping": "D2 / N1"
  },
  {
    "sruti_index": 19,
    "sruti_name": "Ramyā",
    "swarasthana_code": "N2_flat",
    "swarasthana_name": "Kaisiki Nishadam (Flat)",
    "ratio_fraction": "16/9",
    "ratio_decimal": 1.7777777777777777,
    "cents": 996.089998269225,
    "traditional_grāma": "Gāndhāra Grāma",
    "classical_description": "Pythagorean Minor Seventh (996.09 cents). Soft Kaisiki Nishadam.",
    "primary_swara_mapping": "N2"
  },
  {
    "sruti_index": 20,
    "sruti_name": "Ugrā",
    "swarasthana_code": "N2",
    "swarasthana_name": "Kaisiki Nishadam (Standard)",
    "ratio_fraction": "9/5",
    "ratio_decimal": 1.8,
    "cents": 1017.5962878659401,
    "traditional_grāma": "Ṣaḍja Grāma",
    "classical_description": "Just Minor Seventh (1017.60 cents). Standard Kaisiki Nishadam in Kharaharapriya.",
    "primary_swara_mapping": "N2 / D3"
  },
  {
    "sruti_index": 21,
    "sruti_name": "Kṣobiṇī",
    "swarasthana_code": "N3_flat",
    "swarasthana_name": "Kakali Nishadam (Flat)",
    "ratio_fraction": "15/8",
    "ratio_decimal": 1.875,
    "cents": 1088.2687147302222,
    "traditional_grāma": "Ṣaḍja Grāma",
    "classical_description": "Just Major Seventh (1088.27 cents). Pure Kakali Nishadam in Shankarabharanam.",
    "primary_swara_mapping": "N3"
  },
  {
    "sruti_index": 22,
    "sruti_name": "Tīvrā_Higher",
    "swarasthana_code": "N3",
    "swarasthana_name": "Tīvra Kakali Nishadam / Cyuta Shadja Ni",
    "ratio_fraction": "243/128",
    "ratio_decimal": 1.8984375,
    "cents": 1109.775004326937,
    "traditional_grāma": "Madhyama Grāma",
    "classical_description": "Pythagorean Major Seventh (1109.78 cents). Sharp Kakali Ni leaning into Tara Shadja.",
    "primary_swara_mapping": "N3"
  }
]);

export const INTERVAL_COMMAS = Object.freeze({
  PRAMANA_SRUTI_SYNTONIC_COMMA: { ratio: 81 / 80, cents: 21.51, fraction: '81/80' },
  NYUNA_SRUTI_MINOR_SEMITONE: { ratio: 25 / 24, cents: 70.67, fraction: '25/24' },
  PURNA_SRUTI_PYTHAGOREAN_LIMMA: { ratio: 256 / 243, cents: 90.22, fraction: '256/243' }
});

/**
 * Calculates the exact microtonal frequency (in Hz) for a given Śruti index and base Sa frequency.
 * @param srutiIndex Integer from 1 to 22
 * @param baseSaHz Tonic Sa frequency in Hz (e.g., 220.0 for A3 or 130.81 for C3)
 * @param octave Octave offset (-2, -1, 0, 1, 2)
 */
export function getSrutiFrequency(srutiIndex: number, baseSaHz: number = 220.0, octave: number = 0): number {
  const sruti = SHRUTI_22_DATABASE.find(s => s.sruti_index === srutiIndex);
  if (!sruti) {
    throw new Error(`Invalid Śruti index: ${srutiIndex}. Must be an integer between 1 and 22.`);
  }
  const octaveMultiplier = Math.pow(2, octave);
  return baseSaHz * sruti.ratio_decimal * octaveMultiplier;
}

/**
 * Returns the closest 22-Śruti match for a given pitch frequency relative to a base Sa.
 */
export function findClosestSruti(targetHz: number, baseSaHz: number = 220.0): { sruti: SrutiDefinition; centsOffset: number } {
  const targetRatio = targetHz / baseSaHz;
  let normalizedRatio = targetRatio;
  while (normalizedRatio < 1.0) normalizedRatio *= 2.0;
  while (normalizedRatio >= 2.0) normalizedRatio /= 2.0;

  const targetCents = 1200 * Math.log2(normalizedRatio);

  let bestSruti = SHRUTI_22_DATABASE[0];
  let minDiff = Math.abs(targetCents - bestSruti.cents);

  for (const sruti of SHRUTI_22_DATABASE) {
    const diff = Math.abs(targetCents - sruti.cents);
    if (diff < minDiff) {
      minDiff = diff;
      bestSruti = sruti;
    }
  }

  return {
    sruti: bestSruti,
    centsOffset: targetCents - bestSruti.cents
  };
}
