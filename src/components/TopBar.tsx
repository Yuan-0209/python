import React from 'react';

export type AppView = 'overview' | 'workspace' | 'reference' | 'quiz';

interface TopBarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onStartLearning: () => void;
  hasProgress: boolean;
}

const NAV_ITEMS: { id: AppView; label: string }[] = [
  { id: 'overview', label: '課程總覽' },
  { id: 'workspace', label: '互動練習室' },
  { id: 'reference', label: '語法速查表' },
  { id: 'quiz', label: '小測驗挑戰' },
];

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onNavigate,
  onStartLearning,
  hasProgress,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#F8FAFC]/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('overview')}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600"
        >
          PyLab 學院
        </button>

        {/* Zone 2: 4 clean single-line text nav links */}
        <nav aria-label="主導覽" className="hidden md:flex items-center gap-7">
          {NAV_ITEMS.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600 ${
                  isActive
                    ? 'text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[19px] h-[2px] bg-sky-600"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onStartLearning}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          >
            {hasProgress ? '繼續學習' : '開始第一課'}
          </button>
        </div>
      </div>

      {/* Compact mobile navigation row */}
      <nav
        aria-label="行動版導覽"
        className="md:hidden flex items-center gap-5 px-4 pb-2.5 overflow-x-auto border-t border-slate-100"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`pt-2 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                isActive ? 'text-sky-700 underline underline-offset-4' : 'text-slate-600'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
