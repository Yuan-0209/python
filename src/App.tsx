import { useEffect, useState } from 'react';
import { AppView, TopBar } from './components/TopBar';
import { OverviewView } from './components/OverviewView';
import { WorkspaceView } from './components/WorkspaceView';
import { ReferenceView } from './components/ReferenceView';
import { QuizView } from './components/QuizView';
import { LESSONS } from './data/lessons';
import { REFERENCE_ITEMS } from './data/reference';
import { QUIZ_QUESTIONS } from './data/quiz';

const STORAGE_PROGRESS_KEY = 'pylab_completed_lessons_v1';
const STORAGE_CODE_KEY = 'pylab_saved_code_v1';

export default function App() {
  const [view, setView] = useState<AppView>('overview');
  const [activeLessonId, setActiveLessonId] = useState<string>(LESSONS[0].id);
  const [scratchpadMode, setScratchpadMode] = useState(false);
  const [scratchpadCode, setScratchpadCode] = useState(
    '# 在此自由撰寫 Python 程式\nfor i in range(1, 4):\n    print(f"第 {i} 次執行成功！")\n'
  );

  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROGRESS_KEY);
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });

  const [codeByLesson, setCodeByLesson] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CODE_KEY);
      return saved ? (JSON.parse(saved) as Record<string, string>) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PROGRESS_KEY, JSON.stringify(completedIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [completedIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CODE_KEY, JSON.stringify(codeByLesson));
    } catch {
      // Ignore storage quota errors
    }
  }, [codeByLesson]);

  const handleSelectLesson = (lessonId: string) => {
    setActiveLessonId(lessonId);
    setScratchpadMode(false);
    setView('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSandbox = () => {
    setScratchpadMode(true);
    setView('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartLearning = () => {
    const nextUnfinished = LESSONS.find((l) => !completedIds.includes(l.id));
    handleSelectLesson((nextUnfinished || LESSONS[0]).id);
  };

  const handleUpdateCode = (lessonId: string, code: string) => {
    setCodeByLesson((prev) => ({ ...prev, [lessonId]: code }));
  };

  const handleMarkCompleted = (lessonId: string) => {
    setCompletedIds((prev) => (prev.includes(lessonId) ? prev : [...prev, lessonId]));
  };

  const handleTryReferenceCode = (snippet: string) => {
    setScratchpadCode(snippet);
    setScratchpadMode(true);
    setView('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetProgress = () => {
    setCompletedIds([]);
    setCodeByLesson({});
    try {
      localStorage.removeItem(STORAGE_PROGRESS_KEY);
      localStorage.removeItem(STORAGE_CODE_KEY);
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <TopBar
        currentView={view}
        onNavigate={(nextView) => {
          setView(nextView);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onStartLearning={handleStartLearning}
        hasProgress={completedIds.length > 0}
      />

      <main className="flex-1">
        {view === 'overview' && (
          <OverviewView
            lessons={LESSONS}
            completedIds={completedIds}
            onSelectLesson={handleSelectLesson}
            onOpenSandbox={handleOpenSandbox}
          />
        )}

        {view === 'workspace' && (
          <WorkspaceView
            lessons={LESSONS}
            activeLessonId={activeLessonId}
            onSelectLesson={setActiveLessonId}
            codeByLesson={codeByLesson}
            onUpdateCode={handleUpdateCode}
            completedIds={completedIds}
            onMarkCompleted={handleMarkCompleted}
            scratchpadMode={scratchpadMode}
            onToggleScratchpad={setScratchpadMode}
            scratchpadCode={scratchpadCode}
            onUpdateScratchpad={setScratchpadCode}
          />
        )}

        {view === 'reference' && (
          <ReferenceView
            items={REFERENCE_ITEMS}
            onTryInSandbox={handleTryReferenceCode}
          />
        )}

        {view === 'quiz' && (
          <QuizView
            questions={QUIZ_QUESTIONS}
            onGoToLessons={() => setView('overview')}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>PyLab 學院 · Python 互動式程式設計教學平台</div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setView('reference')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              語法速查表
            </button>
            <button
              type="button"
              onClick={() => setView('quiz')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              觀念小測驗
            </button>
            {completedIds.length > 0 && (
              <button
                type="button"
                onClick={handleResetProgress}
                className="text-slate-500 hover:text-rose-700 transition-colors cursor-pointer"
              >
                清除學習進度
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
