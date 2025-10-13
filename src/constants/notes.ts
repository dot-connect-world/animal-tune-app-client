// 기타 튜닝을 위한 표준 음계 주파수 (Hz)
// 표준 A4 = 440Hz 기준

export interface Note {
  name: string;
  frequency: number;
  octave: number;
}

// 표준 기타 튜닝 (E2, A2, D3, G3, B3, E4)
export const STANDARD_GUITAR_NOTES: Note[] = [
  { name: 'E', frequency: 82.41, octave: 2 },
  { name: 'A', frequency: 110.00, octave: 2 },
  { name: 'D', frequency: 146.83, octave: 3 },
  { name: 'G', frequency: 196.00, octave: 3 },
  { name: 'B', frequency: 246.94, octave: 3 },
  { name: 'E', frequency: 329.63, octave: 4 },
];

// 모든 음계 (C2부터 C6까지)
export const ALL_NOTES: Note[] = [
  // Octave 2
  { name: 'C', frequency: 65.41, octave: 2 },
  { name: 'C#', frequency: 69.30, octave: 2 },
  { name: 'D', frequency: 73.42, octave: 2 },
  { name: 'D#', frequency: 77.78, octave: 2 },
  { name: 'E', frequency: 82.41, octave: 2 },
  { name: 'F', frequency: 87.31, octave: 2 },
  { name: 'F#', frequency: 92.50, octave: 2 },
  { name: 'G', frequency: 98.00, octave: 2 },
  { name: 'G#', frequency: 103.83, octave: 2 },
  { name: 'A', frequency: 110.00, octave: 2 },
  { name: 'A#', frequency: 116.54, octave: 2 },
  { name: 'B', frequency: 123.47, octave: 2 },

  // Octave 3
  { name: 'C', frequency: 130.81, octave: 3 },
  { name: 'C#', frequency: 138.59, octave: 3 },
  { name: 'D', frequency: 146.83, octave: 3 },
  { name: 'D#', frequency: 155.56, octave: 3 },
  { name: 'E', frequency: 164.81, octave: 3 },
  { name: 'F', frequency: 174.61, octave: 3 },
  { name: 'F#', frequency: 185.00, octave: 3 },
  { name: 'G', frequency: 196.00, octave: 3 },
  { name: 'G#', frequency: 207.65, octave: 3 },
  { name: 'A', frequency: 220.00, octave: 3 },
  { name: 'A#', frequency: 233.08, octave: 3 },
  { name: 'B', frequency: 246.94, octave: 3 },

  // Octave 4
  { name: 'C', frequency: 261.63, octave: 4 },
  { name: 'C#', frequency: 277.18, octave: 4 },
  { name: 'D', frequency: 293.66, octave: 4 },
  { name: 'D#', frequency: 311.13, octave: 4 },
  { name: 'E', frequency: 329.63, octave: 4 },
  { name: 'F', frequency: 349.23, octave: 4 },
  { name: 'F#', frequency: 369.99, octave: 4 },
  { name: 'G', frequency: 392.00, octave: 4 },
  { name: 'G#', frequency: 415.30, octave: 4 },
  { name: 'A', frequency: 440.00, octave: 4 },
  { name: 'A#', frequency: 466.16, octave: 4 },
  { name: 'B', frequency: 493.88, octave: 4 },

  // Octave 5
  { name: 'C', frequency: 523.25, octave: 5 },
  { name: 'C#', frequency: 554.37, octave: 5 },
  { name: 'D', frequency: 587.33, octave: 5 },
  { name: 'D#', frequency: 622.25, octave: 5 },
  { name: 'E', frequency: 659.25, octave: 5 },
  { name: 'F', frequency: 698.46, octave: 5 },
  { name: 'F#', frequency: 739.99, octave: 5 },
  { name: 'G', frequency: 783.99, octave: 5 },
  { name: 'G#', frequency: 830.61, octave: 5 },
  { name: 'A', frequency: 880.00, octave: 5 },
  { name: 'A#', frequency: 932.33, octave: 5 },
  { name: 'B', frequency: 987.77, octave: 5 },
];

// 주파수를 가장 가까운 음계로 변환
export function getClosestNote(frequency: number): {
  note: Note;
  cents: number; // -50 ~ +50 (음정 편차)
} {
  let closestNote = ALL_NOTES[0];
  let minDiff = Math.abs(frequency - closestNote.frequency);

  for (const note of ALL_NOTES) {
    const diff = Math.abs(frequency - note.frequency);
    if (diff < minDiff) {
      minDiff = diff;
      closestNote = note;
    }
  }

  // Cents 계산 (반음 = 100 cents)
  const cents = 1200 * Math.log2(frequency / closestNote.frequency);

  return {
    note: closestNote,
    cents: Math.round(cents),
  };
}
