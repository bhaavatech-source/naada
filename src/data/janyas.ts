// ─────────────────────────────────────────────────────────────────────────────
// JANYA RĀGAS — Derived rāgas from Melakarta parents
// Each Janya uses a subset of its parent Melakarta's svaras in
// Ārohaṇa / Avarohaṇa (may omit, repeat, or vakra-order svaras)
//
// token format matches RagaLibrary notation:
//   s r g m p d n   = middle octave
//   S R G M P D N   = upper octave (Tāra)
//   s, r, g,        = lower octave (Kīḷ/Mandra)
//
// "vakra" = zigzag order in aro/avro (e.g. s r g r m = vakra Ga)
// ─────────────────────────────────────────────────────────────────────────────

export interface JanyaRaga {
  id: string
  name: string
  nameDevanagari?: string
  nameTelugu?: string
  parentMel: number          // Melakarta number (1–72)
  parentName: string
  aro: string                // Ārohaṇa notation
  avro: string               // Avarohaṇa notation
  omittedSvaras?: string[]   // svaras missing from aro or avro (Audava/Shadava info)
  type: 'audava-audava'|'audava-shadava'|'shadava-shadava'|'sampurna-audava'|'sampurna-shadava'|'audava-sampurna'|'shadava-sampurna'|'vakra'|'sampurna'
  rasa?: string
  description?: string
  famousKritis?: string[]
}

