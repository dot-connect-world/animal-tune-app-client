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

// 현재 표시 중인 음정 (Dead Zone 적용용)
let currentDisplayedNote: Note | null = null;

// 주파수를 cents로 변환하는 헬퍼 함수
function frequencyToCents(frequency: number, referenceFrequency: number): number {
  return 1200 * Math.log2(frequency / referenceFrequency);
}

// 이진 탐색으로 가장 가까운 음정 찾기 (O(log n) 성능)
function findClosestNoteByBinarySearch(frequency: number): Note {
  let left = 0;
  let right = ALL_NOTES.length - 1;
  let closestNote = ALL_NOTES[0];
  let minDiff = Math.abs(frequency - closestNote.frequency);

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const note = ALL_NOTES[mid];
    const diff = Math.abs(frequency - note.frequency);

    if (diff < minDiff) {
      minDiff = diff;
      closestNote = note;
    }

    if (note.frequency < frequency) {
      left = mid + 1;
    } else if (note.frequency > frequency) {
      right = mid - 1;
    } else {
      return note; // 정확히 일치
    }
  }

  return closestNote;
}

// 주파수를 가장 가까운 음계로 변환 (Dead Zone 적용)
export function getClosestNote(frequency: number): {
  note: Note;
  cents: number; // -50 ~ +50 (음정 편차)
} {
  const DEAD_ZONE_CENTS = 15; // ±15 cents 범위 내에서는 현재 음정 유지 (best practice)

  // 1. 가장 가까운 음정 찾기 (이진 탐색으로 최적화)
  let closestNote = findClosestNoteByBinarySearch(frequency);

  // 2. Dead Zone 적용: 현재 표시 중인 음정이 있다면
  if (currentDisplayedNote) {
    const centsFromCurrent = frequencyToCents(frequency, currentDisplayedNote.frequency);

    // 현재 음정에서 ±15 cents 이내면 현재 음정 유지
    if (Math.abs(centsFromCurrent) <= DEAD_ZONE_CENTS) {
      closestNote = currentDisplayedNote;
    } else {
      // Dead Zone을 벗어났으면 새 음정으로 업데이트
      currentDisplayedNote = closestNote;
    }
  } else {
    // 처음 실행시 현재 음정 설정
    currentDisplayedNote = closestNote;
  }

  // 3. Cents 계산 (반음 = 100 cents)
  const cents = frequencyToCents(frequency, closestNote.frequency);

  return {
    note: closestNote,
    cents: Math.round(cents),
  };
}

// 튜너 정지시 현재 음정 초기화
export function resetCurrentNote(): void {
  currentDisplayedNote = null;
}
