export const CHAKRA_NAMES = ["Indu","Netra","Agni","Veda","Bāṇa","Rutu","Ṛṣi","Vasu","Brahma","Dīśā","Rudra","Āditya"]

import type { Melakarta } from '../types/index'


// 72 Melakarta Rāgas — semitone values relative to Sa (tonic = 0)
// Canonical 12-semitone positions: R1=1, R2=2, R3=3; G1=2, G2=3, G3=4.
// R2/G1 and R3/G2 are enharmonic in the equal-tempered semitone model.
// M1=5(Śuddha), M2=6(Prati); D1=8, D2=9, D3=10; N1=9, N2=10, N3=11

export { CHAKRA_NAMES as CHAKRA_NAMES_TALAS }

const CN = ['Indu','Netra','Agni','Veda','Bāṇa','Rutu','Ṛṣi','Vasu','Brahma','Dīśā','Rudra','Āditya']

function m(number: number, name: string, devanagari: string, telugu: string, R: number, G: number, M: number, D: number, N: number): Melakarta {
  const chakra = Math.ceil(number / 6)
  const ascending = ['S', `R${R}`, `G${G}`, M===5?'M1':'M2', 'P', `D${D}`, `N${N}`, 'S.']
  const descending = ['S.', `N${N}`, `D${D}`, 'P', M===5?'M1':'M2', `G${G}`, `R${R}`, 'S']
  return {
    number, name, nameDevanagari:devanagari, nameTelugu:telugu,
    chakra, chakraName: CN[chakra-1],
    notes:{ R: [0,1,2,3][R] ?? 2, G: [0,2,3,4][G] ?? 4, M, D: [0,0,0,0,0,0,0,0,8,9,10][D] ?? 9, N: [0,0,0,0,0,0,0,0,0,9,10,11][N] ?? 11 },
    ascending, descending
  }
}

// Semitone lookup
const RSemi = [0,1,2,3]      // R1=1,R2=2,R3=3
const GSemi = [0,2,3,4]      // G1=2 (R2 position), G2=3 (R3 position), G3=4
const DSemi = [0,0,0,0,0,0,0,0,8,9,10] // D1=8,D2=9,D3=10
const NSemi = [0,0,0,0,0,0,0,0,0,9,10,11] // N1=9,N2=10,N3=11

function mel(number:number,name:string,dev:string,tel:string,R:number,G:number,M:number,D:number,N:number): Melakarta {
  const chakra = Math.ceil(number/6)
  const asc = ['S', R===1?'R1':R===2?'R2':'R3', G===1?'G1':G===2?'G2':'G3', M===5?'M1':'M2', 'P', D===8?'D1':D===9?'D2':'D3', N===9?'N1':N===10?'N2':'N3', 'S.']
  const desc = [...asc].reverse()
  return {
    number, name, nameDevanagari:dev, nameTelugu:tel,
    chakra, chakraName:CN[chakra-1],
    notes:{R:R===1?1:R===2?2:3, G:G===1?2:G===2?3:4, M, D:D===8?8:D===9?9:10, N:N===9?9:N===10?10:11},
    ascending:asc, descending:desc
  }
}