export const JANYA_RAGAS: JanyaRaga[] = [

  // ── Parent: 1 Kanakangi ──────────────────────────────────────────────────
  {
    id: 'nata-bhairavi',
    name: 'Nāṭa Bhairavi',
    nameTelugu: 'నాట భైరవి',
    parentMel: 20,
    parentName: 'Natabhairavi',
    aro:  's r, g, m p d, n, S',
    avro: 'S n, d, p m g, r, s',
    type: 'sampurna',
    rasa: 'Karuṇā (pathos)',
    description: 'One of the most popular bhajan rāgas. Parent mel 20.',
    famousKritis: ['Rāmā Nī Samānam', 'O Raṅgasāyi'],
  },

  // ── Parent: 15 Māyāmāḷavagauḷa ──────────────────────────────────────────
  {
    id: 'gambhiranata',
    name: 'Gambhīranāṭa',
    nameTelugu: 'గంభీరనాట',
    parentMel: 15,
    parentName: 'Māyāmāḷavagauḷa',
    aro:  's r g p d S',
    avro: 'S d p g r s',
    omittedSvaras: ['m', 'n'],
    type: 'audava-audava',
    rasa: 'Vīra (heroic)',
    description: 'Audava-audava rāga from Māyāmāḷavagauḷa — used in Purandaradāsa kritis.',
    famousKritis: ['Gajānanayutam Gaṇapatim'],
  },
  {
    id: 'malahari',
    name: 'Malahari',
    nameTelugu: 'మలహరి',
    parentMel: 15,
    parentName: 'Māyāmāḷavagauḷa',
    aro:  's r m p d S',
    avro: 'S d p m r s',
    omittedSvaras: ['g', 'n'],
    type: 'audava-audava',
    rasa: 'Śānta (peaceful)',
    description: 'Classical beginner rāga. Vāṭāpi Gaṇapatim (Dīkṣitar) is set in this.',
    famousKritis: ['Vāṭāpi Gaṇapatim', 'Manasulōni Māru'],
  },
  {
    id: 'bilahari',
    name: 'Bilahara',
    nameTelugu: 'బిలహరి',
    parentMel: 29,
    parentName: 'Dhīraśankarābharaṇam',
    aro:  's r g p d S',
    avro: 'S n d p m g r s',
    omittedSvaras: ['m (aro)', 'n (aro)'],
    type: 'audava-shadava',
    rasa: 'Bhakti, Śṛṅgāra',
    description: 'Asymmetric rāga — Audava ascent, Shadava descent.',
    famousKritis: ['Bṛhadamba', 'Śrī Viśvanātha'],
  },
  {
    id: 'hamsadhvani',
    name: 'Haṃsadhvani',
    nameTelugu: 'హంసధ్వని',
    parentMel: 29,
    parentName: 'Dhīraśankarābharaṇam',
    aro:  's r g p n S',
    avro: 'S n p g r s',
    omittedSvaras: ['m', 'd'],
    type: 'audava-audava',
    rasa: 'Śānta, Bhakti',
    description: 'Most widely known Audava-Audava rāga. Vāṭāpi Gaṇapatim. Bright, auspicious character.',
    famousKritis: ['Vāṭāpi Gaṇapatim (Dīkṣitar)'],
  },

  // ── Parent: 22 Kharaharapriya ────────────────────────────────────────────
  {
    id: 'abheri',
    name: 'Abheri',
    nameTelugu: 'అభేరి',
    parentMel: 22,
    parentName: 'Kharaharapriya',
    aro:  's g, m p n S',
    avro: 'S n d p m g, r, s',
    omittedSvaras: ['r (aro)', 'd (aro)'],
    type: 'audava-sampurna',
    rasa: 'Karuṇā, Bhakti',
    description: 'Deeply emotive rāga. Nagumomu Ganaleni (Tyāgarāja) is its most famous kriti.',
    famousKritis: ['Nagumomu Ganaleni', 'Śrī Rāma Pādama'],
  },
  {
    id: 'shri-raga',
    name: 'Śrī Rāga',
    nameTelugu: 'శ్రీ రాగం',
    parentMel: 22,
    parentName: 'Kharaharapriya',
    aro:  's r m p n S',
    avro: 'S n p m g, r, s',
    omittedSvaras: ['g (aro)', 'd (aro)', 'd (avro)'],
    type: 'audava-audava',
    rasa: 'Bhakti, Vairagya',
    description: 'Enṭaro Mahānubhāvulu (Tyāgarāja) — Pancharatna Kṛti set in Śrī Rāga.',
    famousKritis: ['Enṭaro Mahānubhāvulu', 'Brōvabhāramā'],
  },
  {
    id: 'kapi',
    name: 'Kāpi',
    nameTelugu: 'కాపి',
    parentMel: 22,
    parentName: 'Kharaharapriya',
    aro:  's r g, m p d n S',
    avro: 'S n d p m g, r, s',
    type: 'sampurna',
    rasa: 'Bhakti, Śṛṅgāra',
    description: 'Jagadodharaṇa (Purandaradāsa), widely used in bhajans.',
    famousKritis: ['Jagadodharaṇa', 'Pālayasumām'],
  },

  // ── Parent: 28 Harikāmbhoji ──────────────────────────────────────────────
  {
    id: 'kambhoji',
    name: 'Kāmbhoji',
    nameTelugu: 'కాంభోజి',
    parentMel: 28,
    parentName: 'Harikāmbhoji',
    aro:  's r g m p d S',
    avro: 'S n d p m g r s',
    omittedSvaras: ['n (aro)'],
    type: 'shadava-sampurna',
    rasa: 'Śṛṅgāra, Vīra',
    description: 'Grand rāga used in major kritis. Shadava ascent (6 notes), Sampurna descent (7).',
    famousKritis: ['Ninnuvinā', 'Ōpari Rāma'],
  },
  {
    id: 'yamunakalyani',
    name: 'Yamunā Kalyāṇi',
    nameTelugu: 'యమునా కళ్యాణి',
    parentMel: 65,
    parentName: 'Mechakalyāṇi',
    aro:  's r g m, p d n S',
    avro: 'S n d p m, g r s',
    type: 'sampurna',
    rasa: 'Śānta, Bhakti',
    description: 'Janya of Mechakalyāṇi (mel 65). Uses M2 (Tīvra Madhyama). Sweet and serene.',
    famousKritis: ['Kanakanaruchira', 'Śrī Tulasī'],
  },

  // ── Parent: 29 Dhīraśankarābharaṇam ─────────────────────────────────────
  {
    id: 'devamanohari',
    name: 'Devamanohari',
    nameTelugu: 'దేవమనోహరి',
    parentMel: 29,
    parentName: 'Dhīraśankarābharaṇam',
    aro:  's r g p d S',
    avro: 'S n d p m g r s',
    omittedSvaras: ['m (aro)', 'n (aro)'],
    type: 'audava-sampurna',
    rasa: 'Śṛṅgāra',
    description: 'Sweet rāga of Dhīraśankarābharaṇam. Audava ascent, sampurna descent.',
  },
  {
    id: 'navarasa-kannada',
    name: 'Navarasā Kannaḍa',
    nameTelugu: 'నవరస కన్నడ',
    parentMel: 29,
    parentName: 'Dhīraśankarābharaṇam',
    aro:  's r g m p n S',
    avro: 'S n d p m g r s',
    omittedSvaras: ['d (aro)'],
    type: 'shadava-sampurna',
    rasa: 'Śṛṅgāra, Bhakti',
    description: 'Janya of Śankarābharaṇam with D omitted in ascent.',
  },

  // ── Parent: 36 Chalanāṭa ─────────────────────────────────────────────────
  {
    id: 'arabhi',
    name: 'Ārābhi',
    nameTelugu: 'ఆరాభి',
    parentMel: 29,
    parentName: 'Dhīraśankarābharaṇam',
    aro:  's m p d S',
    avro: 'S n d p m g r s',
    omittedSvaras: ['r (aro)', 'g (aro)', 'n (aro)'],
    type: 'audava-sampurna',
    rasa: 'Vīra, Bhakti',
    description: 'Classical rāga used in Pancharatna Kritis. Penta-ascent only.',
    famousKritis: ['Sādhinchane Ō Manasā (Tyāgarāja)'],
  },
  {
    id: 'varali',
    name: 'Varāḷi',
    nameTelugu: 'వరాళి',
    parentMel: 39,
    parentName: 'Jhālavarāḷi',
    aro:  's r, g, m, p d, S',
    avro: 'S n, d, p m, g, r, s',
    omittedSvaras: ['n (aro)'],
    type: 'shadava-sampurna',
    rasa: 'Karuṇā (pathos)',
    description: 'Dark, intense rāga. Uses R1, G1, M2, D1, N3 — very distinctive.',
  },

  // ── Parent: 45 Śubhapantuvarāḷi ────────────────────────────────────────
  {
    id: 'revati',
    name: 'Revatī',
    nameTelugu: 'రేవతి',
    parentMel: 8,
    parentName: 'Hanumatodi',
    aro:  's r, m p n, S',
    avro: 'S n, p m r, s',
    omittedSvaras: ['g', 'd'],
    type: 'audava-audava',
    rasa: 'Śānta, devotional',
    description: 'Bho Śambho (Ādi Śaṅkara). Venkateśa Suprabhātam. Pañcama-dominant, serene.',
    famousKritis: ['Bho Śambho', 'Venkateśa Suprabhātam'],
  },

  // ── Parent: 53 Gamanashrama ──────────────────────────────────────────────
  {
    id: 'bhairavi',
    name: 'Bhairavi',
    nameTelugu: 'భైరవి',
    parentMel: 20,
    parentName: 'Natabhairavi',
    aro:  's r, g, m p d, n, S',
    avro: 'S n, d, p m g, r, s',
    type: 'sampurna',
    rasa: 'Karuṇā, Vairāgya',
    description: 'Universally used closing rāga. Morning rāga. Known for emotional depth.',
    famousKritis: ['Viribōni', 'Cintayāmi'],
  },

  // ── Parent: 65 Mechakalyāṇi ──────────────────────────────────────────────
  {
    id: 'kalyani',
    name: 'Kalyāṇi',
    nameTelugu: 'కళ్యాణి',
    parentMel: 65,
    parentName: 'Mechakalyāṇi',
    aro:  's r g m, p d n S',
    avro: 'S n d p m, g r s',
    type: 'sampurna',
    rasa: 'Śāntam, Bhakti',
    description: 'The most prominent rāga of the M2 group. Grand, auspicious. Evening rāga.',
    famousKritis: ['Nī Nāma Rūpamulaku', 'Kanakanaruchira'],
  },
  {
    id: 'hindolam',
    name: 'Hindōḷam',
    nameTelugu: 'హిందోళం',
    parentMel: 20,
    parentName: 'Natabhairavi',
    aro:  's g, m d, n, S',
    avro: 'S n, d, m g, s',
    omittedSvaras: ['r', 'p'],
    type: 'audava-audava',
    rasa: 'Śṛṅgāra, Bhakti',
    description: 'Pentatonic rāga — no Ri, no Pa. Deep, melancholic character.',
    famousKritis: ['Nādatanum Anīśam'],
  },
  {
    id: 'mohanam',
    name: 'Mohanaṃ',
    nameTelugu: 'మోహనం',
    parentMel: 28,
    parentName: 'Harikāmbhoji',
    aro:  's r g p d S',
    avro: 'S d p g r s',
    omittedSvaras: ['m', 'n'],
    type: 'audava-audava',
    rasa: 'Śṛṅgāra, Śānta',
    description: 'The most commonly known pentatonic rāga. Corresponds to major pentatonic scale.',
    famousKritis: ['Śrī Rāma Jaya Rāma', 'Kaligiyunte'],
  },
  {
    id: 'suddha-dhanyasi',
    name: 'Śuddha Dhanyāsi',
    nameTelugu: 'శుద్ధ ధన్యాసి',
    parentMel: 8,
    parentName: 'Hanumatodi',
    aro:  's g, m p n, S',
    avro: 'S n, p m g, s',
    omittedSvaras: ['r', 'd'],
    type: 'audava-audava',
    rasa: 'Karuṇā, Bhakti',
    description: 'Pentatonic. Moving, devotional character. Used in many kritis.',
    famousKritis: ['Rāghupati Rāghava'],
  },
  {
    id: 'charukesi',
    name: 'Chārukēśi',
    nameTelugu: 'చారుకేసి',
    parentMel: 26,
    parentName: 'Chārukēśi',
    aro:  's r g m p d, n, S',
    avro: 'S n, d, p m g r s',
    type: 'sampurna',
    rasa: 'Karuṇā, Bhakti',
    description: 'Mel 26 is also its own Janya in practice. Uses G3+D1+N2 — unique combination.',
  },
  {
    id: 'hamsanandi',
    name: 'Haṃsānandi',
    nameTelugu: 'హంసానంది',
    parentMel: 53,
    parentName: 'Gamanashrama',
    aro:  's r, m, p n S',
    avro: 'S n p m, r, s',
    omittedSvaras: ['g', 'd'],
    type: 'audava-audava',
    rasa: 'Śānta, spiritual',
    description: 'Melodious pentatonic. Very popular in contemporary compositions.',
  },
  {
    id: 'sahana',
    name: 'Sāhanā',
    nameTelugu: 'సాహనా',
    parentMel: 28,
    parentName: 'Harikāmbhoji',
    aro:  's r g r g m p m d n S',
    avro: 'S n d n p m g r s',
    type: 'vakra',
    rasa: 'Karuṇā, Śṛṅgāra',
    description: 'Vakra rāga — zigzag movement in ascent (G is approached via R). Very emotive.',
    famousKritis: ['Ninnu Kōri', 'Sāhana sāhana'],
  },
  {
    id: 'neelambari',
    name: 'Nīlāmbari',
    nameTelugu: 'నీలాంబరి',
    parentMel: 29,
    parentName: 'Dhīraśankarābharaṇam',
    aro:  's r g m p d n S',
    avro: 'S n d p m g r s',
    type: 'sampurna',
    rasa: 'Śānta (lullaby)',
    description: 'The quintessential lullaby rāga of Carnatic music. Majestic and soothing.',
    famousKritis: ['Kāntamu Lēda', 'Jōjō Rāmarā (lullaby)'],
  },
  {
    id: 'pushpalatika',
    name: 'Puṣpalātikā',
    nameTelugu: 'పుష్పలతిక',
    parentMel: 15,
    parentName: 'Māyāmāḷavagauḷa',
    aro:  's r g m p n S',
    avro: 'S d p m g r s',
    omittedSvaras: ['d (aro)', 'n (avro)'],
    type: 'shadava-shadava',
    rasa: 'Śānta',
    description: 'Janya of Māyāmāḷavagauḷa. Used frequently in devotional music.',
  },
]



