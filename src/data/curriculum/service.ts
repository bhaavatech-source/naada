
export interface CurriculumNotation {
  solfa?: string
  swarasthana?: string
  vowel_syllables?: string
  semitones?: number[]
}

export interface CurriculumPart {
  section: string
  notation?: CurriculumNotation
}

export interface PlayerExercise {
  id: number
  label: string
  aro: string
  avro: string
  aroSwarasthana?: string
  avroSwarasthana?: string
  parts?: CurriculumPart[]
}

export interface CurriculumExercise {
  id: number
  name: string
  description?: string
  tala?: string
  notation?: Record<string, CurriculumNotation>
  parts?: CurriculumPart[]
  sections?: CurriculumPart[]
  arohana?: CurriculumNotation
  avarohana?: CurriculumNotation
  [key: string]: unknown
}


export interface MelakartaCurriculum {
  mela_number: number
  raga_name: string
  curriculum_exercise_count?: number
  exercises?: Record<string, CurriculumExercise[]>
  sarali_varisai?: CurriculumExercise[]
  janta_varisai?: CurriculumExercise[]
  dhaatu_varisai?: CurriculumExercise[]
  mel_sthayi_varisai?: CurriculumExercise[]
  kil_sthayi_varisai?: CurriculumExercise[]
  alankaras?: CurriculumExercise[]
  suladi_sapta_tala_alankaras?: CurriculumExercise[]
  [key: string]: unknown
}

interface CurriculumDatabase {
  melakartas: MelakartaCurriculum[]
}

export type CurriculumTab =
  | 'sarali'
  | 'janta'
  | 'dhaatu'
  | 'mel'
  | 'kil'
  | 'alankara'

const TAB_KEYS: Record<CurriculumTab, string[]> = {
  sarali: ['sarali_varisai'],
  janta: ['janta_varisai'],
  dhaatu: ['dhaatu_varisai'],
  mel: ['mel_sthayi_varisai'],
  kil: ['kil_sthayi_varisai', 'kīḷ_sthayi_varisai'],
  alankara: [
    'alankaras',
    'suladi_sapta_tala_alankaras',
  ],
}

let curriculumPromise: Promise<CurriculumDatabase> | null = null

export function loadCurriculum(): Promise<CurriculumDatabase> {
  if (!curriculumPromise) {
    curriculumPromise = fetch(
      `${import.meta.env.BASE_URL}data/naadopaasana-master-curriculum-v2.json`
    )
      .then(async response => {
        if (!response.ok) {
          throw new Error(
            `Curriculum loading failed: HTTP ${response.status}`
          )
        }

        const data = await response.json() as CurriculumDatabase

        if (!Array.isArray(data.melakartas)) {
          throw new Error('Curriculum has no melakartas array')
        }

        return data
      })
      .catch(error => {
        curriculumPromise = null
        throw error
      })
  }

  return curriculumPromise
}

export async function getMelakartaCurriculum(
  melaNumber: number
): Promise<MelakartaCurriculum> {
  const data = await loadCurriculum()
  const mela = data.melakartas.find(
    item => item.mela_number === melaNumber
  )

  if (!mela) {
    throw new Error(`Melakarta ${melaNumber} was not found`)
  }

  return mela
}

function getExerciseList(
  mela: MelakartaCurriculum,
  tab: CurriculumTab
): CurriculumExercise[] {
  const keys: Record<CurriculumTab, string[]> = {
    sarali: ['sarali_varisai'],
    janta: ['janta_varisai'],
    dhaatu: ['dhaatu_varisai'],
    mel: ['mel_sthayi_varisai'],
    kil: ['kil_sthayi_varisai'],
    alankara: ['alankaras', 'suladi_sapta_tala_alankaras'],
  };

  for (const key of keys[tab]) {
    const direct = mela[key];
    if (Array.isArray(direct) && direct.length > 0) {
      return direct as CurriculumExercise[];
    }

    const nested = mela.exercises?.[key];
    if (Array.isArray(nested) && nested.length > 0) {
      return nested;
    }
  }

  return [];
}


function combineNotation(
  notation: Record<string, CurriculumNotation> | undefined,
  direction: 'arohana' | 'avarohana'
): string {
  if (!notation) return '';

  // Handle the curriculum's direct notation structure first.
  const direct = notation[direction];
  if (typeof direct?.solfa === 'string' && direct.solfa.trim()) {
    return direct.solfa.trim();
  }

  // Also handle multi-part structures such as arohana_part1.
  const prefix = direction;
  const entries = Object.entries(notation)
    .filter(([key, value]) =>
      key.toLowerCase().startsWith(prefix) &&
      typeof value?.solfa === 'string' &&
      value.solfa.trim().length > 0
    )
    .sort(([a], [b]) => {
      const partNumber = (key: string) =>
        Number(key.match(/part(\d+)/i)?.[1] ?? 0);

      return partNumber(a) - partNumber(b);
    });

  return entries.map(([, value]) => value.solfa!.trim()).join(' ');
}


export function getPlayerExercises(
  mela: MelakartaCurriculum,
  tab: CurriculumTab
): PlayerExercise[] {
  return getExerciseList(mela, tab).flatMap((exercise): PlayerExercise[] => {
    const rawParts = Array.isArray(exercise.parts)
      ? exercise.parts
      : Array.isArray(exercise.sections)
        ? exercise.sections
        : []

    // The current player accepts one notation string per direction.
    // Preserve each Mel/Kil Sthayi section as its own playable card rather
    // than concatenating all sections into both aro and avro.
        // Keep each Mel/Kil exercise as one card, preserving part order.
    if ((tab === 'mel' || tab === 'kil') && rawParts.length > 0) {
      const parts = rawParts as CurriculumPart[]
      const validParts = parts.filter(
        part => typeof part.notation?.solfa === 'string' &&
          part.notation.solfa.trim().length > 0
      )

      if (validParts.length === 0) return []

      return [{
        id: exercise.id,
        label: exercise.name,
        aro: validParts
          .map(part =>
  part.notation!.solfa!
    .trim()
    .replace(/(^|\s)-(?=\s|$)/g, '')
    .replace(/([srgmpdn])_/g, '$1.')
    .replace(/ {2,}/g, ' ')
)
          .join(' '),
        avro: '',
        aroSwarasthana: validParts
          .map(part => part.notation?.swarasthana?.trim() ?? '')
          .filter(Boolean)
          .join(' '),
        avroSwarasthana: '',
        parts: validParts,
      }]
    }

    const directAro = exercise.arohana
    const directAvro = exercise.avarohana

    const aro =
      typeof directAro?.solfa === 'string'
        ? directAro.solfa.trim()
        : combineNotation(exercise.notation, 'arohana')

    const avro =
      typeof directAvro?.solfa === 'string'
        ? directAvro.solfa.trim()
        : combineNotation(exercise.notation, 'avarohana')

    return [{
      id: exercise.id,
      label: exercise.name,
      aro,
      avro,
      aroSwarasthana: directAro?.swarasthana?.trim() ?? '',
      avroSwarasthana: directAvro?.swarasthana?.trim() ?? '',
    }].filter(item => item.aro.length > 0 || item.avro.length > 0)
  })
}
