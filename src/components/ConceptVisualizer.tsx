import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Play, Pause, SkipForward, RotateCcw, ArrowRight } from 'lucide-react';
import { VisualizerType } from '../types/curriculum';

interface ConceptVisualizerProps {
  type: VisualizerType;
}

export const ConceptVisualizer: React.FC<ConceptVisualizerProps> = ({ type }) => {
  if (type === 'none') return null;

  return (
    <section
      aria-label="互動概念模擬器"
      className="bg-slate-50 border border-slate-200 rounded-xl p-5"
    >
      {type === 'variables' && <VariablesVisualizer />}
      {type === 'operators' && <OperatorsVisualizer />}
      {type === 'branching' && <BranchingVisualizer />}
      {type === 'loop' && <LoopVisualizer />}
      {type === 'list' && <ListVisualizer />}
      {type === 'dict' && <DictVisualizer />}
      {type === 'function' && <FunctionVisualizer />}
    </section>
  );
};

const VariablesVisualizer: React.FC = () => {
  const presets = [
    { label: '文字字串', raw: '"台北"', value: '台北', pyType: 'str', note: '雙引號或單引號包住的文字' },
    { label: '整數', raw: '42', value: '42', pyType: 'int', note: '沒有小數點的數值' },
    { label: '浮點數', raw: '3.14', value: '3.14', pyType: 'float', note: '包含小數點的實數' },
    { label: '布林值', raw: 'True', value: 'True', pyType: 'bool', note: '僅有 True 或 False 兩種狀態' },
  ];
  const [selected, setSelected] = useState(0);
  const current = presets[selected];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">互動模型：變數記憶體標籤箱</h3>
        <span className="text-xs text-slate-500">點選切換賦值型別</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-200/70 rounded-lg">
        {presets.map((p, idx) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setSelected(idx)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              selected === idx
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="font-mono text-sm text-slate-800">
          <span className="text-sky-700 font-semibold">my_var</span> ={' '}
          <span className="text-amber-700 font-semibold">{current.raw}</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="border border-slate-200 bg-slate-50 rounded-md px-3 py-2 font-mono">
            <div className="text-slate-500">type(my_var) → &lt;class &apos;{current.pyType}&apos;&gt;</div>
            <div className="text-slate-900 font-medium mt-0.5">{current.note}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OperatorsVisualizer: React.FC = () => {
  const [a, setA] = useState(17);
  const [b, setB] = useState(5);

  const ops = [
    { expr: `${a} / ${b}`, label: '一般除法', res: (a / b).toFixed(2) },
    { expr: `${a} // ${b}`, label: '整除取商', res: String(Math.floor(a / b)) },
    { expr: `${a} % ${b}`, label: '取餘數', res: String(a % b) },
    { expr: `${a} ** 2`, label: '次方運算', res: String(a ** 2) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">互動模型：整除、餘數與次方比較</h3>
        <span className="text-xs text-slate-500 tabular-nums">
          a = {a} · b = {b}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-slate-700">
            <span>被除數 a</span>
            <span className="font-mono tabular-nums">{a}</span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            value={a}
            onChange={(e) => setA(Number(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer"
          />
        </label>
        <label className="block space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-slate-700">
            <span>除數 b</span>
            <span className="font-mono tabular-nums">{b}</span>
          </div>
          <input
            type="range"
            min={1}
            max={12}
            value={b}
            onChange={(e) => setB(Number(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {ops.map((item) => (
          <div key={item.label} className="bg-white border border-slate-200 rounded-lg p-3">
            <div className="text-xs text-slate-500">{item.label}</div>
            <div className="font-mono text-xs text-slate-700 mt-1">{item.expr}</div>
            <div className="font-mono text-base font-semibold text-sky-700 tabular-nums mt-1">
              {item.res}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BranchingVisualizer: React.FC = () => {
  const [score, setScore] = useState(78);

  const branch =
    score >= 90
      ? { id: 'if', label: '條件成立：優等 (A)', status: 'nominal' }
      : score >= 60
      ? { id: 'elif', label: '條件成立：及格 (B)', status: 'nominal' }
      : { id: 'else', label: '進入保底：需補強 (C)', status: 'warn' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">互動模型：if / elif / else 流程路徑追蹤</h3>
        <span className="text-xs font-mono font-medium text-slate-700 tabular-nums">
          score = {score}
        </span>
      </div>

      <label className="block space-y-1.5">
        <div className="flex justify-between text-xs text-slate-600">
          <span>拖動調整分數 (0 – 100 分)</span>
          <span className="tabular-nums font-medium">{score} 分</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          className="w-full accent-sky-600 cursor-pointer"
        />
      </label>

      <div className="space-y-2 font-mono text-xs">
        <div
          className={`p-2.5 rounded-lg border transition-colors ${
            branch.id === 'if'
              ? 'bg-sky-50 border-sky-300 text-sky-900 font-semibold'
              : 'bg-white border-slate-200 text-slate-400'
          }`}
        >
          if score &gt;= 90: → grade = &quot;A&quot;
        </div>
        <div
          className={`p-2.5 rounded-lg border transition-colors ${
            branch.id === 'elif'
              ? 'bg-sky-50 border-sky-300 text-sky-900 font-semibold'
              : 'bg-white border-slate-200 text-slate-400'
          }`}
        >
          elif score &gt;= 60: → grade = &quot;B&quot;
        </div>
        <div
          className={`p-2.5 rounded-lg border transition-colors ${
            branch.id === 'else'
              ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
              : 'bg-white border-slate-200 text-slate-400'
          }`}
        >
          else: → grade = &quot;C&quot;
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs font-medium text-slate-800">
        {branch.status === 'nominal' ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        )}
        <span>{branch.label}</span>
      </div>
    </div>
  );
};

const LoopVisualizer: React.FC = () => {
  const [stopVal, setStopVal] = useState(5);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  const items = Array.from({ length: stopVal }, (_, i) => i + 1);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= items.length) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 650);
    return () => window.clearInterval(timer);
  }, [playing, items.length]);

  const runningSum = items.slice(0, stepIdx).reduce((acc, v) => acc + v, 0);
  const currentI = stepIdx > 0 && stepIdx <= items.length ? items[stepIdx - 1] : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">互動模型：迴圈單步追蹤器</h3>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              if (stepIdx >= items.length) setStepIdx(0);
              setPlaying((p) => !p);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 cursor-pointer"
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {playing ? '暫停' : '播放'}
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setStepIdx((prev) => Math.min(items.length, prev + 1));
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5" />
            單步
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setStepIdx(0);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重置
          </button>
        </div>
      </div>

      <label className="block space-y-1">
        <div className="flex justify-between text-xs text-slate-600">
          <span>次數上限：range(1, {stopVal + 1})</span>
          <span className="tabular-nums">{stopVal} 輪</span>
        </div>
        <input
          type="range"
          min={3}
          max={8}
          value={stopVal}
          onChange={(e) => {
            setPlaying(false);
            setStepIdx(0);
            setStopVal(Number(e.target.value));
          }}
          className="w-full accent-sky-600 cursor-pointer"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        {items.map((val, idx) => {
          const isCurrent = idx === stepIdx - 1;
          const isDone = idx < stepIdx - 1;
          return (
            <div
              key={val}
              className={`w-10 h-10 rounded-lg border flex flex-col items-center justify-center font-mono text-xs tabular-nums transition-colors ${
                isCurrent
                  ? 'bg-sky-600 border-sky-600 text-white font-semibold'
                  : isDone
                  ? 'bg-sky-50 border-sky-200 text-sky-800'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              <span>{val}</span>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 font-mono text-xs text-slate-700 tabular-nums">
        <span>目前 i = {currentI ?? '尚未開始'}</span>
        <span>累計 total = {runningSum}</span>
        <span>
          進度：{stepIdx} / {items.length}
        </span>
      </div>
    </div>
  );
};

const ListVisualizer: React.FC = () => {
  const items = ['"Py"', '"Go"', '"JS"', '"Rust"', '"SQL"'];
  const [start, setStart] = useState(1);
  const [end, setEnd] = useState(4);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">互動模型：串列索引與切片 [start:end]</h3>
        <span className="font-mono text-xs text-sky-700 font-semibold">
          langs[{start}:{end}]
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="block space-y-1">
          <div className="flex justify-between text-xs text-slate-600">
            <span>起始索引 start</span>
            <span className="font-mono tabular-nums">{start}</span>
          </div>
          <input
            type="range"
            min={0}
            max={4}
            value={start}
            onChange={(e) => setStart(Number(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer"
          />
        </label>
        <label className="block space-y-1">
          <div className="flex justify-between text-xs text-slate-600">
            <span>結束索引 end（不含）</span>
            <span className="font-mono tabular-nums">{end}</span>
          </div>
          <input
            type="range"
            min={0}
            max={5}
            value={end}
            onChange={(e) => setEnd(Number(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer"
          />
        </label>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {items.map((item, idx) => {
          const active = idx >= start && idx < end;
          return (
            <div
              key={item}
              className={`rounded-lg border p-2 text-center font-mono transition-colors ${
                active
                  ? 'bg-sky-50 border-sky-400 text-sky-900'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              <div className="text-[11px] tabular-nums">[{idx}]</div>
              <div className="text-xs font-semibold my-1">{item}</div>
              <div className="text-[11px] tabular-nums">[{idx - items.length}]</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DictVisualizer: React.FC = () => {
  const dict: Record<string, number> = { apple: 20, banana: 8, orange: 15 };
  const [queryKey, setQueryKey] = useState('apple');
  const found = queryKey in dict;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">互動模型：字典 .get(key, 0) 安全查詢</h3>
        <span className="text-xs text-slate-500">點選鍵名測試查詢結果</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {['apple', 'banana', 'orange', 'mango'].map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setQueryKey(k)}
            className={`px-3 py-1.5 font-mono text-xs rounded-md border transition-colors cursor-pointer ${
              queryKey === k
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            &quot;{k}&quot;
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-3.5 font-mono text-xs space-y-1.5">
        <div className="text-slate-600">
          inventory.get(&quot;{queryKey}&quot;, 0)
        </div>
        <div className="flex items-center gap-2 text-slate-900 font-semibold">
          <span>回傳值：{found ? dict[queryKey] : 0}</span>
          <span className="text-slate-400">·</span>
          <span className={found ? 'text-emerald-700' : 'text-amber-700'}>
            {found ? '命中字典鍵值' : '鍵不存在，安全回傳預設值 0'}
          </span>
        </div>
      </div>
    </div>
  );
};

const FunctionVisualizer: React.FC = () => {
  const [price, setPrice] = useState(1000);
  const [rate, setRate] = useState(0.8);
  const output = Math.round(price * rate);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">互動模型：函式參數輸入與 return 回傳</h3>
        <span className="font-mono text-xs text-sky-700 tabular-nums">
          apply_discount({price}, {rate})
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="block space-y-1">
          <div className="flex justify-between text-xs text-slate-600">
            <span>原價 price</span>
            <span className="font-mono tabular-nums">{price}</span>
          </div>
          <input
            type="range"
            min={200}
            max={2000}
            step={100}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer"
          />
        </label>
        <label className="block space-y-1">
          <div className="flex justify-between text-xs text-slate-600">
            <span>折扣率 rate</span>
            <span className="font-mono tabular-nums">{rate.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={1.0}
            step={0.05}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer"
          />
        </label>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
        <span className="text-slate-600">輸入 ({price}, {rate.toFixed(2)})</span>
        <ArrowRight className="w-4 h-4 text-slate-400" />
        <span className="text-slate-700">round(price * rate)</span>
        <ArrowRight className="w-4 h-4 text-slate-400" />
        <span className="text-emerald-700 font-semibold tabular-nums">return {output}</span>
      </div>
    </div>
  );
};
