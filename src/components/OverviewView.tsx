import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Circle, Code2, BookOpen } from 'lucide-react';
import { CurriculumTrack, Lesson } from '../types/curriculum';

interface OverviewViewProps {
  lessons: Lesson[];
  completedIds: string[];
  onSelectLesson: (lessonId: string) => void;
  onOpenSandbox: () => void;
}

const TRACK_FILTERS: ('全部單元' | CurriculumTrack)[] = [
  '全部單元',
  '基礎語法',
  '流程控制',
  '資料結構',
  '函式與實戰',
];

interface ResilientImageProps {
  src: string;
  alt: string;
  fallbackTitle: string;
}

const ResilientImage: React.FC<ResilientImageProps> = ({ src, alt, fallbackTitle }) => {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div className="w-full h-full min-h-[220px] bg-gradient-to-br from-slate-100 to-sky-50 flex flex-col items-center justify-center p-6 text-center">
        <Code2 className="w-10 h-10 text-sky-700 mb-3" />
        <span className="text-sm font-semibold text-slate-800">{fallbackTitle}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
      className="w-full h-full object-cover"
    />
  );
};

export const OverviewView: React.FC<OverviewViewProps> = ({
  lessons,
  completedIds,
  onSelectLesson,
  onOpenSandbox,
}) => {
  const [activeTrack, setActiveTrack] = useState<'全部單元' | CurriculumTrack>('全部單元');

  const filteredLessons =
    activeTrack === '全部單元'
      ? lessons
      : lessons.filter((l) => l.track === activeTrack);

  const completedCount = completedIds.length;
  const progressPercent = Math.round((completedCount / lessons.length) * 100);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10 sm:py-14 space-y-16">
      {/* Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
          <div className="text-xs font-medium text-sky-700 tracking-wide">
            Python 3 互動學習平台 · 免安裝環境即開即寫
          </div>
          <h1
            className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.15]"
            style={{ textWrap: 'balance' }}
          >
            從零開始掌握 Python 程式設計與實戰邏輯
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
            透過 12 個循序漸進的實作單元、互動式語法視覺模型與瀏覽器即時執行環境，讓每一行程式碼都能立即看見結果並獲得驗證回饋。
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => onSelectLesson(lessons[0].id)}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              開始第一課
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenSandbox}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Code2 className="w-4 h-4 text-sky-700" />
              開啟自由練習室
            </button>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="h-full min-h-[280px] lg:min-h-[380px] rounded-2xl overflow-hidden border border-slate-200 bg-white">
            <ResilientImage
              src="/src/assets/images/hero_python_workbench_1794894719311.jpg"
              alt="PyLab 學院精準幾何程式邏輯工作台示意圖"
              fallbackTitle="Python 互動式程式工作台"
            />
          </div>
        </div>
      </section>

      {/* Full-width 4-column Summary Strip */}
      <section
        aria-label="課程規格摘要"
        className="grid grid-cols-2 lg:grid-cols-4 gap-6 border-y border-slate-200 py-7"
      >
        <div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
            12 個單元
          </div>
          <div className="text-sm text-slate-600 mt-1">完整涵蓋語法至實戰專案</div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
            7 組視覺模型
          </div>
          <div className="text-sm text-slate-600 mt-1">即時追蹤迴圈、切片與記憶體</div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
            即時自動批改
          </div>
          <div className="text-sm text-slate-600 mt-1">瀏覽器內直接執行與驗證輸出</div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold text-sky-700 tabular-nums">
            {completedCount} / {lessons.length} ({progressPercent}%)
          </div>
          <div className="text-sm text-slate-600 mt-1">你的目前學習完成進度</div>
        </div>
      </section>

      {/* Two Learning Pillars Visual Showcase */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        <article className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
          <div className="aspect-[16/9] bg-slate-100 overflow-hidden border-b border-slate-200">
            <ResilientImage
              src="/src/assets/images/module_logic_blocks_1794894718874.jpg"
              alt="程式條件分支與迴圈流程控制結構圖"
              fallbackTitle="流程控制與邏輯思維"
            />
          </div>
          <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-500">
                階段一至階段二 · 單元 01 – 06
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                建立紮實的變數、條件與迴圈思維
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                從資料型別與 f-string 字串插值出發，搭配單步迴圈追蹤器與分支路徑視覺化，真正看懂程式執行時的每一行變化。
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={() => onSelectLesson('lesson-04-conditionals')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:text-sky-800 cursor-pointer"
              >
                體驗流程控制單元
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </article>

        <article className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
          <div className="aspect-[16/9] bg-slate-100 overflow-hidden border-b border-slate-200">
            <ResilientImage
              src="/src/assets/images/module_data_structures_1794894718293.jpg"
              alt="串列索引與字典鍵值對資料結構示意圖"
              fallbackTitle="資料結構與函式封裝"
            />
          </div>
          <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-500">
                階段三至階段四 · 單元 07 – 12
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                掌握串列切片、字典映射與函式化開發
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                學會用 List 與 Dictionary 組織複雜資料，撰寫可重用的 def 函式與串列生成式，最後獨立完成班級成績統計實戰專案。
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={() => onSelectLesson('lesson-07-lists')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:text-sky-800 cursor-pointer"
              >
                前往資料結構單元
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </article>
      </section>

      {/* Curriculum Roadmap */}
      <section id="curriculum" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              完整課程路線圖
            </h2>
            <p className="text-sm text-slate-600 mt-1.5">
              點擊任一單元卡片即可進入互動練習室撰寫並驗證程式碼。
            </p>
          </div>

          {/* Interactive Track Filter Segmented Control */}
          <div
            role="tablist"
            aria-label="課程階段篩選"
            className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start"
          >
            {TRACK_FILTERS.map((track) => {
              const active = activeTrack === track;
              return (
                <button
                  key={track}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => setActiveTrack(track)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {track}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLessons.map((lesson) => {
            const isCompleted = completedIds.includes(lesson.id);
            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => onSelectLesson(lesson.id)}
                className="group text-left bg-white border border-slate-200 rounded-xl p-6 hover:border-sky-400 transition-colors flex flex-col justify-between gap-5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
              >
                <div className="space-y-3">
                  {/* Unboxed metadata with typographic separators */}
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <div className="flex items-center gap-2 tabular-nums">
                      <span>單元 {lesson.number}</span>
                      <span aria-hidden="true">·</span>
                      <span>{lesson.track}</span>
                      <span aria-hidden="true">·</span>
                      <span>{lesson.duration}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-sky-700 transition-colors">
                    {lesson.number}. {lesson.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                    {lesson.summary}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
                  <span
                    className={`inline-flex items-center gap-1.5 ${
                      isCompleted ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        已完成任務
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4 text-slate-300" />
                        尚未完成
                      </>
                    )}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sky-700 group-hover:translate-x-0.5 transition-transform">
                    <BookOpen className="w-3.5 h-3.5" />
                    進入學習
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
