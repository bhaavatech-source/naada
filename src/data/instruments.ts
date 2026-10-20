import type { InstrumentId } from '../types/index'

export interface Instrument {
  id: InstrumentId
  label: string
  icon: string
  category: 'melodic' | 'percussion'
  origin: string
  description: string
  color?: string
}

export const INSTRUMENTS: Instrument[] = [
  { id:'voice',      label:'Human Voice',  icon:'🎤', category:'melodic',    origin:'Universal',   description:'The primary instrument in Carnatic music — direct, expressive, supremely nuanced.' },
  { id:'veena',      label:'Vīṇā',         icon:'🪕', category:'melodic',    origin:'South India', description:'Queen of all instruments in Carnatic music. Plucked string with resonator gourd.' },
  { id:'violin',     label:'Violin',       icon:'🎻', category:'melodic',    origin:'Adapated',    description:'Adopted into Carnatic music in the 18th century; played sitting, held between shoulder and ankle.' },
  { id:'flute',      label:'Vāṃśī (Flute)',icon:'🎶', category:'melodic',    origin:'South India', description:'Bamboo side-blown flute (Bāṃsurī in North). Produces a serene, breathy tone.' },
  { id:'sitar',      label:'Sitar',        icon:'🎸', category:'melodic',    origin:'North India', description:'Long-necked plucked string instrument with sympathetic resonance strings. Hindustani classical.' },
  { id:'harmonium',  label:'Harmonium',    icon:'🪗', category:'melodic',    origin:'Adapted',     description:'Reed organ pumped by bellows. Widely used for bhajans, kirtanas, and devotional music.' },
  { id:'piano',      label:'Piano',        icon:'🎹', category:'melodic',    origin:'Western',     description:'88-key keyboard; useful for teaching intervals and scale structures visually.' },
  { id:'nadaswaram', label:'Nādasvāram',   icon:'📯', category:'melodic',    origin:'South India', description:'Double-reed wind instrument; the primary ensemble instrument in Carnatic temple music.' },
  { id:'sarangi',    label:'Sāraṅgī',      icon:'🎻', category:'melodic',    origin:'North India', description:'Short-necked bowed string instrument; the primary accompaniment instrument in Hindustani classical.' },
]
