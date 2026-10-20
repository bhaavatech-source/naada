export type AppModule = 'home' | 'raga' | 'janya' | 'tala' | 'shruti' | 'gamaka' | 'resources' | 'builder' | 'progress' | 'about'

export type InstrumentId = 'veena' | 'violin' | 'flute' | 'sitar' | 'harmonium' | 'piano' | 'nadaswaram' | 'sarangi' | 'voice'

export interface AppSettings {
  tonicHz: number
  bpm: number
  volume: number
  instrument: InstrumentId
  theme: 'dark' | 'light'
  language: 'english' | 'telugu' | 'sanskrit'
}

export interface Melakarta {
  number: number
  name: string
  nameDevanagari: string
  nameTelugu: string
  chakra: number
  chakraName: string
  notes: { R: number; G: number; M: number; D: number; N: number }
  ascending: string[]
  descending: string[]
}

export interface Tala {
  id: string
  name: string
  nameTelugu: string
  nameTamil: string
  beats: number
  samBeats: number[]
  angaLabels: string[]
  structure: string
  description: string
  hindustaniEquivalent: string
}

export interface Nadai {
  id: string
  name: string
  count: number
  solkattu: string
}

export interface Kirtana {
  id: string
  name: string
  nameDevanagari?: string
  composer: string
  raga: string
  tala: string
  language: string
  century?: number
  description: string
  svaraNotation: string
  lyrics: string
  meaningBrief?: string
}