export interface JanyaCurriculumDatabase {
  janya_ragas: Array<{
    id: string;
    raga_name: string;
    parent_mela_number: number;
    parent_mela_name: string;
    arohana_pattern?: string;
    avarohana_pattern?: string;
    varjya_swaras?: {
      arohana?: string[];
      avarohana?: string[];
    };
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export function normalizeRagaName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}
/** Load the separate Janya master curriculum JSON asset. */
export async function loadJanyaMasterCurriculum(): Promise<JanyaCurriculumDatabase> {
  const url = `${import.meta.env.BASE_URL}data/master-janya-ragas-curriculum-v2.json`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(
      `Failed to load Janya master curriculum (${response.status} ${response.statusText})`
    )
  }

  const data = (await response.json()) as JanyaCurriculumDatabase

  if (!data || !Array.isArray(data.janya_ragas)) {
    throw new Error("Invalid Janya master curriculum: janya_ragas array is missing.")
  }

  return data
}
/** Convert the master curriculum's scale notation to the library's token convention. */
function masterScaleToLibraryTokens(pattern: string | undefined, direction: 'aro' | 'avro'): string {
  if (!pattern) return ''
  const raw = pattern.trim().split(/\s+/).filter(Boolean)
  return raw.map((token, index) => {
    if (token === '|' || token === '||' || token === ',' || token === '-') return token
    if (token === 'Ṡ') return 'S'
    const family = token.replace(/[0-9]/g, '').replace(/[̣̇]/g, '')
    if (token === 'S') return 's' // middle Sa endpoint/start in the source scale notation
    // On descent, notes between upper Sa and middle Sa are in the upper octave.
    // On ascent, the interior notes are middle octave and only final Ṡ is upper.
    const isUpper = direction === 'avro' && index > 0 && index < raw.length - 1
    return isUpper ? family.toUpperCase() : family.toLowerCase()
  }).join(' ')
}

