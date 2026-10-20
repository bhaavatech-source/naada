import React, { useState } from 'react'
import {
  ExternalLink,
  BookOpen,
  Music2,
  Headphones,
  Drum,
  AudioLines,
  Piano,
  ArrowRight,
  Search,
  Sparkles,
  RotateCcw,
  Compass,
  ShieldCheck,
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export type LearningResource = {
  id: string
  title: string
  category: 'Basics' | 'Rāga' | 'Rhythm' | 'Listening'
  level: 'Beginner' | 'Intermediate' | 'All levels'
  description: string
  url: string
  task: string
  practiceModule: 'raga' | 'tala' | 'shruti' | 'builder'
  practiceLabel: string
  accessNote: string
}

export const LEARNING_RESOURCES: LearningResource[] = [
  // ==========================================
  // 1. BASICS & FOUNDATIONAL PEDAGOGY
  // ==========================================
  {
    id: 'shivkumar-archive',
    title: 'Shivkumar Kalyanaraman — Carnatic Lesson & Kritis Archive',
    category: 'Basics',
    level: 'All levels',
    description:
      'The quintessential online treasury for Carnatic learners: word-by-word swara notations, lyrics, and audio for varnams and over 300 classic keerthanas.',
    url: 'https://www.shivkumar.org/music/',
    task:
      'Open a Pillari Gītam or Varṇam, follow the line-by-line swara notation while listening to the audio demonstration.',
    practiceModule: 'builder',
    practiceLabel: 'Open Music Builder',
    accessNote: 'Free non-commercial educational archive with audio & notations',
  },
  {
    id: 'karnatik-archive',
    title: 'Karnatik.com — Lyrics, Rāga-Tāla & Audio Lessons',
    category: 'Basics',
    level: 'All levels',
    description:
      'Extensive repository hosting thousands of keerthana lyrics, composer indices, English translations, and foundational abhyāsa gāna lessons.',
    url: 'https://www.karnatik.com/',
    task:
      'Look up a composition you are studying, verify its rāga scale, tāla aṅgas, and lyric meaning.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Free community lyrics and lessons database',
  },
  {
    id: 'nios-carnatic',
    title: 'NIOS — Carnatic Music Secondary & Sr. Secondary',
    category: 'Basics',
    level: 'Beginner',
    description:
      'Comprehensive textbook modules, music history, and notation theory from India’s National Institute of Open Schooling.',
    url: 'https://rcchennai.nios.ac.in/carnatic-music-243.html',
    task:
      'Study one chapter on svara classification, sthāyi, or tāla lakshaṇas and note three concepts.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Official open-schooling public curriculum',
  },
  {
    id: 'vidya-free-lessons',
    title: 'Vidya Subramanian — Free Carnatic Video Lessons',
    category: 'Basics',
    level: 'Beginner',
    description:
      'Self-study video demonstrations covering Sarali Varisais, Janta Varisais, Gītams, and vocal warm-up exercises.',
    url: 'https://www.vidyasubramanian.com/freelessons',
    task:
      'Sing along with a foundational Sarali Varisai lesson at 1st and 2nd speeds.',
    practiceModule: 'builder',
    practiceLabel: 'Open Music Builder',
    accessNote: 'Free instructional video repository',
  },
  {
    id: '7swara-lessons',
    title: '7Swara — Systematic Carnatic Lessons',
    category: 'Basics',
    level: 'Beginner',
    description:
      'Guided online curriculum featuring interactive audio playback for Sarali, Janta, Dhāṭu Varisais, and Sapta Tāla Alaṅkāras.',
    url: 'https://www.7swara.com/lessons',
    task:
      'Study a Janta Varisai exercise and observe the doubled-note Sphuritam lower-touch accents.',
    practiceModule: 'builder',
    practiceLabel: 'Open Music Builder',
    accessNote: 'Free interactive lesson modules',
  },
  {
    id: 'sangeetha-bharathi',
    title: 'Sangeetha Bharathi — Traditional Abhyāsa Gāna Syllabus',
    category: 'Basics',
    level: 'Beginner',
    description:
      'Classical learning path according to Purandara Dāsa tradition: Sarali, Janta, Alaṅkāras, Pillari Gītams, and Svarajatis.',
    url: 'http://www.sangeethabharathi.org/',
    task:
      'Practice a Sapta Tāla Alaṅkāra in Dhruva or Tripuṭa tāla, counting the kriyās with your hand.',
    practiceModule: 'tala',
    practiceLabel: 'Open Tāla Trainer',
    accessNote: 'Free classical music pedagogy archive',
  },
  {
    id: 'carnaticstudent-basics',
    title: 'CarnaticStudent — Music Theory & Vocal Culture',
    category: 'Basics',
    level: 'All levels',
    description:
      'In-depth articles explaining the science of the human voice, diaphragmatic breathing, 22 śrutis, and gamaka classification.',
    url: 'https://www.carnaticstudent.org/',
    task:
      'Read an essay on Ādhāra Shaḍjam alignment and practice voice matching in the Śruti Trainer.',
    practiceModule: 'shruti',
    practiceLabel: 'Open Śruti Trainer',
    accessNote: 'Free educational research portal',
  },
  {
    id: 'cmana-archives',
    title: 'CMANA — Carnatic Music Association of North America',
    category: 'Basics',
    level: 'All levels',
    description:
      'Educational articles, youth syllabus guidelines, Sangeetham journal archives, and audio archives of historic visiting masters.',
    url: 'https://cmana.org/',
    task:
      'Read an archival article on the evolution of concert kutcheri etiquette and accompaniment roles.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Non-profit cultural association archive',
  },
  {
    id: 'sahapedia-carnatic-heritage',
    title: 'Sahapedia — Open Encyclopedia of Indian Music Heritage',
    category: 'Basics',
    level: 'All levels',
    description:
      'Scholarly open-access multimedia encyclopedia documenting the history of the Musical Trinity, instrument crafts, and oral traditions.',
    url: 'https://www.sahapedia.org/',
    task:
      'Explore the history of how the 72 Melakarta scheme was formulated by Venkatamakhi and Govindacharya.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Free non-commercial cultural encyclopedia',
  },
  {
    id: 'archive-carnatic-basics',
    title: 'Internet Archive — Carnatic Music Beginner Lessons',
    category: 'Basics',
    level: 'Beginner',
    description:
      'Digitized field audio recordings of senior gurus teaching beginner lessons: Sarali varisais, Tāra sthāyi varisais, and Gītams.',
    url: 'https://archive.org/search?query=Carnatic%20Music%20Lessons%20For%20Beginners',
    task:
      'Listen to a guru-shishya teaching session of Śrī Gaṇanātha in Malahari rāga.',
    practiceModule: 'builder',
    practiceLabel: 'Open Music Builder',
    accessNote: 'Public domain educational audio',
  },

  // ==========================================
  // 2. RĀGA APPRECIATION, COMPOSERS & KRITI ARCHIVES
  // ==========================================
  {
    id: 'ragasurabhi',
    title: 'Raga Surabhi — Rāga Identification & Audio Quizzes',
    category: 'Rāga',
    level: 'All levels',
    description:
      'Premier interactive portal for rāga appreciation: signature phrase demonstrations, comparative rāga analyses, and listening quizzes.',
    url: 'https://www.ragasurabhi.com/',
    task:
      'Compare Mōhanam and Bilahari in Raga Surabhi to isolate the Kākali Niṣāda and Chatuśruti Dhaivata nuances.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Free interactive ear-training & rāga exploration',
  },
  {
    id: 'carnatic-corner',
    title: 'Carnatic Corner — 72 Melakartas & Janya Ragas',
    category: 'Rāga',
    level: 'All levels',
    description:
      'Maintained by Mohan Ayyar, an authoritative directory of all 72 Melakartas, hundreds of Janyas, ārohaṇa-avarohaṇa scales, and composers.',
    url: 'https://www.carnaticcorner.com/',
    task:
      'Locate which Chakra your favourite rāga belongs to and test its varjya-vakra swara rules.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Authoritative classical reference portal',
  },
  {
    id: 'guruguha-dikshitar',
    title: 'Guruguha.org — Muthuswami Dikshitar Kritis Archive',
    category: 'Rāga',
    level: 'Intermediate',
    description:
      'Complete digital compendium of Muthuswami Dikshitar’s compositions: texts in Sanskrit/Telugu/Tamil, SSP notations, and rare Vivādi kritis.',
    url: 'https://www.guruguha.org/',
    task:
      'Study a Kamalāmbā Navāvaraṇa kriti and note how the rāga mudrā is elegantly woven into the sāhitya.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Definitive free Dikshitar scholarly resource',
  },
  {
    id: 'thyagaraja-org',
    title: 'Thyagaraja.org — Saint Tyagaraja Kritis Heritage',
    category: 'Rāga',
    level: 'All levels',
    description:
      'Dedicated repository of Saint Tyagaraja’s sacred kritis with poetic Telugu lyrics, word-by-word English meanings, and rāga mappings.',
    url: 'http://www.thyagaraja.org/',
    task:
      'Read the poetic sāhitya and svara patterns of one of the Ghana Raga Pancharatna kritis.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Free devotional & musicological repository',
  },
  {
    id: 'swathithirunal-archive',
    title: 'Swathi Thirunal Heritage Trust — Complete Compositions',
    category: 'Rāga',
    level: 'All levels',
    description:
      'Complete collection of Maharaja Swathi Thirunal’s works: Navarātri kritis, classical kritis, padams, and tillānas with notation and audio.',
    url: 'https://www.swathithirunal.in/',
    task:
      'Listen to a Navarātri kriti in Śaṅkarābharaṇam or Kalyāṇi and observe its serene vilambita laya.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Official cultural trust archive',
  },
  {
    id: 'annamacharya-ttd',
    title: 'TTD Annamacharya Sankeertana Digital Audio Archive',
    category: 'Rāga',
    level: 'All levels',
    description:
      'Official Tirumala Tirupati Devasthanams repository of Saint Annamacharya’s divine copper-plate sankeertanas sung by eminent vidwans.',
    url: 'https://archive.org/search?query=Annamacharya%20Kritis%20TTD',
    task:
      'Listen to Brahmam Okaṭē in Bouḷi rāga and follow the egalitarian philosophical theme of the sāhitya.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Free public devotional archive',
  },
  {
    id: 'purandara-sahitya',
    title: 'Purandara Dasa Devaranama Digital Archive',
    category: 'Rāga',
    level: 'All levels',
    description:
      'Archive dedicated to the father of Carnatic music, featuring hundreds of Kannada devaranāmas and sulādis with audio links.',
    url: 'https://archive.org/search?query=Purandara%20Dasa%20Kritis',
    task:
      'Listen to Bhāgyada Lakṣmī Bārammā in Madhyamāvati and study the auspicious madhyama-centric gamakas.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Free open cultural audio preservation',
  },
  {
    id: 'papanasam-sivan-archive',
    title: 'Papanasam Sivan Songs & Kritis Repository',
    category: 'Rāga',
    level: 'All levels',
    description:
      'Compositions of Tamil Tyāgayya Papanasam Sivan: beloved Tamil kritis like Enna Thavam, Kapāli, and Radhamukha with lyric texts.',
    url: 'https://archive.org/search?query=Papanasam%20Sivan%20Kritis',
    task:
      'Listen to Enna Thavam in Rāga Kāpi and notice the expressive downward weeping glides from Panchama.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Free public cultural audio archive',
  },
  {
    id: 'koteeswara-iyer-72',
    title: 'Koteeswara Iyer 72 Melakarta Kritis Repository',
    category: 'Rāga',
    level: 'Intermediate',
    description:
      'Monumental heritage archive of kritis composed across all 72 Melakarta rāgas with Tamil sāhitya, preserving rare Vivādi rāga structures.',
    url: 'https://archive.org/search?query=Koteeswara%20Iyer72Melakartas',
    task:
      'Listen to a composition in a Vivādi rāga (e.g. Kanakāṅgi or Gāṅgēyabhūṣaṇi) and observe the microtonal intervals.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Historic musicological treasure',
  },
  {
    id: 'mysore-vasudevachar',
    title: 'Mysore Vasudevachar Kritis Archive',
    category: 'Rāga',
    level: 'All levels',
    description:
      'Recordings and lyrics of Asthana Vidwan Mysore Vasudevachar, including iconic classics like Brochevarevarura and Devadideva.',
    url: 'https://archive.org/search?query=Mysore%20Vasudevachar%20Compositions',
    task:
      'Listen to Brochevarevarura in Khamās and tap the Chaturasra Ādi Tālam through its sparkling caraṇam.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Free classical audio archive',
  },
  {
    id: 'syama-sastri-kritis',
    title: 'Syama Sastri Heritage Archive — Anandabhairavi Kritis',
    category: 'Rāga',
    level: 'Intermediate',
    description:
      'Dedicated archive of the oldest of the Musical Trinity, Syama Sastri, famous for Ānandabhairavi gems and intricate Miśra Chāpu tālas.',
    url: 'https://archive.org/search?query=Syama%20Sastri%20Kritis',
    task:
      'Listen to Mariverē Gati in Ānandabhairavi and track the signature S G₂ R₂ G₂ M₁ non-linear phrase.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Free classical listening archive',
  },
  {
    id: 'muthaiah-bhagavathar-archive',
    title: 'Harikesanallur Muthaiah Bhagavathar Compositions',
    category: 'Rāga',
    level: 'Intermediate',
    description:
      'Archive of the maestro who invented over 20 new rāgas (Nirōṣṭha, Mōhanakalyāṇi, Hamsanandi) and Chāmuṇḍāmbā Aṣṭōttara kritis.',
    url: 'https://archive.org/search?query=Muthaiah%20Bhagavathar%20Recordings',
    task:
      'Explore the scale of Nirōṣṭha (S R₂ G₃ D₂ N₃ Ṡ) and verify why it contains no Ma or Pa.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Scholarly music preservation',
  },
  {
    id: 'oothukkadu-heritage',
    title: 'Oothukkadu Venkata Kavi Heritage Trust',
    category: 'Rāga',
    level: 'Intermediate',
    description:
      'Compositions of pre-trinity genius Oothukkadu Venkata Kavi: Saptaratnas, Navāvaraṇams, and rhythmically dazzling madhyamakāla kritis.',
    url: 'https://archive.org/search?query=Oothukkadu%20Venkata%20Kavi%20Songs',
    task:
      'Listen to Tāyē Yaśōdā or Alaippāyudē in Kānaḍā and observe the syncopated lyrical flow.',
    practiceModule: 'tala',
    practiceLabel: 'Open Tāla Trainer',
    accessNote: 'Free archival listening resource',
  },
  {
    id: 'gopalakrishna-bharathi',
    title: 'Gopalakrishna Bharati — Nandanar Charithiram Archive',
    category: 'Rāga',
    level: 'All levels',
    description:
      'Musical opera and devotional padams by Gopalakrishna Bharati, including evergreen classics like Sabhāpatikku and Enneramum.',
    url: 'https://archive.org/search?query=Gopalakrishna%20Bharati%20Songs',
    task:
      'Listen to Sabhāpatikku in Ābhōgi and note how the pentatonic scale evokes deep devotion.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Public cultural audio repository',
  },
  {
    id: 'patnam-subramania-iyer',
    title: 'Patnam Subramania Iyer Kritis & Varnams Vault',
    category: 'Rāga',
    level: 'Intermediate',
    description:
      'Masterworks of Patnam Subramania Iyer, celebrated for grand varnams (Evari Bōdha) and lively kritis in Begada, Kharaharapriya, and Bilahari.',
    url: 'https://archive.org/search?query=Patnam%20Subramania%20Iyer%20Kritis',
    task:
      'Study the opening pallavi of a Begada kriti and track the high-pitched sharp Begada Madhyama inflection.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Historic musicological audio',
  },

  // ==========================================
  // 3. RHYTHM, TĀLA & PERCUSSION ARCHIVES
  // ==========================================
  {
    id: 'imusic-rhythm-tala',
    title: 'iMusic — 35 Tālas & Laya Calculations',
    category: 'Rhythm',
    level: 'All levels',
    description:
      'Clear educational guides on the 35 Tāla scheme (Sapta Tālas × 5 Jātis), Gati bhedam, and calculating akṣaras per āvartana.',
    url: 'https://iamsiva.com/music/',
    task:
      'Calculate the total akṣaras for Miśra Jāti Jhampa Tālam and verify with your hand kriyās.',
    practiceModule: 'tala',
    practiceLabel: 'Open Tāla Trainer',
    accessNote: 'Free rhythm theory resource',
  },
  {
    id: 'palghat-mani-iyer-archive',
    title: 'Palghat Mani Iyer — Mridangam Artistry & Laya Solo',
    category: 'Rhythm',
    level: 'Intermediate',
    description:
      'Tani Āvartanams and concert accompaniments by the legendary titan of the mridangam, demonstrating exquisite nādam and spontaneous laya.',
    url: 'https://archive.org/search?query=Palghat%20Mani%20Iyer%20Solo',
    task:
      'Listen to an Ādi Tāla Tani Āvartanam and follow the progression from Sarvalaghu to the final Kōrvai.',
    practiceModule: 'tala',
    practiceLabel: 'Open Tāla Trainer',
    accessNote: 'Historic percussion audio preservation',
  },
  {
    id: 'palani-subramania-pillai',
    title: 'Palani Subramania Pillai — Pudukkottai Laya Tradition',
    category: 'Rhythm',
    level: 'Intermediate',
    description:
      'Historic recordings of Palani Subramania Pillai playing the mridangam and kanjira, famous for left-hand gumki mastery and intricate sollus.',
    url: 'https://archive.org/search?query=Palani%20Subramania%20Pillai%20Audio',
    task:
      'Listen to a Rūpaka Tāla solo and observe the intricate phrasing between the two drum heads.',
    practiceModule: 'tala',
    practiceLabel: 'Open Tāla Trainer',
    accessNote: 'Historic percussion archive',
  },
  {
    id: 'layavinyasam-percussion',
    title: 'Laya Vinyāsam — Carnatic Tala & Percussion Archive',
    category: 'Rhythm',
    level: 'Intermediate',
    description:
      'Ensemble recordings featuring mridangam, ghaṭam, kañjīrā, and morsing in vibrant laya vinyāsams and konnakol recitations.',
    url: 'https://archive.org/search?query=Carnatic%20Percussion%20Solo',
    task:
      'Track the change in Nadai (Tisra vs Chaturasra) during a Ghaṭam and Mridangam conversational exchange.',
    practiceModule: 'tala',
    practiceLabel: 'Open Tāla Trainer',
    accessNote: 'Free public percussion audio',
  },
  {
    id: 'mridangam-korvai-bank',
    title: 'Carnatic Laya & Korvai Practice Bank',
    category: 'Rhythm',
    level: 'Intermediate',
    description:
      'Study library of traditional kōrvais, teermānams, and yati patterns (Gōpuccha, Srotōvaha) for percussion and svara kalpana practice.',
    url: 'https://archive.org/search?query=Carnatic%20Tala%20Korvais',
    task:
      'Clap a 3-part Kōrvai ending in a Makuṭa phrase (tha dhi gi na thom) along with the Tāla Trainer.',
    practiceModule: 'tala',
    practiceLabel: 'Open Tāla Trainer',
    accessNote: 'Free rhythmic study material',
  },
  {
    id: 'konnakol-rhythm-academy',
    title: 'Konnakol Art & Recitation Audio Guides',
    category: 'Rhythm',
    level: 'All levels',
    description:
      'Vocalized percussion syllables (solkaṭṭu/konnakol) taught systematically from single-speed sollus to complex trikāla patterns.',
    url: 'https://archive.org/search?query=Konnakol%20Percussion%20Lessons',
    task:
      'Recite the solkaṭṭu phrase "Tha-Ka-Dhi-Mi Tha-Ka-Jo-Nu" across 1st, 2nd, and 3rd speeds.',
    practiceModule: 'tala',
    practiceLabel: 'Open Tāla Trainer',
    accessNote: 'Free rhythmic training audio',
  },
  {
    id: 'madurai-mani-swaras',
    title: 'Madurai Mani Iyer — Joyful Sarvalaghu Swara Prasthara',
    category: 'Rhythm',
    level: 'All levels',
    description:
      'Legendary live recordings of Madurai Mani Iyer displaying effortless, buoyant sarvalaghu swaras that glide through rhythmic cycles.',
    url: 'https://archive.org/search?query=Madurai%20Mani%20Iyer%20Concerts',
    task:
      'Clap your hands to Ādi Tālam while listening to his swara kalpana and feel the natural syncopation.',
    practiceModule: 'tala',
    practiceLabel: 'Open Tāla Trainer',
    accessNote: 'Historic concert audio preservation',
  },
  {
    id: 'uk-sivaraman-laya',
    title: 'Umayalpuram K. Sivaraman — Mridangam Laya Matrix',
    category: 'Rhythm',
    level: 'Intermediate',
    description:
      'Concert recordings of Padma Vibhushan Umayalpuram K. Sivaraman, showing brilliant rhythmic calculations, sarvalaghu, and mathematical teermanams.',
    url: 'https://archive.org/search?query=UKSivaraman%20Mridangam',
    task:
      'Listen to a tani avartanam in Misra Chapu tala and tap the 3+4 beat division.',
    practiceModule: 'tala',
    practiceLabel: 'Open Tāla Trainer',
    accessNote: 'Percussion mastery archive',
  },

  // ==========================================
  // 4. LISTENING ARCHIVES & CONCERT VAULTS
  // ==========================================
  {
    id: 'sangeethapriya-master',
    title: 'Sangeethapriya — Open Concert Archive (20,000+ Hours)',
    category: 'Listening',
    level: 'All levels',
    description:
      'The world’s largest non-commercial Carnatic concert audio repository: thousands of uncut live kutcheris by all golden-age and modern masters.',
    url: 'https://www.sangeethapriya.org/',
    task:
      'Search for a rāga like Tōḍi or Śaṅkarābharaṇam, listen to a full concert ālāpana and identify resting notes.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Free open community concert repository',
  },
  {
    id: 'music-academy-madras',
    title: 'The Music Academy Madras — Archives & Lec-Dems',
    category: 'Listening',
    level: 'Intermediate',
    description:
      'The apex institution of Carnatic music: historical conference proceedings, lec-dems by senior vidwans, and journal papers.',
    url: 'https://musicacademymadras.in/',
    task:
      'Review a lecture demonstration on microtonal gamakas or rāga lakshaṇas presented by an academy scholar.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Official premier classical institution',
  },
  {
    id: 'prasar-bharati-air',
    title: 'Prasar Bharati Archives — National Programme of Music',
    category: 'Listening',
    level: 'All levels',
    description:
      'Historic radio broadcast recordings from All India Radio spanning 70 years of legendary concert performances.',
    url: 'https://prasarbharati.gov.in/archives/',
    task:
      'Listen to a historic 30-minute radio concert and identify the main composition and its tāla cycle.',
    practiceModule: 'tala',
    practiceLabel: 'Open Tāla Trainer',
    accessNote: 'National public broadcaster cultural heritage',
  },
  {
    id: 'ms-subbulakshmi-heritage',
    title: 'M.S. Subbulakshmi — Historic Concert Archive',
    category: 'Listening',
    level: 'All levels',
    description:
      'Curated concerts of Bharat Ratna M.S. Subbulakshmi: UN General Assembly concert, Carnegie Hall, and pristine devotional recordings.',
    url: 'https://archive.org/search?query=MSSubbulakshmi%20Concerts',
    task:
      'Listen to Bhāvayāmi Gopālabālam in Yamunā Kalyāṇi and observe the perfect śruti alignment and spiritual emotion.',
    practiceModule: 'shruti',
    practiceLabel: 'Open Śruti Trainer',
    accessNote: 'Free public digital library',
  },
  {
    id: 'lalgudi-jayaraman-audio',
    title: 'Lalgudi Jayaraman — Peerless Violin Bāṇi Archive',
    category: 'Listening',
    level: 'Intermediate',
    description:
      'Masterful violin concerts, rāgam-tānam-pallavis, and intricate varṇams showcasing the lyrical vocalized violin style of the Lalgudi bāṇi.',
    url: 'https://archive.org/search?query=Lalgudi%20Jayaraman%20Violin',
    task:
      'Listen to a Lalgudi Tillāna in Dēś or Māṇḍ and trace the complex rhythmic teermānam patterns.',
    practiceModule: 'tala',
    practiceLabel: 'Open Tāla Trainer',
    accessNote: 'Free listening archive',
  },
  {
    id: 'dk-pattammal-heritage',
    title: 'D.K. Pattammal — Pristine Pāṭhāntaram & Laya Authority',
    category: 'Listening',
    level: 'All levels',
    description:
      'Dedicated collection of Gana Saraswathi D.K. Pattammal, renowned for absolute laya mastery and pristine Dikshitar kritis.',
    url: 'https://archive.org/search?query=DKPattammal%20Collection',
    task:
      'Listen to a grand Dikshitar kriti in Māyāmāḷavagauḷa or Kalyāṇi and observe the steady chaturasra gait.',
    practiceModule: 'tala',
    practiceLabel: 'Open Tāla Trainer',
    accessNote: 'Historical cultural preservation',
  },
  {
    id: 'ariyakudi-kutcheri-archive',
    title: 'Ariyakudi Ramanuja Iyengar — Kutcheri Format Archive',
    category: 'Listening',
    level: 'Intermediate',
    description:
      'Historic recordings of Sangita Kalanidhi Ariyakudi Ramanuja Iyengar, the visionary architect of the modern Carnatic concert structure.',
    url: 'https://archive.org/search?query=Ariyakudi%20Ramanuja%20Iyengar%20Concerts',
    task:
      'Observe the traditional concert pacing: Varṇam, prayer kriti, heavy sub-main, and lively madhyamakāla finale.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Historical field recordings archive',
  },
  {
    id: 'gnb-brighas-archive',
    title: 'G.N. Balasubramaniam (GNB) — Brigha Artistry & Raga Aesthetics',
    category: 'Listening',
    level: 'Intermediate',
    description:
      'Recordings of the legendary GNB, famed for rapid lightning brighas, intellectual rāga architecture, and graha bhedam.',
    url: 'https://archive.org/search?query=GNBConcert%20Recordings',
    task:
      'Listen to an ālāpana in Hindōḷam or Kalyāṇi and see how swift musical thoughts are woven without pitch wavering.',
    practiceModule: 'shruti',
    practiceLabel: 'Open Śruti Trainer',
    accessNote: 'Free archival audio repository',
  },
  {
    id: 'semmangudi-patriarch',
    title: 'Semmangudi Srinivasa Iyer — The Patriarch of Carnatic Music',
    category: 'Listening',
    level: 'All levels',
    description:
      'Spanning 80 years of concert musicianship: deep fidelity to tradition, authoritative Swathi Thirunal kritis, and powerful energy.',
    url: 'https://archive.org/search?query=Semmangudi%20Srinivasa%20Iyer%20Audio',
    task:
      'Listen to Marubalka in Śrīrañjani and observe how the gamaka on Gāndhāra brings out the pathos of the rāga.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Free open cultural audio',
  },
  {
    id: 'balamuralikrishna-legacy',
    title: 'Dr. M. Balamuralikrishna — Prodigy & Creative Masterworks',
    category: 'Listening',
    level: 'All levels',
    description:
      'Concerts and rare recordings of Dr. Balamuralikrishna: incredible vocal range spanning 3 octaves, crystal diction, and invented rāgas.',
    url: 'https://archive.org/search?query=Balamuralikrishna%20Collection',
    task:
      'Listen to a composition in a rare rāga like Lavangi or Mahati and note how 4 notes create a complete rāga mood.',
    practiceModule: 'builder',
    practiceLabel: 'Open Music Builder',
    accessNote: 'Free archival listening',
  },
  {
    id: 'flute-mali-heritage',
    title: 'T.R. Mahalingam (Flute Mali) — Bamboo Flute Genius',
    category: 'Listening',
    level: 'Intermediate',
    description:
      'Concert recordings of Flute Mali, who revolutionized Carnatic bamboo flute playing through vocal-style finger shading and breath control.',
    url: 'https://archive.org/search?query=Flute%20Mali%20Concerts',
    task:
      'Listen to how the bamboo flute reproduces microtonal kampitam and jāru ornaments seamlessly.',
    practiceModule: 'shruti',
    practiceLabel: 'Open Śruti Trainer',
    accessNote: 'Rare concert recordings',
  },
  {
    id: 'veena-dhanammal-school',
    title: 'Veena Dhanammal & T. Brinda — Vilambita Gamaka Purity',
    category: 'Listening',
    level: 'Intermediate',
    description:
      'Sublime recordings from the legendary Dhanammal school: unsurpassed gamaka depth, vilambita tempo, and traditional padams and javalis.',
    url: 'https://archive.org/search?query=TBrinda%20Padams',
    task:
      'Listen to a slow padam in Sahānā or Ānandabhairavi and trace the subtle oscillations on Gāndhāra and Niṣāda.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Rare historical recordings',
  },
  {
    id: 'rajarathinam-pillai-nadaswaram',
    title: 'T.N. Rajarathinam Pillai — Nadaswara Chakravarthy Archive',
    category: 'Listening',
    level: 'All levels',
    description:
      'Recordings of the legendary nadaswaram maestro, famous for expansive temple ālāpanas in Tōḍi, Kharaharapriyā, and Shanmukhapriya.',
    url: 'https://archive.org/search?query=TNRajarathinam%20Pillai%20Nadaswaram',
    task:
      'Listen to an expansive Tōḍi ālāpana and feel how open-air acoustics and the nadaswaram shape gamaka resonance.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Historic cultural audio',
  },
  {
    id: 'thiruvaiyaru-aradhana-live',
    title: 'Thiruvaiyaru Thyagaraja Aradhana Heritage Channel',
    category: 'Listening',
    level: 'All levels',
    description:
      'Annual live and archival broadcasts from the sacred Samādhi of Saint Tyagaraja at Thiruvaiyaru, including mass Pancharatna singing.',
    url: 'https://archive.org/search?query=Thiruvaiyaru%20Thyagaraja%20Aradhana',
    task:
      'Listen to the Pancharatna Goshthi Gānam and note the unison singing of vocalists and instrumentalists.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Public cultural festival archive',
  },
  {
    id: 'cleveland-festival-broadcasts',
    title: 'Cleveland Thyagaraja Festival Broadcasts',
    category: 'Listening',
    level: 'All levels',
    description:
      'Concerts and youth competition archives from the largest Carnatic festival outside India, celebrating the living tradition.',
    url: 'https://www.aradhana.org/',
    task:
      'Watch a mass rendition of Jagadānandakāraka in Nāṭṭai and tap the Ādi Tālam cycle.',
    practiceModule: 'tala',
    practiceLabel: 'Open Tāla Trainer',
    accessNote: 'Official festival web archive',
  },
  {
    id: 'charsur-arts-channel',
    title: 'Charsur Arts Foundation — Thematic Concerts & Lec-Dems',
    category: 'Listening',
    level: 'All levels',
    description:
      'Curated concerts from the Chennai December music season, thematic kutcheris, composer retrospectives, and morning lec-dems.',
    url: 'https://www.youtube.com/@CharsurArtsFoundation',
    task:
      'Select a concert focusing on a single composer or rāga family and note the stylistic variations.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'High-definition classical music streaming',
  },
  {
    id: 'sanjay-subrahmanyan-channel',
    title: 'Sanjay Subrahmanyan — On That Note & Kutcheri Vault',
    category: 'Listening',
    level: 'All levels',
    description:
      'Official archive of Sangita Kalanidhi Sanjay Subrahmanyan featuring detailed rāga essays, rare Vivādi kritis, and concert performances.',
    url: 'https://www.youtube.com/@SanjaySubrahmanyan',
    task:
      'Listen to an episode of "On That Note" explaining a rare rāga and test the phrase in the Music Builder.',
    practiceModule: 'builder',
    practiceLabel: 'Open Music Builder',
    accessNote: 'Official artist archive channel',
  },
  {
    id: 'tm-krishna-channel',
    title: 'T.M. Krishna — Music Aesthetics & History Lecture Series',
    category: 'Listening',
    level: 'Intermediate',
    description:
      'Scholarly lectures and concert experiments exploring the evolution of Carnatic aesthetics, gamaka nuances, and historical treatises.',
    url: 'https://www.tmkrishna.com/',
    task:
      'Listen to a lecture on the distinction between scale notation and authentic gamaka realization.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Free scholarly articles and video essays',
  },
  {
    id: 'sna-delhi-archive',
    title: 'Sangeet Natak Akademi — Digital Performing Arts Archive',
    category: 'Listening',
    level: 'Intermediate',
    description:
      'National apex academy digital archives preserving rare vintage audio-visual recordings of 20th-century classical vidwans.',
    url: 'https://sangeetnatak.gov.in/',
    task:
      'Explore a vintage recording or musicological seminar paper on 22 śrutis and rāga classification.',
    practiceModule: 'shruti',
    practiceLabel: 'Open Śruti Trainer',
    accessNote: 'Official national cultural repository',
  },
  {
    id: 'nedunuri-heritage',
    title: 'Nedunuri Krishnamurthy — Annamacharya Kritis & Classical Grace',
    category: 'Listening',
    level: 'All levels',
    description:
      'Concert recordings of Sangita Kalanidhi Nedunuri Krishnamurthy, who tuned hundreds of Annamacharya sankeertanas in pure classical rāgas.',
    url: 'https://archive.org/search?query=Nedunuri%20Krishnamurthy%20Concerts',
    task:
      'Listen to Nānāṭi Baduku in Rēvati and observe the meditative gravity and steady laya.',
    practiceModule: 'shruti',
    practiceLabel: 'Open Śruti Trainer',
    accessNote: 'Free open concert archive',
  },
  {
    id: 'chowdiah-7string',
    title: 'Mysore T. Chowdiah — 7-String Acoustic Violin Heritage',
    category: 'Listening',
    level: 'Intermediate',
    description:
      'Historic recordings of violin maestro Mysore T. Chowdiah playing his custom 7-string violin for concert-hall acoustic volume.',
    url: 'https://archive.org/search?query=Mysore%20TChowdiah%20Violin',
    task:
      'Listen to the deep resonant lower strings and notice how they enrich the Ādhāra Shaḍjam drone.',
    practiceModule: 'shruti',
    practiceLabel: 'Open Śruti Trainer',
    accessNote: 'Rare historical audio',
  },
  {
    id: 'kvn-vilambita',
    title: 'K.V. Narayanaswamy (KVN) — Vilambita Laya Masterpieces',
    category: 'Listening',
    level: 'All levels',
    description:
      'Recordings of Sangita Kalanidhi K.V. Narayanaswamy, celebrated for unhurried vilambita kāla, absolute peace, and soulful padams.',
    url: 'https://archive.org/search?query=KVNarayanaswamy%20Concerts',
    task:
      'Listen to an unhurried Tyagaraja kriti and feel the soothing meditative impact of steady laya.',
    practiceModule: 'shruti',
    practiceLabel: 'Open Śruti Trainer',
    accessNote: 'Free open cultural audio',
  },
  {
    id: 'dk-jayaraman-audio',
    title: 'D.K. Jayaraman (DKJ) — Sahitya Diction & Sangati Elegance',
    category: 'Listening',
    level: 'All levels',
    description:
      'Concert recordings of Sangita Kalanidhi D.K. Jayaraman, celebrated for crisp lyrical enunciation and soulful Dikshitar pāṭhāntaram.',
    url: 'https://archive.org/search?query=DKJayaraman%20Concerts',
    task:
      'Follow the lyric enunciation of a kriti and notice how consonants and vowels never distort the pitch.',
    practiceModule: 'shruti',
    practiceLabel: 'Open Śruti Trainer',
    accessNote: 'Free open concert archive',
  },
  {
    id: 'rasikas-forum-knowledgebase',
    title: 'Rasikas.org — Carnatic Knowledgebase & Concert Discussions',
    category: 'Listening',
    level: 'All levels',
    description:
      'The premier global discussion forum for Carnatic music scholars, students, and rasikas: concert analyses, rāga nuances, and rare songs.',
    url: 'https://www.rasikas.org/',
    task:
      'Read a discussion thread on the prayōgas of a Vivādi rāga or an obscure janya rāga.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Free community knowledgebase',
  },
]

const CATEGORIES = [
  'All',
  'Basics',
  'Rāga',
  'Rhythm',
  'Listening',
] as const

const MODULE_ICONS = {
  raga: Music2,
  tala: Drum,
  shruti: AudioLines,
  builder: Piano,
}

export function Resources() {
  const setModule = useAppStore((state) => state.setModule)
  const [category, setCategory] =
    useState<(typeof CATEGORIES)[number]>('All')
  const [search, setSearch] = useState('')

  const filteredResources = LEARNING_RESOURCES.filter((resource) => {
    const matchesCategory =
      category === 'All' || resource.category === category

    const query = search.trim().toLowerCase()
    const matchesSearch =
      !query ||
      resource.title.toLowerCase().includes(query) ||
      resource.description.toLowerCase().includes(query) ||
      resource.task.toLowerCase().includes(query)

    return matchesCategory && matchesSearch
  })

  function openResource(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: 24,
        color: 'var(--text)',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 46,
              height: 46,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
            }}
          >
            <BookOpen size={24} />
          </div>

          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
              Learning Resources & Archives
            </h1>
            <p
              style={{
                margin: '5px 0 0',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
              }}
            >
              Explore curated Carnatic music archives, lesson portals, and concert recordings. Access and availability depend on each external website.
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div
          style={{
            marginTop: 22,
            padding: 16,
            border: '1px solid var(--border)',
            borderRadius: 12,
            background: 'var(--surface)',
          }}
        >
          <strong style={{ color: 'var(--accent)' }}>Learn → Listen → Practise</strong>
          <p
            style={{
              margin: '6px 0 0',
              color: 'var(--text-muted)',
              fontSize: '0.88rem',
              lineHeight: 1.6,
            }}
          >
            Open a lesson, concert, or notation archive on its original website. Study or listen to the suggested activity, then use the relevant Nāda Vidyā module to reinforce your learning with our real-time interactive tools. External content is not stored in this app.
          </p>
        </div>

        {/* Search & Filter Toolbar */}
        <div
          style={{
            marginTop: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Search Input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '10px 14px',
            }}
          >
            <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search resources by title, composer, rāga, keyword (e.g. Shivkumar, Sangeethapriya, Purandara, Dikshitar)..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text)',
                fontSize: '0.92rem',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  padding: '2px 6px',
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Pills & Counter */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.map((cat) => {
                const isActive = category === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    style={{
                      background: isActive ? 'var(--accent)' : 'var(--surface)',
                      color: isActive ? 'var(--bg, #0F172A)' : 'var(--text)',
                      border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 20,
                      padding: '6px 16px',
                      fontSize: '0.85rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>

            <span
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                fontWeight: 500,
              }}
            >
              Showing {filteredResources.length} of {LEARNING_RESOURCES.length} resources
            </span>
          </div>
        </div>

        {/* Resources Cards Grid */}
        {filteredResources.length > 0 ? (
          <div
            style={{
              marginTop: 24,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 20,
            }}
          >
            {filteredResources.map((resource) => {
              const ModuleIcon = MODULE_ICONS[resource.practiceModule] || ArrowRight

              return (
                <div
                  key={resource.id}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 16,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    transition: 'transform 0.15s ease, border-color 0.15s ease',
                  }}
                >
                  <div>
                    {/* Category & Level Badges */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: 'var(--accent-dim)',
                          color: 'var(--accent)',
                          border: '1px solid var(--accent)',
                        }}
                      >
                        {resource.category}
                      </span>

                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: 'var(--bg, rgba(0,0,0,0.2))',
                          border: '1px solid var(--border)',
                        }}
                      >
                        {resource.level}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      style={{
                        margin: '0 0 8px',
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        color: 'var(--text)',
                        lineHeight: 1.4,
                      }}
                    >
                      {resource.title}
                    </h3>

                    {/* Description */}
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.85rem',
                        color: 'var(--text-muted)',
                        lineHeight: 1.5,
                      }}
                    >
                      {resource.description}
                    </p>
                  </div>

                  {/* Practice Challenge / Task Box */}
                  <div
                    style={{
                      background: 'var(--bg, rgba(0,0,0,0.25))',
                      borderLeft: '3px solid var(--accent)',
                      borderRadius: 8,
                      padding: '10px 12px',
                      fontSize: '0.82rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--accent)',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.78rem',
                      }}
                    >
                      <Sparkles size={12} /> Suggested Practice Task
                    </span>
                    <span style={{ color: 'var(--text)', lineHeight: 1.45 }}>
                      {resource.task}
                    </span>
                  </div>

                  {/* Actions & Access Note */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <button
                        onClick={() => openResource(resource.url)}
                        style={{
                          background: 'transparent',
                          color: 'var(--text)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          padding: '8px 10px',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        Visit Site <ExternalLink size={13} />
                      </button>

                      <button
                        onClick={() => setModule(resource.practiceModule)}
                        style={{
                          background: 'var(--accent)',
                          color: 'var(--bg, #0F172A)',
                          border: 'none',
                          borderRadius: 8,
                          padding: '8px 10px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <ModuleIcon size={14} />
                        {resource.practiceLabel}
                      </button>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <ShieldCheck size={12} style={{ flexShrink: 0 }} />
                      <span>{resource.accessNote}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Empty Search State */
          <div
            style={{
              marginTop: 48,
              textAlign: 'center',
              padding: 40,
              background: 'var(--surface)',
              borderRadius: 16,
              border: '1px solid var(--border)',
            }}
          >
            <Compass size={36} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <h3 style={{ margin: '0 0 6px', color: 'var(--text)' }}>No resources found</h3>
            <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              No matches found for "{search}" in category "{category}".
            </p>
            <button
              onClick={() => {
                setSearch('')
                setCategory('All')
              }}
              style={{
                background: 'var(--accent)',
                color: 'var(--bg, #0F172A)',
                border: 'none',
                borderRadius: 8,
                padding: '8px 18px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <RotateCcw size={14} /> Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Resources