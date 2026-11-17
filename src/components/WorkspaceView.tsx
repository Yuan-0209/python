import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  CheckCircle2,
  Eye,
  Code2,
  PlayCircle,
} from 'lucide-react';
import { Lesson } from '../types/curriculum';
import { CodePlayground } from './CodePlayground';
import { ConceptVisualizer } from './ConceptVisualizer';

interface WorkspaceViewProps {
  lessons: Lesson[];
  activeLessonId: string;
  onSelectLesson: (lessonId: string) => void;
  codeByLesson: Record<string, string>;
  onUpdateCode: (lessonId: string, code: string) => void;
  completedIds: string[];
  onMarkCompleted: (lessonId: string) => void;
  scratchpadMode: boolean;
  onToggleScratchpad: (enabled: boolean) => void;
  scratchpadCode: string;
  onUpdateScratchpad: (code: string) => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  lessons,
  activeLessonId,
  onSelectLesson,
  codeByLesson,
  onUpdateCode,
  completedIds,
  onMarkCompleted,
  scratchpadMode,
  onToggleScratchpad,
  scratchpadCode,
  onUpdateScratchpad,
}) => {
  const [showHint, setShowHint] = useState(false);

  const currentIndex = Math.max(
    0,
    lessons.findIndex((l) => l.id === activeLessonId)
  );
  const lesson = lessons[currentIndex] || lessons[0];
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  const isCompleted = completedIds.includes(lesson.id);
  const currentCode = codeByLesson[lesson.id] ?? lesson.challenge.starterCode;

  const handleLessonSwitch = (newId: string) => {
    setShowHint(false);
    onToggleScratchpad(false);
    onSelectLesson(newId);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      {/* Workspace Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
            <button
              type="button"
              onClick={() => onToggleScratchpad(false)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                !scratchpadMode
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              單元課程模式
            </button>
            <button
              type="button"
              onClick={() => onToggleScratchpad(true)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                scratchpadMode
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              自由實驗室
            </button>
          </div>

          {!scratchpadMode && (
            <label className="flex items-center gap-2 text-sm">
              <span className="sr-only">選擇單元</span>
              <select
                value={lesson.id}
                onChange={(e) => handleLessonSwitch(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-sky-600 max-w-[260px] sm:max-w-xs truncate"
              >
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.number}. {l.title}
                    {completedIds.includes(l.id) ? ' (已完成)' : ''}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {!scratchpadMode && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!prevLesson}
              onClick={() => prevLesson && handleLessonSwitch(prevLesson.id)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              <ChevronLeft className="w-4 h-4" />
              上一課
            </button>
            <button
              type="button"
              disabled={!nextLesson}
              onClick={() => nextLesson && handleLessonSwitch(nextLesson.id)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              下一課
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Mode A: Free Scratchpad */}
      {scratchpadMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-4 bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-base">
              <Code2 className="w-5 h-5 text-sky-700" />
              <h2>Python 自由實驗室</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              這裡沒有任務限制，你可以自由測試任何 Python 3 語法、演算法或小工具。按下 Ctrl + Enter 即可立刻執行。
            </p>
            <div className="pt-2 space-y-2">
              <div className="text-xs font-medium text-slate-500">快速載入實驗範本</div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateScratchpad(
                      '# 九九乘法表產生器\nfor i in range(1, 10):\n    row = [f"{i}x{j}={i*j:2d}" for j in range(1, 10)]\n    print("  ".join(row))'
                    )
                  }
                  className="text-left px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg hover:border-sky-400 text-slate-700 cursor-pointer"
                >
                  九九乘法表產生器
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateScratchpad(
                      '# 費氏數列函式\ndef fib(n):\n    a, b = 0, 1\n    seq = []\n    for _ in range(n):\n        seq.append(a)\n        a, b = b, a + b\n    return seq\n\nprint("前 10 項費氏數列：", fib(10))'
                    )
                  }
                  className="text-left px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg hover:border-sky-400 text-slate-700 cursor-pointer"
                >
                  費氏數列 (Fibonacci) 計算
                </button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-8">
            <CodePlayground
              title="sandbox.py"
              code={scratchpadCode}
              onChangeCode={onUpdateScratchpad}
              onResetCode={() =>
                onUpdateScratchpad('# 在此自由撰寫 Python 程式\nprint("Hello, PyLab!")\n')
              }
            />
          </div>
        </div>
      ) : (
        /* Mode B: Two-Zone Interactive Lesson Sandbox */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Zone: Concept Deck, Interactive Visualizer & Challenge */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-2 tabular-nums">
                  <span>單元 {lesson.number}</span>
                  <span aria-hidden="true">·</span>
                  <span>{lesson.track}</span>
                  <span aria-hidden="true">·</span>
                  <span>{lesson.duration}</span>
                </div>
                {isCompleted && (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    已完成
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {lesson.number}. {lesson.title}
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">{lesson.summary}</p>
            </div>

            {/* Interactive Pedagogical Visualizer */}
            <ConceptVisualizer type={lesson.visualizerType} />

            {/* Core Concept Cards */}
            <div className="space-y-5">
              {lesson.concepts.map((concept, idx) => (
                <div
                  key={concept.title}
                  className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-semibold text-slate-900">
                      {idx + 1}. {concept.title}
                    </h2>
                    <button
                      type="button"
                      onClick={() => onUpdateCode(lesson.id, concept.code)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:text-sky-800 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      載入範例
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {concept.explanation}
                  </p>
                  <pre className="bg-slate-900 text-slate-100 rounded-lg p-3.5 text-xs font-mono leading-relaxed overflow-x-auto">
                    <code>{concept.code}</code>
                  </pre>
                </div>
              ))}
            </div>

            {/* Hands-on Coding Challenge */}
            <div className="bg-white border border-sky-200 rounded-xl p-5 space-y-4">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-sky-700">實作驗證任務</div>
                <h2 className="text-base font-bold text-slate-900">
                  {lesson.challenge.title}
                </h2>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {lesson.challenge.instructions}
              </p>

              <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                驗收標準：{lesson.challenge.expectedSummary}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowHint((h) => !h)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                  {showHint ? '隱藏提示' : '查看提示'}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateCode(lesson.id, lesson.challenge.solutionCode)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  填入參考解答
                </button>
              </div>

              {showHint && (
                <div className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3 leading-relaxed">
                  {lesson.challenge.hint}
                </div>
              )}
            </div>
          </div>

          {/* Right Zone: Sticky Code Editor & Terminal */}
          <div className="lg:col-span-7 lg:sticky lg:top-24">
            <CodePlayground
              key={lesson.id}
              title={`lesson_${lesson.number}.py`}
              code={currentCode}
              onChangeCode={(val) => onUpdateCode(lesson.id, val)}
              onResetCode={() => onUpdateCode(lesson.id, lesson.challenge.starterCode)}
              onValidate={lesson.challenge.validate}
              onPassed={() => onMarkCompleted(lesson.id)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
