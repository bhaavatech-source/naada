import type { Tala, Nadai } from '../types/index'

export const TALAS: Tala[] = [
  {
    id:'adi', name:'Ādi Tāla', nameTelugu:'ఆది తాళం', nameTamil:'ஆதி தாளம்',
    beats:8, samBeats:[0,4,6], angaLabels:['1','2','3','4','|','5','6','|'],
    structure:'Laghu(4) + Dhrutam(2) + Dhrutam(2)',
    description:'The most common tāla in Carnatic music. 8 beats: 4-beat laghu followed by two 2-beat dhrutams. Most kīrtanas and compositions are set in Adi Tāla.',
    hindustaniEquivalent:'Tīntāla (16 beats) or Kehrwā (8 beats)',
  },
  {
    id:'rupaka', name:'Rūpaka Tāla', nameTelugu:'రూపక తాళం', nameTamil:'ரூபக தாளம்',
    beats:6, samBeats:[0,2,4], angaLabels:['1','2','|','3','4','|'],
    structure:'Dhrutam(2) + Laghu(4)',
    description:'6-beat tāla starting with a Dhrutam. Common in devotional and lighter compositions. The 6-beat structure gives it a gently flowing character.',
    hindustaniEquivalent:'Dādrā (6 beats)',
  },
  {
    id:'khanda_capu', name:'Khaṇḍa Cāpu', nameTelugu:'ఖండ చాపు', nameTamil:'கண்ட சாபு',
    beats:5, samBeats:[0,2], angaLabels:['1','2','|','3','4','5'],
    structure:'2+3 (Tisra Gati + Khaṇḍa)',
    description:'5-beat capu tāla split as 2+3. Capu tālas have no explicit hand gestures — the beat is felt internally. Common in medium-paced kīrtanas.',
    hindustaniEquivalent:'Jhaptāl (10 beats, 2:3 feel)',
  },
  {
    id:'misra_capu', name:'Miśra Cāpu', nameTelugu:'మిశ్ర చాపు', nameTamil:'மிஶ்ர சாபு',
    beats:7, samBeats:[0,3], angaLabels:['1','2','3','|','4','5','6','7'],
    structure:'3+4 (Tisra + Catuśra)',
    description:'7-beat capu tāla split as 3+4. Popular for many Tyāgarāja and Muttusvāmi Dīkṣitar compositions.',
    hindustaniEquivalent:'Rūpak (7 beats)',
  },
  {
    id:'tisra_triputa', name:'Tiśra Tripuṭa', nameTelugu:'తిశ్ర త్రిపుట', nameTamil:'திஸ்ர த்ரிபுட',
    beats:7, samBeats:[0,3,5], angaLabels:['1','2','3','|','4','5','|'],
    structure:'Laghu(3) + Dhrutam(2) + Dhrutam(2)',
    description:'7-beat tāla based on a 3-count laghu. The jathi is Tisra. Foundation of the Ādi tāla family with Tisra count.',
    hindustaniEquivalent:'Tīntāla with Tisra gati',
  },
  {
    id:'ata', name:'Āṭa Tāla', nameTelugu:'ఆట తాళం', nameTamil:'ஆட தாளம்',
    beats:14, samBeats:[0,5,10,12], angaLabels:['1','2','3','4','5','|','6','7','8','9','10','|','11','12','|'],
    structure:'Laghu(5) + Laghu(5) + Dhrutam(2) + Dhrutam(2)',
    description:'A grand 14-beat tāla used in classical compositions of great complexity. The full Āṭa tāla is rare in performance but foundational in study.',
    hindustaniEquivalent:'Caution/Ektāla variants',
  },
]

export const NADAIS: Nadai[] = [
  { id:'tisra',    name:'Tiśra',    count:3, solkattu:'Ta Ki Ta' },
  { id:'catusra',  name:'Catuśra',  count:4, solkattu:'Ta Ka Di Mi' },
  { id:'khanda',   name:'Khaṇḍa',  count:5, solkattu:'Ta Ka Ta Ki Ta' },
  { id:'misra',    name:'Miśra',    count:7, solkattu:'Ta Ka Di Mi Ta Ki Ta' },
  { id:'sankeerna',name:'Saṃkīrṇa', count:9, solkattu:'Ta Ka Di Mi Ta Ka Ta Ki Ta' },
]

export const CHAKRA_NAMES = ['Indu','Netra','Agni','Veda','Bāṇa','Rutu','Ṛṣi','Vasu','Brahma','Dīśā','Rudra','Āditya']
