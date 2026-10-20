import type { GamakaProfile, GamakaExercise, KattaiOption } from '../types/gamaka';

export const KATTAI_OPTIONS: KattaiOption[] = [
  { name: '1', label: '1 Kattai (C)', f0Hz: 261.63, westernNote: 'C' },
  { name: '1.5', label: '1.5 Kattai (C#)', f0Hz: 277.18, westernNote: 'C#' },
  { name: '2', label: '2 Kattai (D)', f0Hz: 293.66, westernNote: 'D' },
  { name: '2.5', label: '2.5 Kattai (D#)', f0Hz: 311.13, westernNote: 'D#' },
  { name: '3', label: '3 Kattai (E)', f0Hz: 329.63, westernNote: 'E' },
  { name: '4', label: '4 Kattai (F)', f0Hz: 349.23, westernNote: 'F' },
  { name: '4.5', label: '4.5 Kattai (F#)', f0Hz: 369.99, westernNote: 'F#' },
  { name: '5', label: '5 Kattai (G)', f0Hz: 392.00, westernNote: 'G' },
  { name: '5.5', label: '5.5 Kattai (G#)', f0Hz: 415.30, westernNote: 'G#' },
  { name: '6', label: '6 Kattai (A)', f0Hz: 440.00, westernNote: 'A' }
];

