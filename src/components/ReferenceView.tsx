import React, { useMemo, useState } from 'react';
import { Search, Play } from 'lucide-react';
import { ReferenceItem } from '../types/curriculum';

interface ReferenceViewProps {
  items: ReferenceItem[];
  onTryInSandbox: (code: string) => void;
}

export const ReferenceView: React.FC<ReferenceViewProps> = ({ items, onTryInSandbox }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部分類');

  const categories = useMemo(() => {
    const unique = Array.from(new Set(items.map((item) => item.category)));
    return ['全部分類', ...unique];
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchCat = category === '全部分類' || item.category === category;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.syntax.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });
  }, [items, query, category]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Python 3 語法速查表
        </h1>
        <p className="text-sm text-slate-600">
          收錄開發時最常查詢的核心語法與內建方法，點擊「在練習室執行」即可立即修改測試。
        </p>
      </div>

      {/* Search and Category Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋語法、函式名稱或用途..."
            aria-label="搜尋語法速查表"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                category === cat
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Reference Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2">
          <p className="text-sm font-medium text-slate-800">找不到符合「{query}」的語法項目</p>
          <p className="text-xs text-slate-500">請嘗試更換關鍵字，或切換至「全部分類」。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span>{item.category}</span>
                </div>
                <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
                <div className="font-mono text-xs text-sky-800 bg-sky-50 border border-sky-200 rounded-md px-3 py-1.5 inline-block">
                  {item.syntax}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                <pre className="bg-slate-900 text-slate-100 rounded-lg p-3.5 text-xs font-mono leading-relaxed overflow-x-auto">
                  <code>{item.example}</code>
                </pre>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => onTryInSandbox(item.example)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  在練習室執行
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
