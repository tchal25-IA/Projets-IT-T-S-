export interface Definition {
  term: string;
  definition: string;
}

export interface Example {
  title: string;
  content: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AcademyArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  level: 1 | 2 | 3;
  market: 'FR' | 'CH' | 'BOTH';
  readingTime: number;
  xpReward: number;
  
  // Rich content
  sections: {
    title: string;
    content: string;
    diagram?: string; // SVG or ASCII diagram
  }[];
  
  definitions?: Definition[];
  examples?: Example[];
  keyPoints: string[];
  quiz: QuizQuestion;
}