export const GAMAKA_PROFILES: GamakaProfile[] = [
  {
    "id": "m15_kampita_g3",
    "name": "Antara G\u0101ndh\u0101ra Kampitam",
    "raga": "M\u0101y\u0101m\u0101\u1e37avagau\u1e37a",
    "melaNumber": 15,
    "family": "Oscillations / Waves",
    "classicalType": "Kampita (~)",
    "notationSymbol": "~",
    "targetSwara": "G3",
    "vowelVocable": "gu",
    "baseCents": 386.31,
    "plainCents": 400.0,
    "listeningCue": "Notice how on the V\u012b\u1e47\u0101, the G\u0101ndh\u0101ra is gently deflected across the fret without touching the sharpness of Prati Madhyama.",
    "description": "The Antara G\u0101ndh\u0101ra of M\u0101y\u0101m\u0101\u1e37avagau\u1e37a oscillates symmetrically between Suddha Rishabha (R1: 112c) and Suddha Madhyama (M1: 498c), centering on 386c.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 386.31
      },
      {
        "t_ms": 120,
        "cents": 475.0
      },
      {
        "t_ms": 240,
        "cents": 230.0
      },
      {
        "t_ms": 360,
        "cents": 485.0
      },
      {
        "t_ms": 480,
        "cents": 240.0
      },
      {
        "t_ms": 600,
        "cents": 470.0
      },
      {
        "t_ms": 720,
        "cents": 386.31
      }
    ]
  },
  {
    "id": "m15_kampita_d1",
    "name": "\u015auddha Dhaivata Kampitam",
    "raga": "M\u0101y\u0101m\u0101\u1e37avagau\u1e37a",
    "melaNumber": 15,
    "family": "Oscillations / Waves",
    "classicalType": "Kampita (~)",
    "notationSymbol": "~",
    "targetSwara": "D1",
    "vowelVocable": "dha",
    "baseCents": 813.69,
    "plainCents": 800.0,
    "listeningCue": "Listen to the warm, balanced wave on Dhaivata that mirrors the G\u0101ndh\u0101ra wave in the lower tetrachord.",
    "description": "\u015auddha Dhaivata swings gently from Panchama (702c) upwards toward Kakali Nishada without touching T\u0101ra Shadja.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 813.69
      },
      {
        "t_ms": 125,
        "cents": 910.0
      },
      {
        "t_ms": 250,
        "cents": 720.0
      },
      {
        "t_ms": 375,
        "cents": 920.0
      },
      {
        "t_ms": 500,
        "cents": 730.0
      },
      {
        "t_ms": 625,
        "cents": 813.69
      }
    ]
  },
  {
    "id": "m15_sphurita_janta",
    "name": "Janta Swara Sphuritam (G3 G3)",
    "raga": "M\u0101y\u0101m\u0101\u1e37avagau\u1e37a",
    "melaNumber": 15,
    "family": "Accents / Touches",
    "classicalType": "Sphurita (w)",
    "notationSymbol": "w",
    "targetSwara": "G3 G3",
    "vowelVocable": "gu gu",
    "baseCents": 386.31,
    "plainCents": 400.0,
    "listeningCue": "Hear how the second 'Ga' does not repeat cleanly like a piano key, but kicks up from Ri with a sudden glottal strike.",
    "description": "In doubled Janta pairs (G3 G3), the second note is articulated by striking firmly from the lower neighbor R1 (112c) with an accent.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 386.31
      },
      {
        "t_ms": 250,
        "cents": 386.31
      },
      {
        "t_ms": 280,
        "cents": 112.0
      },
      {
        "t_ms": 310,
        "cents": 386.31
      },
      {
        "t_ms": 550,
        "cents": 386.31
      }
    ]
  },
  {
    "id": "m15_ullasita_jaru",
    "name": "Ull\u0101sita J\u0101ru (S \u2197 P)",
    "raga": "M\u0101y\u0101m\u0101\u1e37avagau\u1e37a",
    "melaNumber": 15,
    "family": "Glides / Portamento",
    "classicalType": "Ull\u0101sita / J\u0101ru (/)",
    "notationSymbol": "/",
    "targetSwara": "S to P",
    "vowelVocable": "sa to pa",
    "baseCents": 0.0,
    "plainCents": 0.0,
    "listeningCue": "Notice how the sound never cuts off\u2014it glides continuously like water over smooth river pebbles.",
    "description": "Unbroken portamento slide leaping from Shadjam (0c) across the intervening swaras directly into Panchamam (702c).",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 0.0
      },
      {
        "t_ms": 150,
        "cents": 112.0
      },
      {
        "t_ms": 300,
        "cents": 386.0
      },
      {
        "t_ms": 450,
        "cents": 498.0
      },
      {
        "t_ms": 600,
        "cents": 702.0
      }
    ]
  },
  {
    "id": "m08_todi_gandhara_kampitam",
    "name": "The Celebrated T\u014d\u1e0di G\u0101ndh\u0101ra Shake",
    "raga": "Hanumat\u014d\u1e0di",
    "melaNumber": 8,
    "family": "Oscillations / Waves",
    "classicalType": "Kampita (~)",
    "notationSymbol": "~",
    "targetSwara": "G2",
    "vowelVocable": "gi",
    "baseCents": 315.64,
    "plainCents": 300.0,
    "listeningCue": "Hear how the V\u012b\u1e47\u0101 artist never frets G\u0101ndh\u0101ra directly\u2014the finger stays anchored on Rishabha and pulls the wire sideways to create the plaintive T\u014d\u1e0di cry.",
    "description": "T\u014d\u1e0di G\u0101ndh\u0101ra is never rendered as a flat static note; it begins with an oscillation pulled upwards from Suddha Rishabha (112c), rising through 204c and 316c, but strictly avoiding touching Madhyama.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 120.0
      },
      {
        "t_ms": 140,
        "cents": 345.0
      },
      {
        "t_ms": 280,
        "cents": 130.0
      },
      {
        "t_ms": 420,
        "cents": 350.0
      },
      {
        "t_ms": 560,
        "cents": 140.0
      },
      {
        "t_ms": 700,
        "cents": 315.64
      }
    ]
  },
  {
    "id": "m08_todi_dhaivata_kampitam",
    "name": "T\u014d\u1e0di Dhaivata Oscillation",
    "raga": "Hanumat\u014d\u1e0di",
    "melaNumber": 8,
    "family": "Oscillations / Waves",
    "classicalType": "Kampita (~)",
    "notationSymbol": "~",
    "targetSwara": "D1",
    "vowelVocable": "dha",
    "baseCents": 813.69,
    "plainCents": 800.0,
    "listeningCue": "Notice the intense longing in the tone as Dhaivata clings to Panchama like a shadow.",
    "description": "\u015auddha Dhaivata in T\u014d\u1e0di is pulled upward from Panchama (702c), weeping towards Kaisiki Nishada (1018c) without settling flat.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 710.0
      },
      {
        "t_ms": 130,
        "cents": 850.0
      },
      {
        "t_ms": 260,
        "cents": 720.0
      },
      {
        "t_ms": 390,
        "cents": 860.0
      },
      {
        "t_ms": 520,
        "cents": 813.69
      }
    ]
  },
  {
    "id": "m08_nokku_nishada",
    "name": "N\u014dkku on Kai\u015biki Ni\u1e63\u0101da (N2)",
    "raga": "Hanumat\u014d\u1e0di",
    "melaNumber": 8,
    "family": "Stresses & Deflections",
    "classicalType": "N\u014dkku (^)",
    "notationSymbol": "^",
    "targetSwara": "N2",
    "vowelVocable": "ni",
    "baseCents": 1017.6,
    "plainCents": 1000.0,
    "listeningCue": "Hear how the note is given a subtle pressure accent from above before dropping into the steady note.",
    "description": "Downward stress flick on Kaisiki Nishada borrowed momentarily from T\u0101ra Shadja (1200c) with rapid exponential decay.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 1180.0
      },
      {
        "t_ms": 60,
        "cents": 1017.6
      },
      {
        "t_ms": 350,
        "cents": 1017.6
      }
    ]
  },
  {
    "id": "m22_andolita_gandhara",
    "name": "Pendulum Swing on S\u0101dh\u0101ra\u1e47a G\u0101ndh\u0101ra (\u0100ndolitam)",
    "raga": "Kharaharapriy\u0101",
    "melaNumber": 22,
    "family": "Pendulum Swings",
    "classicalType": "\u0100ndolita (~~)",
    "notationSymbol": "~~",
    "targetSwara": "G2",
    "vowelVocable": "gi",
    "baseCents": 315.64,
    "plainCents": 300.0,
    "listeningCue": "Listen to how the swing pauses gracefully at the apex before floating back down to the baseline.",
    "description": "A majestic, slow-swinging arc where G\u0101ndh\u0101ra swings broadly between Chatushruti Rishabha (204c) and Suddha Madhyama (498c) like a garden swing (dol\u0101).",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 204.0
      },
      {
        "t_ms": 250,
        "cents": 420.0
      },
      {
        "t_ms": 500,
        "cents": 210.0
      },
      {
        "t_ms": 750,
        "cents": 410.0
      },
      {
        "t_ms": 1000,
        "cents": 315.64
      }
    ]
  },
  {
    "id": "m22_leena_madhyama",
    "name": "L\u012bna Madhyama Merge",
    "raga": "Kharaharapriy\u0101",
    "melaNumber": 22,
    "family": "Specialized Ornaments",
    "classicalType": "L\u012bna (\u2014~)",
    "notationSymbol": "\u2014~",
    "targetSwara": "M1",
    "vowelVocable": "ma",
    "baseCents": 498.04,
    "plainCents": 500.0,
    "listeningCue": "Hear how the note loses its distinct edge and melts into the drone of Panchama.",
    "description": "Suddha Madhyama softly and imperceptibly dissolves into Panchamam without a sharp transition.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 498.04
      },
      {
        "t_ms": 300,
        "cents": 550.0
      },
      {
        "t_ms": 600,
        "cents": 680.0
      },
      {
        "t_ms": 800,
        "cents": 701.96
      }
    ]
  },
  {
    "id": "m28_orika_nishada",
    "name": "The B\u0101\u1e47a Ni\u1e63\u0101da Orika Curve",
    "raga": "Harik\u0101mbh\u014dji",
    "melaNumber": 28,
    "family": "Stresses & Deflections",
    "classicalType": "Orika (\u2312)",
    "notationSymbol": "\u2312",
    "targetSwara": "N2",
    "vowelVocable": "ni",
    "baseCents": 1017.6,
    "plainCents": 1000.0,
    "listeningCue": "Notice the subtle upward curl at the start of the descent\u2014it sounds like a quick decorative flourish.",
    "description": "In descent (\u1e60 N2 D2), Kaisiki Nishada is deflected upwards towards T\u0101ra Shadja before dropping sharply into Chatushruti Dhaivata (884c).",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 1200.0
      },
      {
        "t_ms": 80,
        "cents": 1080.0
      },
      {
        "t_ms": 200,
        "cents": 1017.6
      },
      {
        "t_ms": 400,
        "cents": 884.36
      }
    ]
  },
  {
    "id": "m28_vali_dhaivata",
    "name": "Vali Circular Wave on Dhaivata",
    "raga": "Harik\u0101mbh\u014dji",
    "melaNumber": 28,
    "family": "Circular Deflections",
    "classicalType": "Vali (c~)",
    "notationSymbol": "c~",
    "targetSwara": "D2",
    "vowelVocable": "dhi",
    "baseCents": 884.36,
    "plainCents": 900.0,
    "listeningCue": "Hear how the wave is irregular and expressive, unlike the clockwork regularity of Kampitam.",
    "description": "An undulating, circular wave that rolls across Dhaivata with fluctuating velocity like wind over water.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 884.36
      },
      {
        "t_ms": 110,
        "cents": 960.0
      },
      {
        "t_ms": 230,
        "cents": 820.0
      },
      {
        "t_ms": 340,
        "cents": 980.0
      },
      {
        "t_ms": 460,
        "cents": 840.0
      },
      {
        "t_ms": 600,
        "cents": 884.36
      }
    ]
  },
  {
    "id": "m29_nokku_gandhara",
    "name": "The Regal Antara G\u0101ndh\u0101ra N\u014dkku",
    "raga": "Dh\u012bra\u015ba\u1e45kar\u0101bhara\u1e47am",
    "melaNumber": 29,
    "family": "Stresses & Deflections",
    "classicalType": "N\u014dkku (^)",
    "notationSymbol": "^",
    "targetSwara": "G3",
    "vowelVocable": "gu",
    "baseCents": 386.31,
    "plainCents": 400.0,
    "listeningCue": "Notice the commanding, authoritative quality\u2014the note does not slide loosely, it strikes firmly and stands tall.",
    "description": "Antara G\u0101ndh\u0101ra is sounded with a sharp downward pressure borrowed momentarily from Suddha Madhyama (498c), giving it regal firmness.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 490.0
      },
      {
        "t_ms": 50,
        "cents": 386.31
      },
      {
        "t_ms": 400,
        "cents": 386.31
      }
    ]
  },
  {
    "id": "m29_ahata_descent",
    "name": "\u0100hata (Ravai) Cascading Descent",
    "raga": "Dh\u012bra\u015ba\u1e45kar\u0101bhara\u1e47am",
    "melaNumber": 29,
    "family": "Accents / Touches",
    "classicalType": "\u0100hata (^)",
    "notationSymbol": "^",
    "targetSwara": "\u1e60 N3 D2 P",
    "vowelVocable": "SA nu dhi pa",
    "baseCents": 1200.0,
    "plainCents": 1200.0,
    "listeningCue": "Hear the sparkling, pearly clarity of each note stepping backwards like a cascade of silver bells.",
    "description": "In cascading descent, each swara strikes its upper neighbor before dropping: \u1e60 \u1e58 \u1e60, N3 \u1e60 N3, D2 N3 D2, P D2 P.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 1200.0
      },
      {
        "t_ms": 100,
        "cents": 1404.0
      },
      {
        "t_ms": 200,
        "cents": 1200.0
      },
      {
        "t_ms": 300,
        "cents": 1088.0
      },
      {
        "t_ms": 400,
        "cents": 1200.0
      },
      {
        "t_ms": 500,
        "cents": 1088.0
      },
      {
        "t_ms": 600,
        "cents": 884.0
      },
      {
        "t_ms": 700,
        "cents": 1088.0
      },
      {
        "t_ms": 800,
        "cents": 884.0
      },
      {
        "t_ms": 900,
        "cents": 702.0
      }
    ]
  },
  {
    "id": "m65_prati_madhyama_kampitam",
    "name": "The Shimmering Prati Madhyama Shake",
    "raga": "Mechakaly\u0101\u1e47i",
    "melaNumber": 65,
    "family": "Oscillations / Waves",
    "classicalType": "Kampita (~)",
    "notationSymbol": "~",
    "targetSwara": "M2",
    "vowelVocable": "mi",
    "baseCents": 590.22,
    "plainCents": 600.0,
    "listeningCue": "Hear the electric vibrancy of the note\u2014it doesn't sit quietly; it darts up to Panchama with dazzling speed.",
    "description": "Prati Madhyama vibrates rapidly and tightly against Panchama (702c), creating a bright, shimmering, razor-sharp ornament unique to Kaly\u0101\u1e47i.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 590.22
      },
      {
        "t_ms": 90,
        "cents": 690.0
      },
      {
        "t_ms": 180,
        "cents": 530.0
      },
      {
        "t_ms": 270,
        "cents": 695.0
      },
      {
        "t_ms": 360,
        "cents": 535.0
      },
      {
        "t_ms": 450,
        "cents": 690.0
      },
      {
        "t_ms": 540,
        "cents": 590.22
      }
    ]
  },
  {
    "id": "m65_kalyani_tara_andolitam",
    "name": "T\u0101ra Sth\u0101yi \u0100ndolita Glide (P \u2197 \u1e60 ~)",
    "raga": "Mechakaly\u0101\u1e47i",
    "melaNumber": 65,
    "family": "Glides / Portamento",
    "classicalType": "\u0100ndolita / J\u0101ru (~~ /)",
    "notationSymbol": "~~ /",
    "targetSwara": "P to \u1e60",
    "vowelVocable": "pa to SA",
    "baseCents": 701.96,
    "plainCents": 700.0,
    "listeningCue": "Notice the sense of elevation and triumph as the melody ascends into the highest register and blossoms.",
    "description": "An expansive soaring leap from Panchama directly into T\u0101ra Shadja, immediately breaking into an auspicious, grand swing on high Ni\u1e63\u0101da and Shadja.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 702.0
      },
      {
        "t_ms": 200,
        "cents": 884.0
      },
      {
        "t_ms": 350,
        "cents": 1088.0
      },
      {
        "t_ms": 500,
        "cents": 1200.0
      },
      {
        "t_ms": 650,
        "cents": 1320.0
      },
      {
        "t_ms": 800,
        "cents": 1150.0
      },
      {
        "t_ms": 950,
        "cents": 1310.0
      },
      {
        "t_ms": 1100,
        "cents": 1200.0
      }
    ]
  },
  {
    "id": "moh_jaru_leap_descent",
    "name": "Pentatonic Cascade Descent (I\u1e5fa\u1e45ga J\u0101ru)",
    "raga": "M\u014dhanam",
    "melaNumber": null,
    "family": "Glides / Portamento",
    "classicalType": "I\u1e5fa\u1e45ga J\u0101ru (\\)",
    "notationSymbol": "\\",
    "targetSwara": "P \\ G3 \\ R2 \\ S",
    "vowelVocable": "a",
    "baseCents": 701.96,
    "plainCents": 700.0,
    "listeningCue": "Listen for how the V\u012b\u1e47\u0101 plucks Panchama and glides down to Antara G\u0101ndh\u0101ra, completely jumping over the non-existent Madhyama fret.",
    "description": "The hallmark pentatonic slide of M\u014dhanam leaping cleanly across the omitted Madhyama (M1) and Nishada (N2). Each note lands with a gentle tail glide into the lower note without smearing.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 702.0
      },
      {
        "t_ms": 150,
        "cents": 702.0
      },
      {
        "t_ms": 250,
        "cents": 420.0
      },
      {
        "t_ms": 400,
        "cents": 386.3
      },
      {
        "t_ms": 550,
        "cents": 386.3
      },
      {
        "t_ms": 650,
        "cents": 240.0
      },
      {
        "t_ms": 800,
        "cents": 203.9
      },
      {
        "t_ms": 950,
        "cents": 203.9
      },
      {
        "t_ms": 1050,
        "cents": 50.0
      },
      {
        "t_ms": 1200,
        "cents": 0.0
      }
    ]
  },
  {
    "id": "moh_kampita_g3",
    "name": "M\u014dhana G\u0101ndh\u0101ra Symmetrical Wave",
    "raga": "M\u014dhanam",
    "melaNumber": null,
    "family": "Oscillations / Waves",
    "classicalType": "Kampita (~)",
    "notationSymbol": "~",
    "targetSwara": "G3",
    "vowelVocable": "a",
    "baseCents": 386.31,
    "plainCents": 400.0,
    "listeningCue": "Notice on the V\u012b\u1e47\u0101 how G\u0101ndh\u0101ra is pulled all the way from the R2 fret, never touching a flat M1.",
    "description": "Antara G\u0101ndh\u0101ra in M\u014dhanam oscillates widely, anchored on Chatu\u015bruti Rishabha (R2: 204c) and swinging upwards towards Panchama, completely bypassing the absent Madhyama.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 386.3
      },
      {
        "t_ms": 110,
        "cents": 480.0
      },
      {
        "t_ms": 220,
        "cents": 260.0
      },
      {
        "t_ms": 330,
        "cents": 490.0
      },
      {
        "t_ms": 440,
        "cents": 270.0
      },
      {
        "t_ms": 550,
        "cents": 386.3
      }
    ]
  },
  {
    "id": "hmd_sphurita_janta",
    "name": "Brilliant Janta Sphuritam Touch",
    "raga": "Ha\u1e43sadhvani",
    "melaNumber": null,
    "family": "Accents / Touches",
    "classicalType": "Sphurita (w)",
    "notationSymbol": "w",
    "targetSwara": "G3 G3 (w)",
    "vowelVocable": "a",
    "baseCents": 386.31,
    "plainCents": 400.0,
    "listeningCue": "Hear the sharp glottal or fret-strike accent on the second G\u0101ndh\u0101ra\u2014it sounds like a crisp musical exclamation mark.",
    "description": "In Ha\u1e43sadhvani janta pairs, the second swara is struck with an instantaneous grace touch from its lower neighbor (R2 touching G3) creating a sparkling, accented jewel-like strike.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 386.3
      },
      {
        "t_ms": 200,
        "cents": 386.3
      },
      {
        "t_ms": 210,
        "cents": 204.0
      },
      {
        "t_ms": 235,
        "cents": 386.3
      },
      {
        "t_ms": 450,
        "cents": 386.3
      }
    ]
  },
  {
    "id": "hmd_ullasa_tara",
    "name": "Soaring T\u0101ra Shadja Leap (Ull\u0101sa J\u0101ru)",
    "raga": "Ha\u1e43sadhvani",
    "melaNumber": null,
    "family": "Glides / Portamento",
    "classicalType": "Ull\u0101sa J\u0101ru (/)",
    "notationSymbol": "/",
    "targetSwara": "P / N3 / \u1e60",
    "vowelVocable": "a",
    "baseCents": 1200.0,
    "plainCents": 1200.0,
    "listeningCue": "Follow the soaring rocket-like glide on the flute as it opens into the upper register.",
    "description": "The triumphant vault from Panchama through K\u0101kali Ni\u1e63\u0101da into high T\u0101ra Sha\u1e0dja, characteristic of dramatic Ha\u1e43sadhvani openings.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 702.0
      },
      {
        "t_ms": 150,
        "cents": 850.0
      },
      {
        "t_ms": 300,
        "cents": 1088.3
      },
      {
        "t_ms": 450,
        "cents": 1200.0
      },
      {
        "t_ms": 700,
        "cents": 1200.0
      }
    ]
  },
  {
    "id": "mal_ascent_bridge_g_varjya",
    "name": "G\u0101ndh\u0101ra-Varjya Ascent Bridge (Ull\u0101sa J\u0101ru)",
    "raga": "Malahari",
    "melaNumber": null,
    "family": "Glides / Portamento",
    "classicalType": "Ull\u0101sa J\u0101ru (/)",
    "notationSymbol": "/",
    "targetSwara": "R1 / M1",
    "vowelVocable": "a",
    "baseCents": 498.04,
    "plainCents": 500.0,
    "listeningCue": "Notice how the melody leaps across G\u0101ndh\u0101ra in ascent, but gracefully touches it during the subsequent descent.",
    "description": "In ascending Malahari phrases, G\u0101ndh\u0101ra is strictly omitted. The voice glides seamlessly from Suddha Rishabha (R1: 112c) to Suddha Madhyama (M1: 498c) without grazing G3.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 111.7
      },
      {
        "t_ms": 120,
        "cents": 111.7
      },
      {
        "t_ms": 250,
        "cents": 350.0
      },
      {
        "t_ms": 380,
        "cents": 498.0
      },
      {
        "t_ms": 600,
        "cents": 498.0
      }
    ]
  },
  {
    "id": "mal_descent_gentle_g3",
    "name": "Pillari Gitam Antara G\u0101ndh\u0101ra Descent Touch",
    "raga": "Malahari",
    "melaNumber": null,
    "family": "Oscillations / Waves",
    "classicalType": "Kampita (~)",
    "notationSymbol": "~",
    "targetSwara": "P M1 G3 ~ R1 S",
    "vowelVocable": "a",
    "baseCents": 386.31,
    "plainCents": 400.0,
    "listeningCue": "Hear the tender, gentle rocking on G\u0101ndh\u0101ra as the phrase descends to rest on Shadjam.",
    "description": "In descent, Antara G\u0101ndh\u0101ra (G3) appears with a gentle, delicate wave\u2014not heavy like T\u014d\u1e0di, but sweet and restful, guiding the listener safely back to Shadjam.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 498.0
      },
      {
        "t_ms": 100,
        "cents": 410.0
      },
      {
        "t_ms": 220,
        "cents": 340.0
      },
      {
        "t_ms": 340,
        "cents": 430.0
      },
      {
        "t_ms": 460,
        "cents": 360.0
      },
      {
        "t_ms": 580,
        "cents": 200.0
      },
      {
        "t_ms": 700,
        "cents": 111.7
      }
    ]
  },
  {
    "id": "hin_andolita_d1",
    "name": "Nocturnal Suddha Dhaivata Swing (\u0100ndolitam)",
    "raga": "Hind\u014d\u1e37am",
    "melaNumber": null,
    "family": "Pendulum Swings",
    "classicalType": "\u0100ndolita (~~)",
    "notationSymbol": "~~",
    "targetSwara": "D1 ~~",
    "vowelVocable": "a",
    "baseCents": 813.69,
    "plainCents": 800.0,
    "listeningCue": "Listen to the majestic slow swing of Dhaivatam\u2014it feels like an elephant's graceful stride.",
    "description": "In Hind\u014d\u1e37am, Suddha Dhaivata swings with a slow, heavy pendulum arc. Because Panchama is omitted, D1 leans downwards towards Madhyama and swings upward towards Kai\u015biki Ni\u1e63\u0101da.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 813.7
      },
      {
        "t_ms": 180,
        "cents": 930.0
      },
      {
        "t_ms": 360,
        "cents": 680.0
      },
      {
        "t_ms": 540,
        "cents": 920.0
      },
      {
        "t_ms": 720,
        "cents": 710.0
      },
      {
        "t_ms": 900,
        "cents": 813.7
      }
    ]
  },
  {
    "id": "hin_kampita_g2",
    "name": "S\u0101dh\u0101ra\u1e47a G\u0101ndh\u0101ra Inward Wave",
    "raga": "Hind\u014d\u1e37am",
    "melaNumber": null,
    "family": "Oscillations / Waves",
    "classicalType": "Kampita (~)",
    "notationSymbol": "~",
    "targetSwara": "G2 ~",
    "vowelVocable": "a",
    "baseCents": 315.64,
    "plainCents": 300.0,
    "listeningCue": "Hear how G\u0101ndh\u0101ra avoids any sharp edges, undulating softly like gentle ripples on a temple tank.",
    "description": "S\u0101dh\u0101ra\u1e47a G\u0101ndh\u0101ra in Hind\u014d\u1e37am oscillates gently between Shadjam and Madhyama, infusing the r\u0101ga with its soothing, meditative aura.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 315.6
      },
      {
        "t_ms": 120,
        "cents": 420.0
      },
      {
        "t_ms": 240,
        "cents": 210.0
      },
      {
        "t_ms": 360,
        "cents": 430.0
      },
      {
        "t_ms": 480,
        "cents": 220.0
      },
      {
        "t_ms": 600,
        "cents": 315.6
      }
    ]
  },
  {
    "id": "ssv_vali_r2",
    "name": "Radiant Rishabha Circular Curve (Vali)",
    "raga": "\u015auddha S\u0101veri",
    "melaNumber": null,
    "family": "Circular Deflections",
    "classicalType": "Vali (@)",
    "notationSymbol": "@",
    "targetSwara": "R2 @",
    "vowelVocable": "a",
    "baseCents": 203.91,
    "plainCents": 200.0,
    "listeningCue": "Notice how Rishabha doesn't simply slide\u2014it makes a playful, circular loop before landing.",
    "description": "Vali on Chatu\u015bruti Rishabha involves a circular string deflection that curls upward and loops back, giving \u015auddha S\u0101veri its signature morning sparkle.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 203.9
      },
      {
        "t_ms": 80,
        "cents": 290.0
      },
      {
        "t_ms": 160,
        "cents": 160.0
      },
      {
        "t_ms": 240,
        "cents": 300.0
      },
      {
        "t_ms": 320,
        "cents": 203.9
      }
    ]
  },
  {
    "id": "ara_ravai_ahata_descent",
    "name": "Cascading Ravai / \u0100hata Descent",
    "raga": "\u0100rabhi",
    "melaNumber": null,
    "family": "Accents / Touches",
    "classicalType": "\u0100hata (v)",
    "notationSymbol": "v",
    "targetSwara": "\u1e60 N3 D2 P M1 G3 R2 S",
    "vowelVocable": "a",
    "baseCents": 884.36,
    "plainCents": 900.0,
    "listeningCue": "Hear how Gandhara is never sung as an open, sustained note\u2014it is merely a glancing touch between Madhyama and Rishabha.",
    "description": "In \u0100rabhi's descent, each swara is touched from above with an instantaneous grace flick (Ravai / \u0100hata). G\u0101ndh\u0101ra and Ni\u1e63\u0101da are never sustained; they appear only as fleeting backward glances.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 1200.0
      },
      {
        "t_ms": 100,
        "cents": 1088.3
      },
      {
        "t_ms": 200,
        "cents": 884.4
      },
      {
        "t_ms": 300,
        "cents": 702.0
      },
      {
        "t_ms": 400,
        "cents": 498.0
      },
      {
        "t_ms": 500,
        "cents": 386.3
      },
      {
        "t_ms": 600,
        "cents": 203.9
      },
      {
        "t_ms": 750,
        "cents": 0.0
      }
    ]
  },
  {
    "id": "srj_andolita_g2",
    "name": "Panchama-Varjya G\u0101ndh\u0101ra \u0100ndolitam",
    "raga": "\u015ar\u012bra\u00f1jani",
    "melaNumber": null,
    "family": "Pendulum Swings",
    "classicalType": "\u0100ndolita (~~)",
    "notationSymbol": "~~",
    "targetSwara": "G2 ~~",
    "vowelVocable": "a",
    "baseCents": 315.64,
    "plainCents": 300.0,
    "listeningCue": "Hear how G\u0101ndh\u0101ra stretches until it almost kisses Madhyama, creating profound emotional yearning.",
    "description": "Because Panchama is omitted in \u015ar\u012bra\u00f1jani, Madhyama acts as a massive tonal center. G\u0101ndh\u0101ra (G2) swings wide between Rishabha (204c) and Madhyama (498c) with soulful emotional gravity.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 315.6
      },
      {
        "t_ms": 150,
        "cents": 460.0
      },
      {
        "t_ms": 300,
        "cents": 230.0
      },
      {
        "t_ms": 450,
        "cents": 470.0
      },
      {
        "t_ms": 600,
        "cents": 240.0
      },
      {
        "t_ms": 750,
        "cents": 315.6
      }
    ]
  },
  {
    "id": "mdh_kampita_r2",
    "name": "Auspicious Rishabha Kampitam",
    "raga": "Madhyam\u0101vati",
    "melaNumber": null,
    "family": "Oscillations / Waves",
    "classicalType": "Kampita (~)",
    "notationSymbol": "~",
    "targetSwara": "R2 ~",
    "vowelVocable": "a",
    "baseCents": 203.91,
    "plainCents": 200.0,
    "listeningCue": "Listen for the sublime peace in Rishabha\u2014the reason why concerts conclude with this melody to leave listeners in auspicious serenity.",
    "description": "Chatu\u015bruti Rishabha in Madhyam\u0101vati is sung with a noble, comforting oscillation. It rises towards Madhyama and resolves down into Shadjam, dissipating all auditory fatigue.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 203.9
      },
      {
        "t_ms": 120,
        "cents": 290.0
      },
      {
        "t_ms": 240,
        "cents": 120.0
      },
      {
        "t_ms": 360,
        "cents": 300.0
      },
      {
        "t_ms": 480,
        "cents": 130.0
      },
      {
        "t_ms": 600,
        "cents": 203.9
      }
    ]
  },
  {
    "id": "anb_vakra_coil_g2_r2_g2",
    "name": "Sacred Vakra Loop (N\u0101ga Keli Coil)",
    "raga": "\u0100nandabhairavi",
    "melaNumber": null,
    "family": "Oscillations / Waves",
    "classicalType": "Kampita-Vakra (~)",
    "notationSymbol": "~",
    "targetSwara": "S G2 R2 G2 M1",
    "vowelVocable": "a",
    "baseCents": 315.64,
    "plainCents": 300.0,
    "listeningCue": "Hear how the voice coils like a graceful sacred serpent: S -> G2 -> dips to R2 -> re-touches G2 -> blooms into M1.",
    "description": "The definitive signature phrase of \u0100nandabhairavi. The melody vaults to G\u0101ndh\u0101ra, loops downward to Rishabha, rebounds back to G\u0101ndh\u0101ra, and flowers into Madhyama. It can never be sung as a linear S R G M.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 0.0
      },
      {
        "t_ms": 150,
        "cents": 315.6
      },
      {
        "t_ms": 300,
        "cents": 203.9
      },
      {
        "t_ms": 450,
        "cents": 315.6
      },
      {
        "t_ms": 650,
        "cents": 498.0
      },
      {
        "t_ms": 850,
        "cents": 498.0
      }
    ]
  },
  {
    "id": "anb_anya_swara_g3",
    "name": "Anya Swara Antara G\u0101ndh\u0101ra Vilamba Orika",
    "raga": "\u0100nandabhairavi",
    "melaNumber": null,
    "family": "Stresses & Deflections",
    "classicalType": "Orika (\u2312)",
    "notationSymbol": "\u2312",
    "targetSwara": "G3 (Anya Swara)",
    "vowelVocable": "a",
    "baseCents": 386.31,
    "plainCents": 400.0,
    "listeningCue": "Catch the fleeting, sweet appearance of the sharp major third (G3)\u2014a rare jewel embedded in a minor r\u0101ga.",
    "description": "Antara G\u0101ndh\u0101ra (G3) is an Anya Swara in \u0100nandabhairavi, appearing exclusively in slow, majestic phrases between Madhyamas. It must never be sung bare; it enters with a subtle upward inflection.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 498.0
      },
      {
        "t_ms": 180,
        "cents": 386.3
      },
      {
        "t_ms": 320,
        "cents": 420.0
      },
      {
        "t_ms": 450,
        "cents": 498.0
      }
    ]
  },
  {
    "id": "rtg_twin_nishada_shake",
    "name": "Twin Nish\u0101da Ascent Surge",
    "raga": "R\u012btigau\u1e37a",
    "melaNumber": null,
    "family": "Oscillations / Waves",
    "classicalType": "Kampita-Tripuccha (~)",
    "notationSymbol": "~",
    "targetSwara": "N2 N2 \u1e60",
    "vowelVocable": "a",
    "baseCents": 1017.6,
    "plainCents": 1000.0,
    "listeningCue": "Hear the magical double-shake on Nishada\u2014first note calls out, second note surges upward to touch high Shadjam.",
    "description": "The soul of R\u012btigau\u1e37a. From Madhyama, the melody vaults directly to Kai\u015biki Ni\u1e63\u0101da. The first Ni\u1e63\u0101da oscillates tenderly; the second Ni\u1e63\u0101da strikes with greater intensity and leaps triumphantly into T\u0101ra Sha\u1e0dja.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 498.0
      },
      {
        "t_ms": 150,
        "cents": 1017.6
      },
      {
        "t_ms": 280,
        "cents": 930.0
      },
      {
        "t_ms": 400,
        "cents": 1040.0
      },
      {
        "t_ms": 520,
        "cents": 1017.6
      },
      {
        "t_ms": 650,
        "cents": 1120.0
      },
      {
        "t_ms": 800,
        "cents": 1200.0
      }
    ]
  },
  {
    "id": "rtg_madhyama_axis_weave",
    "name": "Madhyama Axis Weave Descent",
    "raga": "R\u012btigau\u1e37a",
    "melaNumber": null,
    "family": "Oscillations / Waves",
    "classicalType": "Kampita-Vakra (~)",
    "notationSymbol": "~",
    "targetSwara": "P M1 G2 M1 P M1 G2 R2 S",
    "vowelVocable": "a",
    "baseCents": 498.04,
    "plainCents": 500.0,
    "listeningCue": "Notice how Madhyama acts like home base in this descent\u2014the melody touches other notes but always circles back to Madhyama.",
    "description": "In R\u012btigau\u1e37a's descent, Madhyama acts as a magnetic anchor. The melody touches Panchama, weaves into G\u0101ndh\u0101ra, and continually returns to rest on Madhyama before resolving to Shadjam.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 702.0
      },
      {
        "t_ms": 120,
        "cents": 498.0
      },
      {
        "t_ms": 240,
        "cents": 315.6
      },
      {
        "t_ms": 360,
        "cents": 498.0
      },
      {
        "t_ms": 480,
        "cents": 702.0
      },
      {
        "t_ms": 600,
        "cents": 498.0
      },
      {
        "t_ms": 720,
        "cents": 315.6
      },
      {
        "t_ms": 840,
        "cents": 203.9
      },
      {
        "t_ms": 980,
        "cents": 0.0
      }
    ]
  },
  {
    "id": "bgd_madhyama_heavy_shake",
    "name": "The Celebrated Bega\u1e0da Madhyama Shake",
    "raga": "Bega\u1e0da",
    "melaNumber": null,
    "family": "Oscillations / Waves",
    "classicalType": "Kampita (~~~)",
    "notationSymbol": "~~~",
    "targetSwara": "M1 ~~~ (Bega\u1e0da Madhyama)",
    "vowelVocable": "a",
    "baseCents": 535.0,
    "plainCents": 500.0,
    "listeningCue": "Listen closely to Madhyama: it sounds audibly sharper than any standard 'Ma', almost halfway to Prati Madhyama, quivering with regal power.",
    "description": "The most famous microtonal anomaly in Carnatic musicology! The Madhyama of Bega\u1e0da is nominally Suddha Madhyama (M1), but is sung at approximately 535\u2013545 cents\u2014significantly sharper than standard M1 (498c), vibrating with intense rapid energy against Panchama. It gives Bega\u1e0da its unmistakable aristocratic signature.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 510.0
      },
      {
        "t_ms": 90,
        "cents": 560.0
      },
      {
        "t_ms": 180,
        "cents": 515.0
      },
      {
        "t_ms": 270,
        "cents": 570.0
      },
      {
        "t_ms": 360,
        "cents": 520.0
      },
      {
        "t_ms": 450,
        "cents": 565.0
      },
      {
        "t_ms": 540,
        "cents": 535.0
      }
    ]
  },
  {
    "id": "bgd_anya_swara_n2",
    "name": "Anya Swara Kai\u015biki Ni\u1e63\u0101da Soft Glide",
    "raga": "Bega\u1e0da",
    "melaNumber": null,
    "family": "Glides / Portamento",
    "classicalType": "I\u1e5fa\u1e45ga J\u0101ru (\\)",
    "notationSymbol": "\\",
    "targetSwara": "\u1e60 N2 D2 P",
    "vowelVocable": "a",
    "baseCents": 1017.6,
    "plainCents": 1000.0,
    "listeningCue": "Hear the unexpected, sweet minor seventh (N2) entering during descent, softening the r\u0101ga's commanding character.",
    "description": "In Bega\u1e0da's descent, Kai\u015biki Ni\u1e63\u0101da (N2) enters as an Anya Swara. It softens the regal majesty of the ascent, introducing a momentary touch of sweet compassion before resolving to Dhaivata.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 1200.0
      },
      {
        "t_ms": 150,
        "cents": 1017.6
      },
      {
        "t_ms": 320,
        "cents": 920.0
      },
      {
        "t_ms": 480,
        "cents": 884.4
      },
      {
        "t_ms": 650,
        "cents": 702.0
      }
    ]
  },
  {
    "id": "kap_weeping_descent_jaru",
    "name": "Soul-Stirring Weeping Glide (Jagad\u014dddh\u0101ra\u1e47\u0101)",
    "raga": "K\u0101pi",
    "melaNumber": null,
    "family": "Glides / Portamento",
    "classicalType": "I\u1e5fa\u1e45ga J\u0101ru (\\)",
    "notationSymbol": "\\",
    "targetSwara": "P \\ M1 \\ G2 ~",
    "vowelVocable": "a",
    "baseCents": 315.64,
    "plainCents": 300.0,
    "listeningCue": "Hear the heart-melting portamento glide from Panchama down into oscillating G\u0101ndh\u0101ra\u2014it captures the tears and tender love of motherhood.",
    "description": "The most emotive glide in Carnatic music. From Panchama, the melody weeps downward through Madhyama into an oscillating G\u0101ndh\u0101ra (G2), evoking the mother's awe as Yash\u014dd\u0101 cradles the infant creator of the universe.",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 702.0
      },
      {
        "t_ms": 180,
        "cents": 702.0
      },
      {
        "t_ms": 320,
        "cents": 580.0
      },
      {
        "t_ms": 460,
        "cents": 498.0
      },
      {
        "t_ms": 600,
        "cents": 360.0
      },
      {
        "t_ms": 720,
        "cents": 315.6
      },
      {
        "t_ms": 840,
        "cents": 380.0
      },
      {
        "t_ms": 960,
        "cents": 280.0
      },
      {
        "t_ms": 1100,
        "cents": 315.6
      }
    ]
  },
  {
    "id": "kap_kakali_nishada_ascent",
    "name": "K\u0101kali Ni\u1e63\u0101da Leading-Tone Reach",
    "raga": "K\u0101pi",
    "melaNumber": null,
    "family": "Glides / Portamento",
    "classicalType": "Ull\u0101sa J\u0101ru (/)",
    "notationSymbol": "/",
    "targetSwara": "P / N3 / \u1e60",
    "vowelVocable": "a",
    "baseCents": 1088.27,
    "plainCents": 1100.0,
    "listeningCue": "Notice the bright, yearning reach of sharp Ni\u1e63\u0101da in ascent, contrasting with the soft, weeping flat Ni\u1e63\u0101da in descent.",
    "description": "In K\u0101pi's ascent, the sharp K\u0101kali Ni\u1e63\u0101da (N3: 1088c) appears as an Anya Swara, reaching urgently towards T\u0101ra Sha\u1e0dja, whereas the descent exclusively uses Kai\u015biki Ni\u1e63\u0101da (N2: 1018c).",
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 702.0
      },
      {
        "t_ms": 150,
        "cents": 900.0
      },
      {
        "t_ms": 300,
        "cents": 1088.3
      },
      {
        "t_ms": 450,
        "cents": 1200.0
      },
      {
        "t_ms": 650,
        "cents": 1200.0
      }
    ]
  }
];

