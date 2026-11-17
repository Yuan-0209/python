import React, { useRef, useState } from 'react';
import { Play, RotateCcw, CheckCircle2, AlertCircle, Terminal, Keyboard } from 'lucide-react';
import { PythonExecutionResult, runPythonCode } from '../utils/pythonRunner';
import { ValidationResult } from '../types/curriculum';

interface CodePlaygroundProps {
  code: string;
  onChangeCode: (newCode: string) => void;
  onResetCode?: () => void;
  onValidate?: (output: string, code: string) => ValidationResult;
  onPassed?: () => void;
  showReset?: boolean;
  title?: string;
}

export const CodePlayground: React.FC<CodePlaygroundProps> = ({
  code,
  onChangeCode,
  onResetCode,
  onValidate,
  onPassed,
  showReset = true,
  title = 'main.py',
}) => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<PythonExecutionResult | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [stdinOpen, setStdinOpen] = useState(false);
  const [stdinText, setStdinText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lines = code.split('\n');

  const execute = async (shouldVerify: boolean) => {
    setRunning(true);
    setValidation(null);
    const res = await runPythonCode(code, stdinText);
    setResult(res);
    setRunning(false);

    if (shouldVerify && onValidate) {
      if (res.stderr) {
        setValidation({
          passed: false,
          message: '程式執行發生錯誤，請先修正終端機中的錯誤訊息後再驗證。',
        });
      } else {
        const check = onValidate(res.stdout, code);
        setValidation(check);
        if (check.passed && onPassed) {
          onPassed();
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void execute(Boolean(onValidate));
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const updated = code.substring(0, start) + '    ' + code.substring(end);
      onChangeCode(updated);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 4;
          textareaRef.current.selectionEnd = start + 4;
        }
      });
    }
  };

  return (
    <div className="flex flex-col bg-[#0F172A] text-slate-100 rounded-xl overflow-hidden border border-slate-800 shadow-sm">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-medium text-slate-300">{title}</span>
          <span className="text-xs text-slate-500 hidden sm:inline">Ctrl + Enter 執行</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStdinOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              stdinOpen
                ? 'bg-slate-800 border-slate-600 text-slate-100'
                : 'border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            標準輸入
          </button>

          {showReset && onResetCode && (
            <button
              type="button"
              onClick={() => {
                onResetCode();
                setResult(null);
                setValidation(null);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 border border-slate-700 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重置程式碼
            </button>
          )}

          <button
            type="button"
            disabled={running}
            onClick={() => void execute(false)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-sky-600 text-white rounded-md hover:bg-sky-500 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            {running ? '執行中...' : '執行程式'}
          </button>

          {onValidate && (
            <button
              type="button"
              disabled={running}
              onClick={() => void execute(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-500 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              驗證任務
            </button>
          )}
        </div>
      </div>

      {/* Optional Stdin Input Box */}
      {stdinOpen && (
        <div className="px-4 py-2.5 bg-slate-900/70 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center gap-2">
          <label htmlFor="python-stdin" className="text-xs text-slate-400 shrink-0">
            模擬 input() 輸入（每行一筆）：
          </label>
          <input
            id="python-stdin"
            type="text"
            value={stdinText}
            onChange={(e) => setStdinText(e.target.value)}
            placeholder="例如：小明"
            className="flex-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
          />
        </div>
      )}

      {/* Code Editing Area with Line Numbers */}
      <div className="relative flex min-h-[260px] max-h-[380px] overflow-auto bg-[#0F172A]">
        <div
          aria-hidden="true"
          className="select-none py-4 pl-3 pr-3 text-right font-mono text-xs leading-6 text-slate-600 bg-slate-950/40 border-r border-slate-800/80 tabular-nums shrink-0"
        >
          {lines.map((_, idx) => (
            <div key={idx}>{idx + 1}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          aria-label="Python 程式碼編輯器"
          spellCheck={false}
          value={code}
          onChange={(e) => onChangeCode(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={Math.max(10, lines.length + 1)}
          className="code-editor w-full resize-none bg-transparent py-4 px-4 font-mono text-[13.5px] leading-6 text-slate-100 focus:outline-none selection:bg-sky-500/30"
        />
      </div>

      {/* Output Terminal */}
      <div className="border-t border-slate-800 bg-[#020617]">
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/70">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Terminal className="w-3.5 h-3.5" />
            <span>終端機輸出</span>
          </div>
          {result && (
            <span className="text-xs text-slate-500 tabular-nums">
              耗時 {result.durationMs} ms
            </span>
          )}
        </div>

        <div className="p-4 min-h-[120px] max-h-[220px] overflow-auto font-mono text-xs leading-6">
          {!result && (
            <p className="text-slate-500">
              點擊上方「執行程式」即可立即查看 Python 執行結果。
            </p>
          )}

          {result && !result.stderr && result.stdout === '' && (
            <p className="text-slate-500">（程式執行完畢，沒有任何 print() 輸出內容）</p>
          )}

          {result && result.stdout !== '' && (
            <pre className="whitespace-pre-wrap text-slate-100">{result.stdout}</pre>
          )}

          {result && result.stderr && (
            <pre className="whitespace-pre-wrap text-rose-400 mt-1">{result.stderr}</pre>
          )}
        </div>

        {/* Auto-grader Validation Result */}
        {validation && (
          <div
            className={`px-4 py-3 border-t flex items-start gap-2.5 text-xs ${
              validation.passed
                ? 'bg-emerald-950/60 border-emerald-800/70 text-emerald-200'
                : 'bg-amber-950/60 border-amber-800/70 text-amber-200'
            }`}
          >
            {validation.passed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-semibold mr-1.5">
                {validation.passed ? '通過驗證：' : '尚未通過：'}
              </span>
              <span>{validation.message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
