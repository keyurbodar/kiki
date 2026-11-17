export type ClarifyQuestion = {
  readonly question: string;
  readonly options: ReadonlyArray<string>;
  readonly multiSelect: boolean;
};

export type ClarifyAnswer = {
  readonly question: string;
  readonly selected: ReadonlyArray<string>;
  readonly other: string | undefined;
};

export const OPTION_SHORTCUT_LIMIT = 9;

export const isAnswered = (answer: ClarifyAnswer | undefined) =>
  answer !== undefined &&
  (answer.selected.length > 0 ||
    (answer.other !== undefined && answer.other.trim().length > 0));

export const answerText = (answer: ClarifyAnswer) =>
  [
    ...answer.selected,
    ...(answer.other === undefined ? [] : [answer.other]),
  ].join(", ");

export const formatClarifyAnswers = (answers: ReadonlyArray<ClarifyAnswer>) => {
  const numbered = answers.length > 1;
  return answers
    .map((answer, index) =>
      numbered
        ? `${index + 1}. **${answer.question}** → ${answerText(answer)}`
        : `**Q:** ${answer.question}\n**A:** ${answerText(answer)}`,
    )
    .join("\n\n");
};

export const initialClarifyAnswers = (
  questions: ReadonlyArray<ClarifyQuestion>,
  initial: ReadonlyArray<ClarifyAnswer> | undefined,
): ClarifyAnswer[] =>
  questions.map((question, index) => {
    const answer = initial?.[index];
    return answer !== undefined && answer.question === question.question
      ? answer
      : { question: question.question, selected: [], other: undefined };
  });

export const initialClarifyStep = (
  answers: ReadonlyArray<ClarifyAnswer>,
  initialStep: number | undefined,
) => {
  const review = answers.length > 1 ? answers.length : -1;
  const fallback = review > 0 && answers.every(isAnswered) ? review : 0;
  return initialStep !== undefined &&
    initialStep >= 0 &&
    initialStep <= Math.max(review, 0)
    ? initialStep
    : fallback;
};

export const clarifyStepLabel = (count: number, step: number) =>
  count === 1
    ? "One question"
    : step === count
      ? "Review"
      : `${step + 1} of ${count}`;
