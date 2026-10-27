import type { Tala, Nadai } from '../types/index'

export const TALAS: Tala[] = [
  {
    id:'adi', name:'Ādi Tāla', nameTelugu:'ఆది తాళం', nameTamil:'ஆதி தாளம்',
    family:'adi', angas:[{kind:'laghu',count:4},{kind:'drutam',count:2},{kind:'drutam',count:2}],
    beats:8, samBeats:[0,4,6], angaLabels:['1','2','3','4','|','5','6','|'],
    structure:'Laghu(4) + Dhrutam(2) + Dhrutam(2)',
    description:'The most common tāla in Carnatic music. 8 beats: 4-beat laghu followed by two 2-beat dhrutams. Most kīrtanas and compositions are set in Adi Tāla.',
    hindustaniEquivalent:'Tīntāla (16 beats) or Kehrwā (8 beats)',
  },
  {
    id:'rupaka', name:'Rūpaka Tāla', nameTelugu:'రూపక తాళం', nameTamil:'ரூபக தாளம்',
    family:'sapta', angas:[{kind:'drutam',count:2},{kind:'laghu',count:4}],
    beats:6, samBeats:[0,2], angaLabels:['1','2','|','3','4','5','6'],
    structure:'Dhrutam(2) + Laghu(4)',
    description:'6-beat tāla starting with a Dhrutam. Common in devotional and lighter compositions. The 6-beat structure gives it a gently flowing character.',
    hindustaniEquivalent:'Dādrā (6 beats)',
  },
  {
    id:'khanda_capu', name:'Khaṇḍa Cāpu', nameTelugu:'ఖండ చాపు', nameTamil:'கண்ட சாபு',
    family:'capu', angas:[{kind:'group',count:2},{kind:'group',count:3}],
    beats:5, samBeats:[0,2], angaLabels:['1','2','|','3','4','5'],
    structure:'2+3 (simplified pulse grouping)',
    description:'Five-pulse Cāpu cycle shown as 2+3. Hand gestures and accent patterns depend on the composition and teaching tradition; this equal-pulse grid is a learning aid.',
    hindustaniEquivalent:'Jhaptāl (10 beats, 2:3 feel)',
  },
  {
    id:'misra_capu', name:'Miśra Cāpu', nameTelugu:'మిశ్ర చాపు', nameTamil:'மிஶ்ர சாபு',
    family:'capu', angas:[{kind:'group',count:3},{kind:'group',count:4}],
    beats:7, samBeats:[0,3], angaLabels:['1','2','3','|','4','5','6','7'],
    structure:'3+4 (Tisra + Catuśra)',
    description:'7-beat capu tāla split as 3+4. Popular for many Tyāgarāja and Muttusvāmi Dīkṣitar compositions.',
    hindustaniEquivalent:'Rūpak (7 beats)',
  },
  {
    id:'tisra_triputa', name:'Tiśra Tripuṭa', nameTelugu:'తిశ్ర త్రిపుట', nameTamil:'திஸ்ர த்ரிபுட',
    family:'sapta', angas:[{kind:'laghu',count:3},{kind:'drutam',count:2},{kind:'drutam',count:2}],
    beats:7, samBeats:[0,3,5], angaLabels:['1','2','3','|','4','5','|'],
    structure:'Laghu(3) + Dhrutam(2) + Dhrutam(2)',
    description:'7-beat tāla based on a 3-count laghu. The jathi is Tisra. Foundation of the Ādi tāla family with Tisra count.',
    hindustaniEquivalent:'Tīntāla with Tisra gati',
  },
  {
    id:'ata', name:'Āṭa Tāla', nameTelugu:'ఆట తాళం', nameTamil:'ஆட தாளம்',
    family:'sapta', angas:[{kind:'laghu',count:5},{kind:'laghu',count:5},{kind:'drutam',count:2},{kind:'drutam',count:2}],
    beats:14, samBeats:[0,5,10,12], angaLabels:['1','2','3','4','5','|','6','7','8','9','10','|','11','12','|'],
    structure:'Laghu(5) + Laghu(5) + Dhrutam(2) + Dhrutam(2)',
    description:'A grand 14-beat tāla used in classical compositions of great complexity. The full Āṭa tāla is rare in performance but foundational in study.',
    hindustaniEquivalent:'Caution/Ektāla variants',
  },
  {
    id:'dhruva', name:'Dhruva Tāla', nameTelugu:'ధ్రువ తాళం', nameTamil:'துருவ தாளம்',
    family:'sapta', angas:[{kind:'laghu',count:4},{kind:'drutam',count:2},{kind:'laghu',count:4},{kind:'laghu',count:4}],
    beats:14, samBeats:[0,4,6,10], angaLabels:['1','2','3','4','5','6','7','8','9','10','11','12','13','14'],
    structure:'I₄ O I₄ I₄ · 4 + 2 + 4 + 4',
    description:'Chaturasra-jāti Dhruva: laghu, drutam, laghu, laghu. Each four-count laghu starts with a clap followed by little, ring and middle finger counts.',
    hindustaniEquivalent:'No exact equivalence',
  },
  {
    id:'matya', name:'Maṭya Tāla', nameTelugu:'మఠ్య తాళం', nameTamil:'மட்ய தாளம்',
    family:'sapta', angas:[{kind:'laghu',count:4},{kind:'drutam',count:2},{kind:'laghu',count:4}],
    beats:10, samBeats:[0,4,6], angaLabels:['1','2','3','4','5','6','7','8','9','10'],
    structure:'I₄ O I₄ · 4 + 2 + 4',
    description:'Chaturasra-jāti Maṭya: laghu, drutam, laghu. The laghu count is determined by jāti, independently of the nadai within each beat.',
    hindustaniEquivalent:'No exact equivalence',
  },
  {
    id:'jhampa', name:'Miśra Jhampa Tāla', nameTelugu:'మిశ్ర ఝంప తాళం', nameTamil:'மிஸ்ர ஜம்ப தாளம்',
    family:'sapta', angas:[{kind:'laghu',count:7},{kind:'anudrutam',count:1},{kind:'drutam',count:2}],
    beats:10, samBeats:[0,7,8], angaLabels:['1','2','3','4','5','6','7','8','9','10'],
    structure:'I₇ U O · 7 + 1 + 2',
    description:'Miśra-jāti Jhampa: a seven-count laghu, one anudrutam clap, then a drutam clap and wave. The illustrated laghu repeats little-to-index finger counting without using the thumb.',
    hindustaniEquivalent:'No exact equivalence',
  },
  {
    id:'eka', name:'Ēka Tāla', nameTelugu:'ఏక తాళం', nameTamil:'ஏக தாளம்',
    family:'sapta', angas:[{kind:'laghu',count:4}],
    beats:4, samBeats:[0], angaLabels:['1','2','3','4'],
    structure:'I₄ · 4',
    description:'Chaturasra-jāti Ēka consists of a single laghu: clap, little finger, ring finger and middle finger.',
    hindustaniEquivalent:'No exact equivalence',
  },
]

const SAPTA_ORDER = ['dhruva', 'matya', 'rupaka', 'jhampa', 'tisra_triputa', 'ata', 'eka']
export const SAPTA_TALAS = SAPTA_ORDER.map(id => TALAS.find(tala => tala.id === id)!)

export const NADAIS: Nadai[] = [
  { id:'tisra',    name:'Tiśra',    count:3, solkattu:'Ta Ki Ta' },
  { id:'catusra',  name:'Catuśra',  count:4, solkattu:'Ta Ka Di Mi' },
  { id:'khanda',   name:'Khaṇḍa',  count:5, solkattu:'Ta Ka Ta Ki Ta' },
  { id:'misra',    name:'Miśra',    count:7, solkattu:'Ta Ka Di Mi Ta Ki Ta' },
  { id:'sankeerna',name:'Saṃkīrṇa', count:9, solkattu:'Ta Ka Di Mi Ta Ka Ta Ki Ta' },
]

export const CHAKRA_NAMES = ['Indu','Netra','Agni','Veda','Bāṇa','Rutu','Ṛṣi','Vasu','Brahma','Dīśā','Rudra','Āditya']
