
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
  {
    id: 'nios-carnatic',
    title: 'NIOS — Carnatic Music',
    category: 'Basics',
    level: 'Beginner',
    description:
      'Explore Carnatic music learning materials from India’s open schooling system.',
    url: 'https://rcchennai.nios.ac.in/carnatic-music-243.html',
    task:
      'Study one introductory topic and note three concepts you want to practise.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Free-access educational resource',
  },
  {
    id: 'vidya-free-lessons',
    title: 'Vidya Subramanian — Free Lessons',
    category: 'Basics',
    level: 'Beginner',
    description:
      'Explore self-study lessons and demonstrations for Carnatic music.',
    url: 'https://www.vidyasubramanian.com/freelessons',
    task:
      'Study one lesson and reproduce a short swara pattern from it.',
    practiceModule: 'builder',
    practiceLabel: 'Open Music Builder',
    accessNote: 'Free lessons; check individual page availability',
  },
  {
    id: '7swara-lessons',
    title: '7Swara — Music Lessons',
    category: 'Basics',
    level: 'Beginner',
    description:
      'Explore lessons on foundational Carnatic music exercises.',
    url: 'https://www.7swara.com/lessons',
    task:
      'Study one exercise and identify its ascending and descending patterns.',
    practiceModule: 'builder',
    practiceLabel: 'Open Music Builder',
    accessNote: 'Verify free access to the selected lesson',
  },
  {
    id: 'carnaticstudent',
    title: 'CarnaticStudent',
    category: 'Rāga',
    level: 'All levels',
    description:
      'Explore educational articles and learning material about Carnatic music.',
    url: 'https://www.carnaticstudent.org/',
    task:
      'Choose one concept and write a short summary before practising.',
    practiceModule: 'raga',
    practiceLabel: 'Open Rāga Library',
    accessNote: 'Free-access material may vary by page',
  },
  {
    id: 'imusic',
    title: 'iMusic — Indian Music Learning',
    category: 'Rhythm',
    level: 'All levels',
    description:
      'Explore Indian music concepts and educational material.',
    url: 'https://iamsiva.com/music/',
    task:
      'Study one rhythm or musical concept and identify what you heard or learned.',
    practiceModule: 'tala',
    practiceLabel: 'Open Tāla Trainer',
    accessNote: 'Verify free access to the selected material',
  },
  {
    id: 'sangeethapriya',
    title: 'Sangeethapriya — Concert Archive',
    category: 'Listening',
    level: 'Intermediate',
    description:
      'Listen to performances on the external website and practise attentive listening.',
    url: 'https://www.sangeethapriya.org/',
    task:
      'Listen to a performance and try to identify its rāga, rhythmic cycle, or a recurring phrase.',
    practiceModule: 'tala',
    practiceLabel: 'Open Tāla Trainer',
    accessNote:
      'External listening only; respect the archive’s terms and restrictions',
  },
]
