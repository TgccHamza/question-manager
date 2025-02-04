export interface Question {
  number: number
  text: string
  type: "single-choice" | "open-ended"
  options: string[]
  answer: string[]
  points: number
  reveal_answer: string
}

export interface QuestionsData {
  questions: Question[]
}

