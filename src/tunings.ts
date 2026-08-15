export type NoteName =
  | 'C'
  | 'C#'
  | 'D'
  | 'D#'
  | 'E'
  | 'F'
  | 'F#'
  | 'G'
  | 'G#'
  | 'A'
  | 'A#'
  | 'B';

export interface Course {
  /** Display label, e.g. "6th (bass)" */
  label: string;
  note: NoteName;
  octave: number;
}

export interface TuningPreset {
  id: string;
  name: string;
  region: string;
  genre: string;
  /** Short tags used for genre filtering */
  genres: string[];
  description: string;
  courses: Course[];
  caution?: string;
}

const NOTE_TO_SEMITONE: Record<NoteName, number> = {
  C: 0,
  'C#': 1,
  D: 2,
  'D#': 3,
  E: 4,
  F: 5,
  'F#': 6,
  G: 7,
  'G#': 8,
  A: 9,
  'A#': 10,
  B: 11,
};

export function noteToFrequency(note: NoteName, octave: number): number {
  const midi = (octave + 1) * 12 + NOTE_TO_SEMITONE[note];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function frequencyToNote(freq: number): {
  note: NoteName;
  octave: number;
  cents: number;
} {
  const midi = 69 + 12 * Math.log2(freq / 440);
  const rounded = Math.round(midi);
  const cents = Math.round((midi - rounded) * 100);
  const noteNames = Object.keys(NOTE_TO_SEMITONE) as NoteName[];
  const note = noteNames[((rounded % 12) + 12) % 12];
  const octave = Math.floor(rounded / 12) - 1;
  return { note, octave, cents };
}

function course(label: string, note: NoteName, octave: number): Course {
  return { label, note, octave };
}

/** Courses listed low → high (bass → treble), as players usually number them. */
export const TUNINGS: TuningPreset[] = [
  {
    id: 'arabic-standard',
    name: 'Arabic Standard',
    region: 'Levant & Egypt',
    genre: 'Classical Arabic · Tarab',
    genres: ['Classical Arabic', 'Tarab'],
    description:
      'The most common modern Arabic six-course tuning. Warm, deep, and suited to maqam repertoire.',
    courses: [
      course('6 · bass', 'C', 2),
      course('5', 'F', 2),
      course('4', 'A', 2),
      course('3', 'D', 3),
      course('2', 'G', 3),
      course('1 · treble', 'C', 4),
    ],
  },
  {
    id: 'arabic-classical',
    name: 'Arabic Classical',
    region: 'Syria · Iraq · Egypt',
    genre: 'Classical · Old style',
    genres: ['Classical Arabic', 'Old style'],
    description:
      'An older Arabic pattern with open D and G drones — excellent for rast and related maqamat.',
    courses: [
      course('6 · bass', 'D', 2),
      course('5', 'G', 2),
      course('4', 'A', 2),
      course('3', 'D', 3),
      course('2', 'G', 3),
      course('1 · treble', 'C', 4),
    ],
  },
  {
    id: 'modern-arabic',
    name: 'Modern Arabic',
    region: 'Syria · Lebanon',
    genre: 'Contemporary · Solo',
    genres: ['Contemporary', 'Solo'],
    description:
      'A higher Arabic setup (F–F) favored by some modern players for brilliance and solo projection.',
    courses: [
      course('6 · bass', 'F', 2),
      course('5', 'A', 2),
      course('4', 'D', 3),
      course('3', 'G', 3),
      course('2', 'C', 4),
      course('1 · treble', 'F', 4),
    ],
  },
  {
    id: 'egyptian-five',
    name: 'Egyptian Five-Course',
    region: 'Egypt',
    genre: 'Folk · Shaabi · Classical',
    genres: ['Folk', 'Shaabi', 'Classical Arabic'],
    description:
      'Five paired courses without the lowest bass drone — agile and common on many Egyptian ouds.',
    courses: [
      course('5 · bass', 'G', 2),
      course('4', 'A', 2),
      course('3', 'D', 3),
      course('2', 'G', 3),
      course('1 · treble', 'C', 4),
    ],
  },
  {
    id: 'iraqi',
    name: 'Iraqi',
    region: 'Iraq',
    genre: 'Iraqi maqam · Classical',
    genres: ['Iraqi maqam', 'Classical Arabic'],
    description:
      'A characteristic Iraqi layout with a distinctive low F–C pairing under the middle courses.',
    courses: [
      course('6 · bass', 'F', 2),
      course('5', 'C', 3),
      course('4', 'D', 3),
      course('3', 'G', 3),
      course('2', 'C', 4),
      course('1 · treble', 'F', 4),
    ],
  },
  {
    id: 'turkish-bolahenk',
    name: 'Turkish Bolahenk',
    region: 'Türkiye',
    genre: 'Ottoman · Classical Turkish',
    genres: ['Ottoman', 'Classical Turkish'],
    description:
      'The classic Bolahenk tuning — brighter and a whole step above typical Arabic pitch.',
    caution:
      'Do not raise an Arabic oud to Turkish pitch without proper strings — higher tension can damage the soundboard.',
    courses: [
      course('6 · bass', 'C#', 2),
      course('5', 'F#', 2),
      course('4', 'B', 2),
      course('3', 'E', 3),
      course('2', 'A', 3),
      course('1 · treble', 'D', 4),
    ],
  },
  {
    id: 'turkish-common',
    name: 'Turkish Common',
    region: 'Türkiye · Greece · Armenia',
    genre: 'Ottoman · Folk · Rebetiko',
    genres: ['Ottoman', 'Folk', 'Rebetiko'],
    description:
      'A widely used Turkish-family tuning with open E and A drones — shared across Turkish, Greek, and Armenian practice.',
    caution:
      'Match string gauges to Turkish tension. Tuning an Arabic oud up is not recommended.',
    courses: [
      course('6 · bass', 'E', 2),
      course('5', 'A', 2),
      course('4', 'B', 2),
      course('3', 'E', 3),
      course('2', 'A', 3),
      course('1 · treble', 'D', 4),
    ],
  },
  {
    id: 'armenian',
    name: 'Armenian',
    region: 'Armenia · diaspora',
    genre: 'Folk · Classical Armenian',
    genres: ['Folk', 'Classical Armenian'],
    description:
      'Closely related to Turkish setups; this B–F# drone pattern appears with Necati Çelik–influenced players and Armenian circles.',
    caution: 'Higher Turkish-family tension — use suitable strings.',
    courses: [
      course('6 · bass', 'B', 1),
      course('5', 'F#', 2),
      course('4', 'B', 2),
      course('3', 'E', 3),
      course('2', 'A', 3),
      course('1 · treble', 'D', 4),
    ],
  },
  {
    id: 'persian',
    name: 'Persian Barbat',
    region: 'Iran',
    genre: 'Persian classical · Dastgah',
    genres: ['Persian classical', 'Dastgah'],
    description:
      'Eleven strings in six courses: a single bass C, then five paired courses (G A D G C) — the standard Persian barbat layout for dastgah playing.',
    courses: [
      course('6 · bass (single)', 'C', 2),
      course('5 · paired', 'G', 2),
      course('4 · paired', 'A', 2),
      course('3 · paired', 'D', 3),
      course('2 · paired', 'G', 3),
      course('1 · treble (paired)', 'C', 4),
    ],
  },
];

export const REGIONS = [
  'All',
  ...Array.from(new Set(TUNINGS.map((t) => t.region))),
];

export const GENRES = [
  'All',
  ...Array.from(new Set(TUNINGS.flatMap((t) => t.genres))).sort(),
];

export function formatNote(note: NoteName, octave: number): string {
  return `${note}${octave}`;
}