// The 72 Melakartas — (number, name, devanagari, telugu, R, G, M, D, N)
// R,G params here: 1=R1/G1, 2=R2/G2, 3=R3/G3
// M: 5=M1(Shuddha), 6=M2(Prati)
// D: 8=D1, 9=D2, 10=D3
// N: 9=N1, 10=N2, 11=N3
export const MELAKARTAS: Melakarta[] = [
  mel(1,'Kanakaṅgi','कनकांगी','కనకాంగి',1,1,5,8,9),
  mel(2,'Ratnāṅgi','रत्नांगी','రత్నాంగి',1,1,5,8,10),
  mel(3,'Gānamūrti','गानमूर्ति','గానమూర్తి',1,1,5,8,11),
  mel(4,'Vanaspati','वनस्पति','వనస్పతి',1,1,5,9,10),
  mel(5,'Mānavati','मानवती','మానవతి',1,1,5,9,11),
  mel(6,'Tānarūpi','तानरूपी','తానరూపి',1,1,5,10,11),
  mel(7,'Senāvati','सेनावती','సేనావతి',1,2,5,8,9),
  mel(8,'Hanumatōḍi','हनुमतोडि','హనుమతోడి',1,2,5,8,10),
  mel(9,'Dhēnuka','धेनुका','ధేనుక',1,2,5,8,11),
  mel(10,'Nāṭakapriya','नाटकप्रिया','నాటకప్రియ',1,2,5,9,10),
  mel(11,'Kōkilapriya','कोकिलप्रिया','కోకిలప్రియ',1,2,5,9,11),
  mel(12,'Rūpavati','रूपवती','రూపవతి',1,2,5,10,11),
  mel(13,'Gāyakapriya','गायकप्रिया','గాయకప్రియ',1,3,5,8,9),
  mel(14,'Vakulābharaṇam','वकुलाभरणम्','వకులాభరణం',1,3,5,8,10),
  mel(15,'Māyāmāḷavagauḷa','मायामालवगौळ','మాయామాళవగౌళ',1,3,5,8,11),
  mel(16,'Chakravākam','चक्रवाकम्','చక్రవాకం',1,3,5,9,10),
  mel(17,'Sūryakāntam','सूर्यकांतम्','సూర్యకాంతం',1,3,5,9,11),
  mel(18,'Hāṭakāmbari','हाटकांबरी','హాటకాంబరి',1,3,5,10,11),
  mel(19,'Jhankāradhvani','झंकारध्वनि','జంకారధ్వని',2,2,5,8,9),
  mel(20,'Naṭabhairavi','नटभैरवी','నటభైరవి',2,2,5,8,10),
  mel(21,'Kiravāṇi','किरवाणि','కిరవాణి',2,2,5,8,11),
  mel(22,'Kharaharapriya','खरहरप्रिया','ఖరహరప్రియ',2,2,5,9,10),
  mel(23,'Gaurimanohari','गौरीमनोहरी','గౌరీమనోహరి',2,2,5,9,11),
  mel(24,'Varuṇapriya','वरुणप्रिया','వరుణప్రియ',2,2,5,10,11),
  mel(25,'Māraranjani','मारारंजनी','మారారంజని',2,3,5,8,9),
  mel(26,'Chārukēśi','चारुकेशी','చారుకేశి',2,3,5,8,10),
  mel(27,'Sarasāṅgi','सरसांगी','సరసాంగి',2,3,5,8,11),
  mel(28,'Harikāmbhōji','हरिकांभोजी','హరికాంభోజి',2,3,5,9,10),
  mel(29,'Dhīraśankarābharaṇam','धीरशंकराभरणम्','ధీరశంకరాభరణం',2,3,5,9,11),
  mel(30,'Nāgānandini','नागानंदिनी','నాగానందిని',2,3,5,10,11),
  mel(31,'Yāgapriya','यागप्रिया','యాగప్రియ',3,3,5,8,9),
  mel(32,'Rāgavardhini','रागवर्धिनी','రాగవర్ధిని',3,3,5,8,10),
  mel(33,'Gāngēyabhūṣaṇi','गांगेयभूषणी','గాంగేయభూషణి',3,3,5,8,11),
  mel(34,'Vāgadhīśvari','वागधीश्वरी','వాగధీశ్వరి',3,3,5,9,10),
  mel(35,'Śūlinī','शूलिनी','శూలిని',3,3,5,9,11),
  mel(36,'Chalanāṭa','चलनाट','చలనాట',3,3,5,10,11),
  mel(37,'Sālagam','सालगम्','సాలగం',1,1,6,8,9),
  mel(38,'Jalārṇavam','जलार्णवम्','జలార్ణవం',1,1,6,8,10),
  mel(39,'Jhālavarāḷi','झालवराळि','ఝాలవరాళి',1,1,6,8,11),
  mel(40,'Navanītam','नवनीतम्','నవనీతం',1,1,6,9,10),
  mel(41,'Pāvani','पावनी','పావని',1,1,6,9,11),
  mel(42,'Raghupriya','रघुप्रिया','రఘుప్రియ',1,1,6,10,11),
  mel(43,'Gavāmbhodi','गवांभोदि','గవాంభోది',1,2,6,8,9),
  mel(44,'Bhavapriya','भवप्रिया','భవప్రియ',1,2,6,8,10),
  mel(45,'Śubhapantuvarāḷi','शुभपंतुवराळि','శుభపంతువరాళి',1,2,6,8,11),
  mel(46,'Ṣaḍvidhamārgini','षड्विधमार्गिनी','షడ్విధమార్గిని',1,2,6,9,10),
  mel(47,'Suvarnāṅgi','सुवर्णांगी','సువర్ణాంగి',1,2,6,9,11),
  mel(48,'Divyamaṇi','दिव्यमणि','దివ్యమణి',1,2,6,10,11),
  mel(49,'Dhavaḷāmbari','धवलांबरी','ధవళాంబరి',1,3,6,8,9),
  mel(50,'Nāmanārāyaṇi','नामनारायणी','నామనారాయణి',1,3,6,8,10),
  mel(51,'Kāmavardhini','कामवर्धिनी','కామవర్ధిని',1,3,6,8,11),
  mel(52,'Rāmapriya','रामप्रिया','రామప్రియ',1,3,6,9,10),
  mel(53,'Gamanāśrama','गमनश्रम','గమనాశ్రమ',1,3,6,9,11),
  mel(54,'Viśvambhari','विश्वंभरी','విశ్వంభరి',1,3,6,10,11),
  mel(55,'Śyāmalāṅgi','श्यामलांगी','శ్యామలాంగి',2,2,6,8,9),
  mel(56,'Ṣanmukhapriya','षण्मुखप्रिया','షణ్ముఖప్రియ',2,2,6,8,10),
  mel(57,'Siṃhendramadhyamam','सिंहेंद्रमध्यमम्','సింహేంద్రమధ్యమం',2,2,6,8,11),
  mel(58,'Hemavati','हेमवती','హేమవతి',2,2,6,9,10),
  mel(59,'Dharmavati','धर्मवती','ధర్మవతి',2,2,6,9,11),
  mel(60,'Nītimatī','नीतिमती','నీతిమతి',2,2,6,10,11),
  mel(61,'Kāntāmaṇi','कांतामणि','కాంతామణి',2,3,6,8,9),
  mel(62,'Riṣabhapriya','ऋषभप्रिया','రిషభప్రియ',2,3,6,8,10),
  mel(63,'Latāṅgi','लतांगी','లతాంగి',2,3,6,8,11),
  mel(64,'Vācaspati','वाचस्पति','వాచస్పతి',2,3,6,9,10),
  mel(65,'Mechakālyāṇi','मेचकल्याणी','మేచకల్యాణి',2,3,6,9,11),
  mel(66,'Chitrāmbari','चित्रांबरी','చిత్రాంబరి',2,3,6,10,11),
  mel(67,'Sucharitra','सुचरित्र','సుచరిత్ర',3,3,6,8,9),
  mel(68,'Jyōtiṣmaṭī','ज्योतिष्मती','జ్యోతిష్మతి',3,3,6,8,10),
  mel(69,'Dhātu vardhani','धातुवर्धनी','ధాతువర్ధని',3,3,6,8,11),
  mel(70,'Nāsikabhūṣaṇi','नासिकाभूषणी','నాసికాభూషణి',3,3,6,9,10),
  mel(71,'Kosalam','कोसलम्','కోసలం',3,3,6,9,11),
  mel(72,'Rasikapriya','रसिकप्रिया','రసికప్రియ',3,3,6,10,11),
]
