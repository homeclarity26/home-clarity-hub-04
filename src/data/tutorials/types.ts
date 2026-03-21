export interface TutorialStep {
  title: string;
  body: string;
}

export interface Tutorial {
  id: string;
  category: string;
  title: string;
  description: string;
  audience: "admin" | "client";
  steps: TutorialStep[];
  tip?: string;
  keywords: string[];
}

export interface ReferenceCard {
  id: string;
  title: string;
  icon: string;
  items: string[];
  audience: "admin" | "client";
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
}
