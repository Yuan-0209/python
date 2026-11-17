import React, { useState } from 'react';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { QuizQuestion } from '../types/curriculum';

interface QuizViewProps {
  questions: QuizQuestion[];
  onGoToLessons: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ questions, onGoToLessons }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);

  const current = questions[currentIdx];
  const hasAnswered = selectedIdx !== null;
  const isCorrect = hasAnswered && selectedIdx === current.correctIndex;

  const handleSelect = (optIdx: number) => {
    if (hasAnswered) return;
    setSelectedIdx(optIdx);
    setAnswers((prev) => [...prev, optIdx]);
  };

  const handleNext = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((i) => i + 1);
      setSelectedIdx(null);
    } else {
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedIdx(null);
    setAnswers([]);
    setFinished(false);
  };

  const correctTotal = answers.reduce((acc, ans, idx) => {
    return acc + (ans === questions[idx].correctIndex ? 1 : 0);
  }, 0);

  if (finished) {
    const accuracy = Math.round((correctTotal / questions.length) * 100);
    return (
      <div className="max-w-[900px] mx-auto px-4 sm:px-8 py-12 space-y-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6">
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-500">測驗完成報告</div>
            <h1 className="text-3xl font-bold text-slate-900 tabular-nums">
              答對 {correctTotal} / {questions.length} 題（正確率 {accuracy}%）
            </h1>
            <p className="text-sm text-slate-600">
              {accuracy >= 80
                ? '表現非常優異！你對 Python 語法與執行邏輯已有穩固的掌握。'
                : '建議回顧下方解析，並回到互動練習室多嘗試修改範例程式碼。'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              重新測驗
            </button>
            <button
              type="button"
              onClick={onGoToLessons}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              回到課程練習
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">逐題解析回顧</h2>
          {questions.map((q, idx) => {
            const userAns = answers[idx];
            const ok = userAns === q.correctIndex;
            return (
              <div
                key={q.id}
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-500 tabular-nums">
                    第 {idx + 1} 題 · {q.topic}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-medium ${
                      ok ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {ok ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> 答對
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> 答錯
                      </>
                    )}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{q.question}</p>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>你的作答：{q.options[userAns]}</div>
                  {!ok && (
                    <div className="text-emerald-700 font-medium">
                      正確答案：{q.options[q.correctIndex]}
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 leading-relaxed">
                  {q.explanation}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[820px] mx-auto px-4 sm:px-8 py-10 sm:py-12 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Python 觀念小測驗</h1>
          <p className="text-sm text-slate-600 mt-1">
            透過輸出預測與常見陷阱題，檢驗語法理解程度。
          </p>
        </div>
        <div className="text-sm font-semibold text-slate-700 tabular-nums shrink-0">
          {currentIdx + 1} / {questions.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-sky-600 transition-all duration-200"
          style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="space-y-3">
          <div className="text-xs font-medium text-slate-500">
            主題：{current.topic}
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 leading-snug">
            {current.question}
          </h2>
          {current.code && (
            <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs sm:text-sm font-mono leading-relaxed overflow-x-auto">
              <code>{current.code}</code>
            </pre>
          )}
        </div>

        <div className="space-y-2.5">
          {current.options.map((opt, idx) => {
            const isSelected = selectedIdx === idx;
            const isRightOption = idx === current.correctIndex;

            let optionStyle =
              'bg-white border-slate-200 text-slate-800 hover:border-sky-400 hover:bg-slate-50';
            if (hasAnswered) {
              if (isRightOption) {
                optionStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-medium';
              } else if (isSelected && !isRightOption) {
                optionStyle = 'bg-rose-50 border-rose-400 text-rose-950';
              } else {
                optionStyle = 'bg-white border-slate-200 text-slate-400';
              }
            }

            return (
              <button
                key={opt}
                type="button"
                disabled={hasAnswered}
                onClick={() => handleSelect(idx)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm transition-colors flex items-center justify-between gap-3 cursor-pointer disabled:cursor-default ${optionStyle}`}
              >
                <span className="font-mono text-xs sm:text-sm">{opt}</span>
                {hasAnswered && isRightOption && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                {hasAnswered && isSelected && !isRightOption && (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {hasAnswered && (
          <div className="pt-2 space-y-4">
            <div
              className={`rounded-xl p-4 border text-sm leading-relaxed ${
                isCorrect
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}
            >
              <div className="font-semibold mb-1">
                {isCorrect ? '回答正確' : '再想一下'}
              </div>
              <p className="text-xs sm:text-sm">{current.explanation}</p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                {currentIdx + 1 < questions.length ? '下一題' : '查看總結報告'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
