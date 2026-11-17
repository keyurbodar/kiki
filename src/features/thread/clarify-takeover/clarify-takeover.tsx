import { cx } from "class-variance-authority";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { TakeoverCard } from "@/features/thread/takeover-card";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import { Kbd } from "@/primitives/kbd";
import {
  answerText,
  type ClarifyAnswer,
  type ClarifyQuestion,
  clarifyStepLabel,
  initialClarifyAnswers,
  initialClarifyStep,
  isAnswered,
  OPTION_SHORTCUT_LIMIT,
} from "./answers";

export type ClarifyTakeoverProps = {
  questions: ReadonlyArray<ClarifyQuestion>;
  initialAnswers?: ReadonlyArray<ClarifyAnswer>;
  initialStep?: number;
  onSubmit: (answers: ReadonlyArray<ClarifyAnswer>) => void;
  onProgressChange?: (
    answers: ReadonlyArray<ClarifyAnswer>,
    step: number,
  ) => void;
  onLater?: () => void;
  onDismiss?: () => void;
  className?: string;
};

export function ClarifyTakeover({
  questions,
  initialAnswers,
  initialStep,
  onSubmit,
  onProgressChange,
  onLater,
  onDismiss,
  className,
}: ClarifyTakeoverProps) {
  const reviewStep = questions.length > 1 ? questions.length : -1;
  const [answers, setAnswers] = useState(() =>
    initialClarifyAnswers(questions, initialAnswers),
  );
  const [step, setStep] = useState(() =>
    initialClarifyStep(answers, initialStep),
  );
  const question = questions[step];
  const answer = answers[step];
  const allAnswered = answers.every(isAnswered);

  const commit = (next: ClarifyAnswer, advance: boolean) => {
    const settled = { ...next, other: next.other?.trim() || undefined };
    const updated = answers.map((current, index) =>
      index === step ? settled : current,
    );
    const nextStep = advance && questions.length > 1 ? step + 1 : step;
    setAnswers(updated);
    onProgressChange?.(updated, nextStep);
    if (!advance) return;
    if (questions.length > 1) setStep(nextStep);
    else if (isAnswered(settled)) onSubmit(updated);
  };

  const goTo = (target: number) => {
    setStep(target);
    onProgressChange?.(answers, target);
  };

  const advance = () => {
    if (answer !== undefined && isAnswered(answer)) commit(answer, true);
  };

  const pick = (option: string) => {
    if (answer === undefined) return;
    if (question?.multiSelect === true) {
      commit(
        {
          ...answer,
          selected: answer.selected.includes(option)
            ? answer.selected.filter((selected) => selected !== option)
            : [...answer.selected, option],
        },
        false,
      );
      return;
    }
    commit({ ...answer, selected: [option] }, true);
  };

  const rootRef = useRef<HTMLDivElement>(null);
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (
      question === undefined ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      rootRef.current?.closest("[aria-hidden='true']") !== null
    )
      return;
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      (target.isContentEditable || target.tagName === "INPUT")
    )
      return;
    const index = Number.parseInt(event.key, 10) - 1;
    const option = question.options[index];
    if (Number.isNaN(index) || option === undefined) return;
    event.preventDefault();
    pick(option);
  });
  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const submitRef = useRef<HTMLButtonElement>(null);
  const atSubmit = questions.length === 1 || step === reviewStep;
  const canSubmit =
    questions.length === 1
      ? answer !== undefined && isAnswered(answer)
      : allAnswered;
  const submit = questions.length === 1 ? advance : () => onSubmit(answers);

  const previousStep = useRef(step);
  useEffect(() => {
    if (previousStep.current !== step && step === reviewStep)
      submitRef.current?.focus();
    previousStep.current = step;
  }, [step, reviewStep]);

  return (
    <TakeoverCard
      ref={rootRef}
      slot="clarify-takeover"
      className={className}
      label={clarifyStepLabel(questions.length, step)}
      trailing={
        <div className="flex items-center gap-1">
          {questions.length > 1 &&
            questions.map((item, index) => (
              <span
                key={item.question}
                className={cx(
                  "size-1 rounded-full",
                  index === step
                    ? "bg-primary"
                    : isAnswered(answers[index])
                      ? "bg-muted-foreground-2"
                      : "bg-border-2",
                )}
              />
            ))}
        </div>
      }
      footer={
        <>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="ghost" size="xs" onClick={() => goTo(step - 1)}>
                <Icon name="arrow-left" />
                Back
              </Button>
            )}
            {onLater !== undefined && (
              <Button variant="outline" size="xs" onClick={onLater}>
                Later
              </Button>
            )}
            {onDismiss !== undefined && (
              <Button variant="ghost" size="xs" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {atSubmit ? (
              <Button
                ref={submitRef}
                size="xs"
                intent="accent"
                disabled={!canSubmit}
                onClick={submit}
              >
                {questions.length === 1 ? "Send answer" : "Send answers"}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="xs"
                disabled={!isAnswered(answer)}
                onClick={advance}
              >
                Next
              </Button>
            )}
          </div>
        </>
      }
    >
      {question === undefined || answer === undefined ? (
        <ol className="flex flex-col gap-2">
          {answers.map((item, index) => (
            <li key={item.question} className="flex min-w-0 flex-col gap-0.5">
              <button
                type="button"
                onClick={() => goTo(index)}
                className="focus-gutter w-fit cursor-pointer rounded-sm text-left text-xs font-normal text-muted-foreground-2 outline-none hover:text-muted-foreground-1 focus-visible:outline-ring-inset"
              >
                {item.question}
              </button>
              <span className="text-sm font-medium break-words text-foreground">
                {answerText(item)}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-balance text-foreground">
            {question.question}
          </span>
          <div className="flex flex-col gap-1">
            {question.options.map((option, index) => {
              const selected = answer.selected.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => pick(option)}
                  className={cx(
                    "-mx-2 flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left text-sm font-normal outline-none transition-colors duration-100",
                    "border-hairline border-transparent pointer-coarse:border-border-2",
                    "focus-visible:outline-ring-inset",
                    selected
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground-1 hover:bg-secondary hover:text-foreground",
                  )}
                >
                  {index < OPTION_SHORTCUT_LIMIT && (
                    <Kbd
                      variant="chip"
                      className="shrink-0 pointer-coarse:hidden"
                    >
                      {index + 1}
                    </Kbd>
                  )}
                  <span className="min-w-0 break-words">{option}</span>
                  {selected && (
                    <Icon
                      name="checkmark-1"
                      size="sm"
                      className="ml-auto shrink-0 text-primary-ink"
                    />
                  )}
                </button>
              );
            })}
          </div>
          <Input
            value={answer.other ?? ""}
            placeholder="Or type an answer"
            onChange={(event) => {
              const other = event.target.value;
              const updated = answers.map((current, index) =>
                index === step ? { ...current, other } : current,
              );
              setAnswers(updated);
              onProgressChange?.(updated, step);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter" || !isAnswered(answer)) return;
              event.preventDefault();
              advance();
            }}
          />
        </div>
      )}
    </TakeoverCard>
  );
}
