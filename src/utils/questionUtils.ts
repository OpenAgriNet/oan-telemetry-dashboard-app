// Initial telemetry events have no answer; only completed question/answer records are displayed.
export const hasQuestionAnswer = (question: { answer?: string | null }): boolean =>
  typeof question.answer === "string" && question.answer !== "";
