
export interface Person {
  id: string;
  name: string;
}

export interface RampTask {
  uid: string;
  name: string;
  score: number;
}

export interface TrackingTask {
  uid: string;
  location: string;
  time: string;
  score: number;
}

export interface RecruitmentState {
  instructors: Person[];
  candidate: Person;
  ramps: RampTask[];
  tunnel: { time: string; score: number };
  modulation: { time: string; score: number };
  tracking: TrackingTask[];
}

export interface AIReviewResult {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  verdict: 'APROVADO' | 'REPROVADO' | 'PENDENTE';
}

export interface SavedEvaluation {
  id: string;
  date: string;
  state: RecruitmentState;
  finalScore: number;
  review: AIReviewResult;
  passingGrade: number;
}
