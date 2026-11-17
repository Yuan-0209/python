export type CurriculumTrack = '基礎語法' | '流程控制' | '資料結構' | '函式與實戰';

export type VisualizerType =
  | 'variables'
  | 'operators'
  | 'branching'
  | 'loop'
  | 'list'
  | 'dict'
  | 'function'
  | 'none';

export interface LessonConcept {
  title: string;
  explanation: string;
  code: string;
}

export interface ValidationResult {
  passed: boolean;
  message: string;
}

export interface LessonChallenge {
  title: string;
  instructions: string;
  expectedSummary: string;
  starterCode: string;
  solutionCode: string;
  hint: string;
  validate: (output: string, code: string) => ValidationResult;
}

export interface Lesson {
  id: string;
  number: string;
  title: string;
  track: CurriculumTrack;
  duration: string;
  summary: string;
  visualizerType: VisualizerType;
  concepts: LessonConcept[];
  challenge: LessonChallenge;
}

export interface ReferenceItem {
  id: string;
  category: string;
  syntax: string;
  title: string;
  description: string;
  example: string;
}

export interface QuizQuestion {
  id: string;
  topic: string;
  question: string;
  code?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}
