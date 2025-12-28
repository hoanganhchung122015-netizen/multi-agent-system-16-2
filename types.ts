export enum Subject {
  MATH = 'Toán học',
  PHYSICS = 'Vật lí',
  CHEMISTRY = 'Hóa học',
  DIARY = 'Nhật ký'
}

export enum AgentType {
  SPEED = 'Professor 1',
  SOCRATIC = 'Professor 2',
  PERPLEXITY = 'Professor 3',
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface FullAnalysisResponse {
  prof1: {
    answer: string;
    casio?: string;
  };
  prof2: {
    explanation: string;
    method: string;
  };
  prof3: {
    quizzes: QuizQuestion[];
  };
  tts_summary: string;
}

export interface DiaryEntry {
  date: string;
  subject: Subject;
  input: string;
  image?: string;
  results: FullAnalysisResponse;
}