/** Merge missing master-curriculum rāgas into the reference list without duplicating names. */
export function mergeJanyaRagasWithCurriculum(
  curriculum: JanyaCurriculumDatabase,
  base: JanyaRaga[] = JANYA_RAGAS,
): JanyaRaga[] {
  const result = [...base]
  const seen = new Set(base.map(r => `${normalizeRagaName(r.name)}:${r.parentMel}`))
  for (const raga of curriculum.janya_ragas) {
    const key = `${normalizeRagaName(raga.raga_name)}:${raga.parent_mela_number}`
    if (seen.has(key)) continue
    const aro = masterScaleToLibraryTokens(raga.arohana_pattern, 'aro')
    const avro = masterScaleToLibraryTokens(raga.avarohana_pattern, 'avro')
    const count = (s: string) => s.split(/\s+/).filter(t => t && t !== '|' && t !== '||' && t !== '-').length
    const a = count(aro), d = count(avro)
    const type: JanyaRaga['type'] = a === 5 && d === 5 ? 'audava-audava'
      : a === 5 && d === 6 ? 'audava-shadava'
      : a === 6 && d === 6 ? 'shadava-shadava'
      : a === 7 && d === 5 ? 'sampurna-audava'
      : a === 7 && d === 6 ? 'sampurna-shadava'
      : a === 5 && d === 7 ? 'audava-sampurna'
      : a === 6 && d === 7 ? 'shadava-sampurna' : 'sampurna'
    result.push({
      id: raga.id,
      name: raga.raga_name,
      parentMel: raga.parent_mela_number,
      parentName: raga.parent_mela_name,
      aro,
      avro,
      omittedSvaras: [...(raga.varjya_swaras?.arohana ?? []), ...(raga.varjya_swaras?.avarohana ?? [])],
      type,
      description: 'Added from the master Janya Abhyāsa Gāṇa curriculum. Review scale notation before release.',
    })
    seen.add(key)
  }
  return result
}


