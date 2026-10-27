/**
 * Manodharma learning and Kōrvai calculation engine for Medhā Nādopāsanā.
 * The engine provides educational content and arithmetic checks; it does not
 * certify a phrase as musically or traditionally correct.
 */
import manodharmaDataRaw from './manodharma-and-korvai-master-suite.json';

export interface KorvaiPhrase {
  readonly id: string;
  readonly title: string;
  readonly tala: string;
  readonly total_matras: number;
  readonly eduppu: string;
  readonly purvanga: { readonly solkattu: string; readonly matras: number };
  readonly uttaranga_makutam: {
    readonly phrase_solkattu?: string;
    readonly gap_solkattu?: string;
    readonly phrase_matras?: number;
    readonly gap_matras?: number;
    readonly math?: string;
    readonly [key: string]: any;
  };
  readonly yati_type: string;
  readonly notation: string;
  readonly review_status?: string;
  readonly review_notes?: string;
}

export interface KorvaiConstructionResult {
  readonly purvangaMatras: number;
  readonly makutamPhraseMatras: number;
  readonly gapMatras: number;
  readonly totalKorvaiMatras: number;
  readonly cycleLengthMatras: number;
  /** True only when the calculated endpoint is at offset zero (samam). */
  readonly isAlignedToSamam: boolean;
  /** True when the calculated endpoint matches the selected target offset. */
  readonly isAlignedToTarget: boolean;
  readonly eduppuOffsetMatras: number;
  readonly targetEduppuMatra: number;
  readonly isValid: boolean;
  readonly validationErrors: readonly string[];
  readonly solkattuSummary: string;
}

export class ManodharmaKorvaiEngine {
  private data: any;
  constructor(customData?: any) { this.data = customData || manodharmaDataRaw; }

  public getFiveBranches() { return this.data.five_branches_of_manodharma || {}; }
  public getKorvaiLibrary(): readonly KorvaiPhrase[] { return this.data.korvai_library || []; }
  public getKorvaiById(id: string): KorvaiPhrase | undefined { return this.getKorvaiLibrary().find(k => k.id === id); }
  public getYatiPatterns() { return this.data.korvai_math_engine_spec?.yati_patterns || {}; }
  public getLearningGuide() { return this.data.learning_guide || null; }
  /** Source notes and page mapping for the supplied Manodharma Sangeetham scan. */
  public getBookAlignment() { return this.data.book_alignment || null; }
  /** Expanded metadata for Dr. Śrīpāda Pinākapāṇi's Manodharma Saṅgeetam source. */
  public getBookAlignmentManodharmaSangeetam() { return this.data.book_alignment_manodharma_sangeetam || {}; }
  /** Thani Āvartanam, Mohara, Kōrvai, Yati, Arudi and Konnakol learning content. */
  public getPercussionManodharma() { return this.data.percussion_and_rhythmic_manodharma || {}; }

  /**
   * Calculates duration for this specific three-repeat construction:
   * total = body + (3 × phrase) + (2 × gap).
   * Assumption: values and target eduppu are all measured in the same mātrā
   * convention, and the target offset is zero-based within the cycle.
   */
  public calculateCustomKorvai(
    purvangaMatras: number,
    makutamPhraseMatras: number,
    gapMatras: number,
    talaAksharas: number = 8,
    gatiMatras: number = 4,
    eduppuMatra: number = 0
  ): KorvaiConstructionResult {
    const values = { purvangaMatras, makutamPhraseMatras, gapMatras, talaAksharas, gatiMatras, eduppuMatra };
    const validationErrors: string[] = [];
    Object.entries(values).forEach(([name, value]) => {
      if (!Number.isFinite(value)) validationErrors.push(`${name} must be a finite number.`);
    });
    Object.entries(values).forEach(([name, value]) => { if (Number.isFinite(value) && !Number.isInteger(value)) validationErrors.push(`${name} must be a whole-number count in this calculator.`); });
    if (Number.isFinite(purvangaMatras) && purvangaMatras < 0) validationErrors.push('Pūrvāṅga duration cannot be negative.');
    if (Number.isFinite(makutamPhraseMatras) && makutamPhraseMatras <= 0) validationErrors.push('Makuṭam phrase duration must be greater than zero.');
    if (Number.isFinite(gapMatras) && gapMatras < 0) validationErrors.push('Gap duration cannot be negative.');
    if (Number.isFinite(talaAksharas) && talaAksharas <= 0) validationErrors.push('Tāla beat count must be greater than zero.');
    if (Number.isFinite(gatiMatras) && gatiMatras <= 0) validationErrors.push('Gati subdivisions must be greater than zero.');

    const totalKorvaiMatras = purvangaMatras + (3 * makutamPhraseMatras) + (2 * gapMatras);
    const cycleLengthMatras = talaAksharas * gatiMatras;
    if (Number.isFinite(cycleLengthMatras) && cycleLengthMatras > 0 && Number.isFinite(eduppuMatra) && (eduppuMatra < 0 || eduppuMatra >= cycleLengthMatras)) {
      validationErrors.push(`Target eduppu must be between 0 and ${cycleLengthMatras - 1} mātrās for this cycle.`);
    }
    const safeRemainder = Number.isFinite(cycleLengthMatras) && cycleLengthMatras > 0 && Number.isFinite(totalKorvaiMatras)
      ? ((totalKorvaiMatras % cycleLengthMatras) + cycleLengthMatras) % cycleLengthMatras
      : 0;
    const isValid = validationErrors.length === 0;
    const isAlignedToSamam = isValid && safeRemainder === 0;
    const isAlignedToTarget = isValid && safeRemainder === eduppuMatra;
    const solkattuSummary = `Pūrvāṅga (${purvangaMatras}m) + 3 × Makuṭam (${makutamPhraseMatras}m) + 2 × Gap (${gapMatras}m) = ${totalKorvaiMatras} mātrās`;

    return {
      purvangaMatras, makutamPhraseMatras, gapMatras, totalKorvaiMatras, cycleLengthMatras,
      isAlignedToSamam, isAlignedToTarget, eduppuOffsetMatras: safeRemainder,
      targetEduppuMatra: eduppuMatra, isValid, validationErrors, solkattuSummary
    };
  }
}

export const manodharmaKorvaiEngine = new ManodharmaKorvaiEngine();