export const GAMAKA_EXERCISES: GamakaExercise[] = [
  {
    "id": "gamaka_L1_01",
    "title": "Exercise 1: The Gentle Swara Slide (Ull\u0101sa J\u0101ru)",
    "level": "beginner",
    "ornamentType": "J\u0101ru (Ascending Glide)",
    "notationSymbol": "/",
    "raga": "M\u0101y\u0101m\u0101\u1e37avagau\u1e37a (#15)",
    "pronunciationCue": "Start with relaxed belly breath on 'Sa', keep jaw still, glide continuous pitch like a violin string slide up to 'Pa'.",
    "avatar": "Golden Hamsa (Swan)",
    "theme": "Sky Glide over Nilgiris",
    "toleranceCents": 35.0,
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 0.0
      },
      {
        "t_ms": 300,
        "cents": 112.0
      },
      {
        "t_ms": 600,
        "cents": 386.0
      },
      {
        "t_ms": 900,
        "cents": 498.0
      },
      {
        "t_ms": 1200,
        "cents": 702.0
      }
    ],
    "waypoints": [
      {
        "t_ms": 150,
        "cents": 56.0,
        "star_index": 1
      },
      {
        "t_ms": 450,
        "cents": 249.0,
        "star_index": 2
      },
      {
        "t_ms": 750,
        "cents": 442.0,
        "star_index": 3
      },
      {
        "t_ms": 1150,
        "cents": 702.0,
        "star_index": 4
      }
    ]
  },
  {
    "id": "gamaka_L1_02",
    "title": "Exercise 2: The Descending River Slide (I\u1e5fa\u1e45ga J\u0101ru)",
    "level": "beginner",
    "ornamentType": "J\u0101ru (Descending Glide)",
    "notationSymbol": "\\",
    "raga": "M\u0101y\u0101m\u0101\u1e37avagau\u1e37a (#15)",
    "pronunciationCue": "Never let the volume drop as pitch descends; keep chest resonance open as you land on 'Sa'.",
    "avatar": "Silver Fish (Matsya)",
    "theme": "River Cauvery Cascades",
    "toleranceCents": 35.0,
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 702.0
      },
      {
        "t_ms": 300,
        "cents": 498.0
      },
      {
        "t_ms": 600,
        "cents": 386.0
      },
      {
        "t_ms": 900,
        "cents": 112.0
      },
      {
        "t_ms": 1200,
        "cents": 0.0
      }
    ],
    "waypoints": [
      {
        "t_ms": 150,
        "cents": 646.0,
        "star_index": 1
      },
      {
        "t_ms": 450,
        "cents": 442.0,
        "star_index": 2
      },
      {
        "t_ms": 750,
        "cents": 249.0,
        "star_index": 3
      },
      {
        "t_ms": 1150,
        "cents": 0.0,
        "star_index": 4
      }
    ]
  },
  {
    "id": "gamaka_L1_03",
    "title": "Exercise 3: Slow Ocean Wave (Vilambita Kampitam)",
    "level": "beginner",
    "ornamentType": "Kampita (Slow Oscillation)",
    "notationSymbol": "~",
    "raga": "M\u0101y\u0101m\u0101\u1e37avagau\u1e37a (#15)",
    "pronunciationCue": "Think of a swing or hammock. Do not vocalize 'ga-ga-ga'; produce one uninterrupted tone that rises and falls smoothly.",
    "avatar": "Ocean Dolphin",
    "theme": "Ocean Waves of Kanyakumari",
    "toleranceCents": 35.0,
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 386.0
      },
      {
        "t_ms": 116,
        "cents": 461.0
      },
      {
        "t_ms": 233,
        "cents": 386.0
      },
      {
        "t_ms": 350,
        "cents": 311.0
      },
      {
        "t_ms": 466,
        "cents": 386.0
      },
      {
        "t_ms": 583,
        "cents": 461.0
      },
      {
        "t_ms": 700,
        "cents": 386.0
      },
      {
        "t_ms": 816,
        "cents": 311.0
      },
      {
        "t_ms": 933,
        "cents": 386.0
      },
      {
        "t_ms": 1050,
        "cents": 461.0
      },
      {
        "t_ms": 1166,
        "cents": 386.0
      },
      {
        "t_ms": 1283,
        "cents": 311.0
      },
      {
        "t_ms": 1400,
        "cents": 386.0
      }
    ],
    "waypoints": [
      {
        "t_ms": 100,
        "cents": 386.0,
        "star_index": 1
      },
      {
        "t_ms": 300,
        "cents": 498.0,
        "star_index": 2
      },
      {
        "t_ms": 500,
        "cents": 249.0,
        "star_index": 3
      },
      {
        "t_ms": 700,
        "cents": 498.0,
        "star_index": 4
      },
      {
        "t_ms": 900,
        "cents": 249.0,
        "star_index": 5
      },
      {
        "t_ms": 1100,
        "cents": 386.0,
        "star_index": 6
      }
    ]
  },
  {
    "id": "gamaka_L1_04",
    "title": "Exercise 4: The Janta Stepping Accent (Beginner Sphuritam)",
    "level": "beginner",
    "ornamentType": "Sphurita (Twin Touch)",
    "notationSymbol": "w",
    "raga": "M\u0101y\u0101m\u0101\u1e37avagau\u1e37a (#15)",
    "pronunciationCue": "The first note is firm; the second note has a subtle diaphragmatic impulse that bounces from the note below.",
    "avatar": "Spotted Deer (Harina)",
    "theme": "Stepping Stones in the Forest Temple",
    "toleranceCents": 35.0,
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 386.0
      },
      {
        "t_ms": 350,
        "cents": 386.0
      },
      {
        "t_ms": 375,
        "cents": 204.0
      },
      {
        "t_ms": 410,
        "cents": 386.0
      },
      {
        "t_ms": 800,
        "cents": 386.0
      }
    ],
    "waypoints": [
      {
        "t_ms": 100,
        "cents": 0.0,
        "star_index": 1
      },
      {
        "t_ms": 280,
        "cents": -100.0,
        "star_index": 2
      },
      {
        "t_ms": 360,
        "cents": 0.0,
        "star_index": 3
      },
      {
        "t_ms": 600,
        "cents": 0.0,
        "star_index": 4
      }
    ]
  },
  {
    "id": "gamaka_L2_01",
    "title": "Exercise 1: Classical Kampitam in Second Speed (Dvit\u012bya K\u0101la)",
    "level": "intermediate",
    "ornamentType": "Kampita (Concert Oscillation)",
    "notationSymbol": "~",
    "raga": "M\u0101y\u0101m\u0101\u1e37avagau\u1e37a (#15)",
    "pronunciationCue": "Oscillate evenly without trembling. Feel the rhythmic pulse of 4 full waves per beat of \u0100di T\u0101la.",
    "avatar": "Dancing Peacock (Mayura)",
    "theme": "Temple Chariot Festive Run",
    "toleranceCents": 35.0,
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 498.0
      },
      {
        "t_ms": 55,
        "cents": 558.0
      },
      {
        "t_ms": 110,
        "cents": 498.0
      },
      {
        "t_ms": 165,
        "cents": 438.0
      },
      {
        "t_ms": 220,
        "cents": 498.0
      },
      {
        "t_ms": 275,
        "cents": 558.0
      },
      {
        "t_ms": 330,
        "cents": 498.0
      },
      {
        "t_ms": 385,
        "cents": 438.0
      },
      {
        "t_ms": 440,
        "cents": 498.0
      },
      {
        "t_ms": 495,
        "cents": 558.0
      },
      {
        "t_ms": 550,
        "cents": 498.0
      },
      {
        "t_ms": 605,
        "cents": 438.0
      },
      {
        "t_ms": 660,
        "cents": 498.0
      },
      {
        "t_ms": 715,
        "cents": 558.0
      },
      {
        "t_ms": 770,
        "cents": 498.0
      },
      {
        "t_ms": 825,
        "cents": 438.0
      },
      {
        "t_ms": 880,
        "cents": 498.0
      }
    ],
    "waypoints": [
      {
        "t_ms": 110,
        "cents": 498.0,
        "star_index": 1
      },
      {
        "t_ms": 330,
        "cents": 498.0,
        "star_index": 2
      },
      {
        "t_ms": 550,
        "cents": 498.0,
        "star_index": 3
      },
      {
        "t_ms": 770,
        "cents": 498.0,
        "star_index": 4
      },
      {
        "t_ms": 900,
        "cents": 498.0,
        "star_index": 5
      }
    ]
  },
  {
    "id": "gamaka_L2_02",
    "title": "Exercise 2: The Downward Stress Flick (N\u014dkku)",
    "level": "intermediate",
    "ornamentType": "N\u014dkku (Downward Strike / Head Accent)",
    "notationSymbol": "^",
    "raga": "\u015aa\u1e45kar\u0101bhara\u1e47am (#29)",
    "pronunciationCue": "Vocalize with sudden gentle stress from the upper note without sliding. Like tapping a drumhead.",
    "avatar": "Golden Arrow (B\u0101na)",
    "theme": "Archery Arrow Target Release",
    "toleranceCents": 35.0,
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 498.0
      },
      {
        "t_ms": 25,
        "cents": 475.0
      },
      {
        "t_ms": 75,
        "cents": 386.0
      },
      {
        "t_ms": 500,
        "cents": 386.0
      }
    ],
    "waypoints": [
      {
        "t_ms": 50,
        "cents": 386.0,
        "star_index": 1
      },
      {
        "t_ms": 230,
        "cents": 498.0,
        "star_index": 2
      },
      {
        "t_ms": 400,
        "cents": 386.0,
        "star_index": 3
      }
    ]
  },
  {
    "id": "gamaka_L2_03",
    "title": "Exercise 3: The Deflection Curve (Orika / Odigimpu)",
    "level": "intermediate",
    "ornamentType": "Orika (Deflected Curve)",
    "notationSymbol": "\u2312",
    "raga": "Harik\u0101mbh\u014dji (#28)",
    "pronunciationCue": "A graceful flip of the voice that catches the higher \u015bruti for a split second on descent.",
    "avatar": "Hummingbird",
    "theme": "Hummingbird Nectar Sip",
    "toleranceCents": 35.0,
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 702.0
      },
      {
        "t_ms": 150,
        "cents": 702.0
      },
      {
        "t_ms": 200,
        "cents": 884.0
      },
      {
        "t_ms": 260,
        "cents": 702.0
      },
      {
        "t_ms": 600,
        "cents": 498.0
      }
    ],
    "waypoints": [
      {
        "t_ms": 80,
        "cents": 498.0,
        "star_index": 1
      },
      {
        "t_ms": 170,
        "cents": 702.0,
        "star_index": 2
      },
      {
        "t_ms": 350,
        "cents": 498.0,
        "star_index": 3
      }
    ]
  },
  {
    "id": "gamaka_L2_04",
    "title": "Exercise 4: The Pendulum Arc (\u0100ndolitam)",
    "level": "intermediate",
    "ornamentType": "\u0100ndolitam (Swinging Swing)",
    "notationSymbol": "~~",
    "raga": "Kharaharapriy\u0101 (#22)",
    "pronunciationCue": "Sing like the heavy swing of a temple bell. Smooth, rounded pendulum curves with zero angularity.",
    "avatar": "Silver Swing",
    "theme": "The Royal Garden Swing (Dol\u0101)",
    "toleranceCents": 35.0,
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 884.0
      },
      {
        "t_ms": 400,
        "cents": 1018.0
      },
      {
        "t_ms": 800,
        "cents": 884.0
      },
      {
        "t_ms": 1200,
        "cents": 702.0
      },
      {
        "t_ms": 1600,
        "cents": 884.0
      }
    ],
    "waypoints": [
      {
        "t_ms": 100,
        "cents": 498.0,
        "star_index": 1
      },
      {
        "t_ms": 300,
        "cents": 702.0,
        "star_index": 2
      },
      {
        "t_ms": 600,
        "cents": 316.0,
        "star_index": 3
      },
      {
        "t_ms": 900,
        "cents": 498.0,
        "star_index": 4
      }
    ]
  },
  {
    "id": "gamaka_L3_01",
    "title": "Masterwork 1: The Plaintive Oscillation of Hanumatodi (Mela #8)",
    "level": "expert",
    "ornamentType": "Wide Microtonal Kampitam",
    "notationSymbol": "g~",
    "raga": "Hanumatodi (#8)",
    "pronunciationCue": "Engage deep chest resonance. Begin oscillation from Suddha Rishabha and stretch the microtone upward without letting it touch static Western minor 3rd.",
    "avatar": "Veena Master String",
    "theme": "Hanumatodi Sunset Contemplation",
    "toleranceCents": 35.0,
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 112.0
      },
      {
        "t_ms": 250,
        "cents": 485.0
      },
      {
        "t_ms": 500,
        "cents": 130.0
      },
      {
        "t_ms": 750,
        "cents": 490.0
      },
      {
        "t_ms": 1000,
        "cents": 120.0
      },
      {
        "t_ms": 1250,
        "cents": 480.0
      },
      {
        "t_ms": 1500,
        "cents": 112.0
      }
    ],
    "waypoints": [
      {
        "t_ms": 200,
        "cents": 498.0,
        "star_index": 1
      },
      {
        "t_ms": 500,
        "cents": 204.0,
        "star_index": 2
      },
      {
        "t_ms": 800,
        "cents": 498.0,
        "star_index": 3
      },
      {
        "t_ms": 1200,
        "cents": 316.0,
        "star_index": 4
      }
    ]
  },
  {
    "id": "gamaka_L3_02",
    "title": "Masterwork 2: The Piercing Prati Madhyama Shake of Mechakaly\u0101\u1e47i (#65)",
    "level": "expert",
    "ornamentType": "T\u012bvra Kampitam with J\u0101ru Ascent",
    "notationSymbol": "M2~ / P",
    "raga": "M\u0113cakaly\u0101\u1e47i (#65)",
    "pronunciationCue": "Sing with cranial mask resonance behind forehead. Keep the pitch razor-sharp and pull upward smoothly into Panchama.",
    "avatar": "Golden Lightning Bolt",
    "theme": "Kaly\u0101\u1e47i Mountain Lightning",
    "toleranceCents": 35.0,
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 590.0
      },
      {
        "t_ms": 100,
        "cents": 635.0
      },
      {
        "t_ms": 200,
        "cents": 560.0
      },
      {
        "t_ms": 300,
        "cents": 635.0
      },
      {
        "t_ms": 400,
        "cents": 560.0
      },
      {
        "t_ms": 600,
        "cents": 620.0
      },
      {
        "t_ms": 800,
        "cents": 660.0
      },
      {
        "t_ms": 1200,
        "cents": 702.0
      }
    ],
    "waypoints": [
      {
        "t_ms": 150,
        "cents": 702.0,
        "star_index": 1
      },
      {
        "t_ms": 400,
        "cents": 590.0,
        "star_index": 2
      },
      {
        "t_ms": 650,
        "cents": 702.0,
        "star_index": 3
      },
      {
        "t_ms": 950,
        "cents": 590.0,
        "star_index": 4
      }
    ]
  },
  {
    "id": "gamaka_L3_03",
    "title": "Masterwork 3: The Signature Loop of \u0100nandabhairavi",
    "level": "expert",
    "ornamentType": "Vakra Loop with Orika (S G2 R2 G2 M1 P)",
    "notationSymbol": "s g~ r g~ m p",
    "raga": "\u0100nandabhairavi (Janya of #20)",
    "pronunciationCue": "Never articulate linear S-R-G; gracefully pivot the pitch around Rishabha with slight nasal resonance.",
    "avatar": "Sacred Serpent Arc (N\u0101ga Keli)",
    "theme": "The Sacred Temple Coil of \u0100nandabhairavi",
    "toleranceCents": 35.0,
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 0.0
      },
      {
        "t_ms": 350,
        "cents": 340.0
      },
      {
        "t_ms": 500,
        "cents": 204.0
      },
      {
        "t_ms": 850,
        "cents": 350.0
      },
      {
        "t_ms": 1200,
        "cents": 498.0
      },
      {
        "t_ms": 1600,
        "cents": 702.0
      },
      {
        "t_ms": 2000,
        "cents": 702.0
      }
    ],
    "waypoints": [
      {
        "t_ms": 100,
        "cents": 0.0,
        "star_index": 1
      },
      {
        "t_ms": 300,
        "cents": 316.0,
        "star_index": 2
      },
      {
        "t_ms": 500,
        "cents": 204.0,
        "star_index": 3
      },
      {
        "t_ms": 700,
        "cents": 316.0,
        "star_index": 4
      },
      {
        "t_ms": 950,
        "cents": 498.0,
        "star_index": 5
      },
      {
        "t_ms": 1200,
        "cents": 702.0,
        "star_index": 6
      }
    ]
  },
  {
    "id": "gamaka_L3_04",
    "title": "Masterwork 4: The Regal Begada Madhyama Shake",
    "level": "expert",
    "ornamentType": "T\u012bvratara Kampitam (Characteristic Prayoga)",
    "notationSymbol": "M1~~",
    "raga": "Bega\u1e0da (Janya of #29)",
    "pronunciationCue": "A bold, majestic shake. Hold firm breath pressure while letting the pitch cycle through its traditional Begada curve.",
    "avatar": "Royal Sceptre",
    "theme": "Bega\u1e0da Royal Court Sceptre",
    "toleranceCents": 35.0,
    "trajectory": [
      {
        "t_ms": 0,
        "cents": 450.0
      },
      {
        "t_ms": 200,
        "cents": 580.0
      },
      {
        "t_ms": 400,
        "cents": 470.0
      },
      {
        "t_ms": 600,
        "cents": 585.0
      },
      {
        "t_ms": 800,
        "cents": 475.0
      },
      {
        "t_ms": 1000,
        "cents": 590.0
      },
      {
        "t_ms": 1300,
        "cents": 498.0
      },
      {
        "t_ms": 1600,
        "cents": 386.0
      }
    ],
    "waypoints": [
      {
        "t_ms": 120,
        "cents": 702.0,
        "star_index": 1
      },
      {
        "t_ms": 350,
        "cents": 540.0,
        "star_index": 2
      },
      {
        "t_ms": 600,
        "cents": 702.0,
        "star_index": 3
      },
      {
        "t_ms": 850,
        "cents": 540.0,
        "star_index": 4
      },
      {
        "t_ms": 1100,
        "cents": 498.0,
        "star_index": 5
      }
    ]
  }
];
