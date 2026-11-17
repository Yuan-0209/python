export interface PythonExecutionResult {
  stdout: string;
  stderr: string;
  engine: 'pyodide' | 'builtin';
  durationMs: number;
}

interface PyodideInstance {
  runPythonAsync: (code: string) => Promise<unknown>;
  globals: {
    set: (key: string, value: unknown) => void;
  };
  setStdout: (options: { batched: (text: string) => void }) => void;
  setStderr: (options: { batched: (text: string) => void }) => void;
}

declare global {
  interface Window {
    loadPyodide?: (config?: { indexURL?: string }) => Promise<PyodideInstance>;
  }
}

let pyodidePromise: Promise<PyodideInstance | null> | null = null;
let pyodideFailed = false;

async function getPyodide(): Promise<PyodideInstance | null> {
  if (pyodideFailed) return null;
  if (pyodidePromise) return pyodidePromise;

  pyodidePromise = (async () => {
    try {
      if (!window.loadPyodide) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
          script.async = true;
          const timer = window.setTimeout(() => {
            reject(new Error('Pyodide load timeout'));
          }, 6000);
          script.onload = () => {
            window.clearTimeout(timer);
            resolve();
          };
          script.onerror = () => {
            window.clearTimeout(timer);
            reject(new Error('Pyodide script failed'));
          };
          document.head.appendChild(script);
        });
      }

      if (!window.loadPyodide) {
        pyodideFailed = true;
        return null;
      }

      const instance = await Promise.race([
        window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
        }),
        new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 9000)),
      ]);

      if (!instance) {
        pyodideFailed = true;
        return null;
      }
      return instance;
    } catch {
      pyodideFailed = true;
      return null;
    }
  })();

  return pyodidePromise;
}

export async function runPythonCode(
  code: string,
  stdinText = ''
): Promise<PythonExecutionResult> {
  const start = performance.now();
  const pyodide = await getPyodide();

  if (pyodide) {
    const outLines: string[] = [];
    const errLines: string[] = [];

    try {
      pyodide.setStdout({
        batched: (text: string) => outLines.push(text),
      });
      pyodide.setStderr({
        batched: (text: string) => errLines.push(text),
      });

      const stdinLines = stdinText.split('\n');
      pyodide.globals.set('__pylab_stdin_lines__', stdinLines);

      const setupPrelude = `
import builtins
_pylab_stdin_idx = 0
def _pylab_input(prompt=""):
    global _pylab_stdin_idx
    if prompt:
        print(prompt, end="")
    lines = list(__pylab_stdin_lines__)
    if _pylab_stdin_idx < len(lines) and (len(lines) > 1 or lines[0] != ""):
        val = lines[_pylab_stdin_idx]
        _pylab_stdin_idx += 1
        print(val)
        return val
    return ""
builtins.input = _pylab_input
`;
      await pyodide.runPythonAsync(setupPrelude);
      await pyodide.runPythonAsync(code);

      return {
        stdout: outLines.join('\n'),
        stderr: errLines.join('\n'),
        engine: 'pyodide',
        durationMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        stdout: outLines.join('\n'),
        stderr: formatFriendlyPythonError(msg),
        engine: 'pyodide',
        durationMs: Math.round(performance.now() - start),
      };
    }
  }

  // Built-in deterministic Python 3 subset interpreter fallback (works offline/hermetically)
  const fallback = executeBuiltinPython(code, stdinText);
  return {
    ...fallback,
    engine: 'builtin',
    durationMs: Math.round(performance.now() - start),
  };
}

function formatFriendlyPythonError(raw: string): string {
  const lines = raw.trim().split('\n');
  const lastLine = lines[lines.length - 1] || raw;
  return `${raw}\n\n提示：${translateErrorHint(lastLine)}`;
}

function translateErrorHint(lastLine: string): string {
  if (lastLine.includes('SyntaxError')) {
    return '語法錯誤，請檢查括號是否成對、字串引號是否閉合，或 if / for / def 行尾是否加上冒號 (:) 。';
  }
  if (lastLine.includes('IndentationError')) {
    return '縮排錯誤，Python 依靠 4 個空格縮排來區分程式區塊，請檢查縮排是否對齊。';
  }
  if (lastLine.includes('NameError')) {
    return '找不到變數或函式名稱，請確認名稱拼寫是否正確，以及是否在使用前完成賦值。';
  }
  if (lastLine.includes('TypeError')) {
    return '資料型別不相容（例如將字串與數字直接相加），可使用 str() 或 int() 進行型別轉換。';
  }
  if (lastLine.includes('ZeroDivisionError')) {
    return '數學錯誤：除數不可為 0。';
  }
  if (lastLine.includes('IndexError')) {
    return '索引超出範圍，請確認串列長度與存取的索引位置（索引從 0 開始）。';
  }
  if (lastLine.includes('KeyError')) {
    return '字典中找不到指定的鍵 (Key)，建議改用 dict.get(key, 預設值) 安全讀取。';
  }
  if (lastLine.includes('ValueError')) {
    return '傳入的值格式不正確（例如嘗試將非數字文字轉成 int()）。';
  }
  return '請依據上方行號檢查程式碼邏輯與語法。';
}

/* --------------------------------------------------------------------------
 * Built-in Python 3 Subset Interpreter (Hermetic Offline Fallback)
 * Supports: variables, numbers, strings, f-strings, booleans, None, lists,
 * dicts, sets, tuples, slicing, comprehensions, arithmetic/logic operators,
 * if/elif/else, for/while/break/continue, def/return, try/except, and core
 * built-in functions & methods.
 * -------------------------------------------------------------------------- */

type PyVal = unknown;

class ReturnSignal {
  constructor(public value: PyVal) {}
}
class BreakSignal {}
class ContinueSignal {}
class PyRuntimeError extends Error {
  constructor(public pyType: string, message: string, public lineNo?: number) {
    super(`${pyType}: ${message}`);
  }
}

class PySet {
  items: Set<string>;
  raw: Map<string, PyVal>;
  constructor(iterable: PyVal[] = []) {
    this.items = new Set();
    this.raw = new Map();
    for (const v of iterable) {
      const k = pyRepr(v);
      this.items.add(k);
      this.raw.set(k, v);
    }
  }
  toArray(): PyVal[] {
    return Array.from(this.raw.values());
  }
}

class PyTuple {
  constructor(public items: PyVal[]) {}
}

function isPlainObject(v: unknown): v is Record<string, PyVal> {
  return (
    typeof v === 'object' &&
    v !== null &&
    !Array.isArray(v) &&
    !(v instanceof PySet) &&
    !(v instanceof PyTuple)
  );
}

function pyTruthy(v: PyVal): boolean {
  if (v === null || v === undefined || v === false) return false;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return v.length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (v instanceof PySet) return v.items.size > 0;
  if (v instanceof PyTuple) return v.items.length > 0;
  if (isPlainObject(v)) return Object.keys(v).length > 0;
  return Boolean(v);
}

function pyStr(v: PyVal): string {
  if (v === null || v === undefined) return 'None';
  if (v === true) return 'True';
  if (v === false) return 'False';
  if (typeof v === 'number') return Object.is(v, -0) ? '0' : String(v);
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return `[${v.map(pyRepr).join(', ')}]`;
  if (v instanceof PyTuple) {
    if (v.items.length === 1) return `(${pyRepr(v.items[0])},)`;
    return `(${v.items.map(pyRepr).join(', ')})`;
  }
  if (v instanceof PySet) {
    const arr = v.toArray();
    return arr.length === 0 ? 'set()' : `{${arr.map(pyRepr).join(', ')}}`;
  }
  if (isPlainObject(v)) {
    const entries = Object.entries(v).map(([k, val]) => `'${k}': ${pyRepr(val)}`);
    return `{${entries.join(', ')}}`;
  }
  return String(v);
}

function pyRepr(v: PyVal): string {
  if (typeof v === 'string') {
    if (v.includes("'") && !v.includes('"')) return `"${v}"`;
    return `'${v}'`;
  }
  return pyStr(v);
}

function pyTypeName(v: PyVal): string {
  if (v === null || v === undefined) return 'NoneType';
  if (typeof v === 'boolean') return 'bool';
  if (typeof v === 'number') return Number.isInteger(v) ? 'int' : 'float';
  if (typeof v === 'string') return 'str';
  if (Array.isArray(v)) return 'list';
  if (v instanceof PyTuple) return 'tuple';
  if (v instanceof PySet) return 'set';
  if (isPlainObject(v)) return 'dict';
  if (typeof v === 'function') return 'function';
  return 'object';
}

function pyEqual(a: PyVal, b: PyVal): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => pyEqual(x, b[i]));
  }
  if (a instanceof PyTuple && b instanceof PyTuple) {
    return a.items.length === b.items.length && a.items.every((x, i) => pyEqual(x, b.items[i]));
  }
  if (typeof a === 'boolean' && typeof b === 'number') return Number(a) === b;
  if (typeof a === 'number' && typeof b === 'boolean') return a === Number(b);
  return a === b;
}

function toIterable(v: PyVal, lineNo?: number): PyVal[] {
  if (Array.isArray(v)) return v;
  if (v instanceof PyTuple) return v.items;
  if (v instanceof PySet) return v.toArray();
  if (typeof v === 'string') return v.split('');
  if (isPlainObject(v)) return Object.keys(v);
  throw new PyRuntimeError('TypeError', `'${pyTypeName(v)}' object is not iterable`, lineNo);
}

interface ParsedLine {
  lineNo: number;
  indent: number;
  text: string;
}

function stripComment(line: string): string {
  let quote: string | null = null;
  let escaped = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (quote) {
      if (ch === quote) quote = null;
    } else {
      if (ch === '"' || ch === "'") {
        quote = ch;
      } else if (ch === '#') {
        return line.slice(0, i);
      }
    }
  }
  return line;
}

function preprocessLines(code: string): ParsedLine[] {
  const rawLines = code.replace(/\r\n/g, '\n').split('\n');
  const result: ParsedLine[] = [];
  let inTriple: string | null = null;

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    if (inTriple) {
      if (raw.includes(inTriple)) inTriple = null;
      continue;
    }
    const trimmed = raw.trim();
    if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
      const marker = trimmed.slice(0, 3);
      if (trimmed.indexOf(marker, 3) === -1) {
        inTriple = marker;
      }
      continue;
    }
    const clean = stripComment(raw);
    if (!clean.trim()) continue;
    const expanded = clean.replace(/\t/g, '    ');
    const indentMatch = expanded.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;
    result.push({
      lineNo: i + 1,
      indent,
      text: expanded.trim(),
    });
  }
  return result;
}

type Env = Record<string, PyVal>;

interface UserFunc {
  params: { name: string; defaultExpr?: string }[];
  body: ParsedLine[];
  closure: Env;
}

function executeBuiltinPython(
  code: string,
  stdinText: string
): Omit<PythonExecutionResult, 'engine' | 'durationMs'> {
  const output: string[] = [];
  const stdinLines = stdinText.split('\n');
  let stdinIdx = 0;
  let stepCount = 0;
  const MAX_STEPS = 25000;

  const builtinsEnv: Env = {
    True: true,
    False: false,
    None: null,
    print: (...args: PyVal[]) => {
      let sep = ' ';
      let end = '\n';
      const positional: PyVal[] = [];
      for (const a of args) {
        if (isKwargMarker(a)) {
          if (a.key === 'sep') sep = pyStr(a.value);
          else if (a.key === 'end') end = pyStr(a.value);
        } else {
          positional.push(a);
        }
      }
      const line = positional.map((x) => pyStr(x)).join(sep);
      if (end === '\n') {
        output.push(line);
      } else {
        if (output.length === 0) output.push(line + end);
        else output[output.length - 1] += line + end;
      }
      return null;
    },
    input: (prompt: PyVal = '') => {
      const p = pyStr(prompt);
      const val =
        stdinIdx < stdinLines.length && (stdinLines.length > 1 || stdinLines[0] !== '')
          ? stdinLines[stdinIdx++]
          : '';
      output.push(p + val);
      return val;
    },
    len: (obj: PyVal) => {
      if (typeof obj === 'string' || Array.isArray(obj)) return obj.length;
      if (obj instanceof PyTuple) return obj.items.length;
      if (obj instanceof PySet) return obj.items.size;
      if (isPlainObject(obj)) return Object.keys(obj).length;
      throw new PyRuntimeError('TypeError', `object of type '${pyTypeName(obj)}' has no len()`);
    },
    range: (...args: PyVal[]) => {
      const nums = args.map((n) => Number(n));
      let start = 0;
      let stop = 0;
      let step = 1;
      if (nums.length === 1) stop = nums[0];
      else if (nums.length === 2) [start, stop] = nums;
      else if (nums.length === 3) [start, stop, step] = nums;
      else throw new PyRuntimeError('TypeError', 'range expected 1 to 3 arguments');
      if (step === 0) throw new PyRuntimeError('ValueError', 'range() arg 3 must not be zero');
      const res: number[] = [];
      if (step > 0) {
        for (let i = start; i < stop; i += step) res.push(i);
      } else {
        for (let i = start; i > stop; i += step) res.push(i);
      }
      return res;
    },
    int: (v: PyVal) => {
      if (typeof v === 'boolean') return v ? 1 : 0;
      const n = parseInt(String(v), 10);
      if (Number.isNaN(n)) throw new PyRuntimeError('ValueError', `invalid literal for int(): '${v}'`);
      return n;
    },
    float: (v: PyVal) => {
      const n = parseFloat(String(v));
      if (Number.isNaN(n)) throw new PyRuntimeError('ValueError', `could not convert string to float: '${v}'`);
      return n;
    },
    str: (v: PyVal) => pyStr(v),
    bool: (v: PyVal) => pyTruthy(v),
    list: (v: PyVal = []) => [...toIterable(v)],
    set: (v: PyVal = []) => new PySet(toIterable(v)),
    tuple: (v: PyVal = []) => new PyTuple(toIterable(v)),
    dict: () => ({}),
    type: (v: PyVal) => `<class '${pyTypeName(v)}'>`,
    sum: (v: PyVal, start: PyVal = 0) =>
      toIterable(v).reduce<number>((acc, cur) => acc + Number(cur), Number(start)),
    max: (...args: PyVal[]) => {
      const arr = args.length === 1 ? toIterable(args[0]) : args;
      if (arr.length === 0) throw new PyRuntimeError('ValueError', 'max() arg is an empty sequence');
      return arr.reduce((a, b) => (Number(b) > Number(a) ? b : a));
    },
    min: (...args: PyVal[]) => {
      const arr = args.length === 1 ? toIterable(args[0]) : args;
      if (arr.length === 0) throw new PyRuntimeError('ValueError', 'min() arg is an empty sequence');
      return arr.reduce((a, b) => (Number(b) < Number(a) ? b : a));
    },
    abs: (v: PyVal) => Math.abs(Number(v)),
    round: (v: PyVal, ndigits?: PyVal) => {
      const n = Number(v);
      if (ndigits === undefined) return Math.round(n);
      const factor = 10 ** Number(ndigits);
      return Math.round(n * factor) / factor;
    },
    sorted: (v: PyVal, ...rest: PyVal[]) => {
      let reverse = false;
      for (const r of rest) {
        if (isKwargMarker(r) && r.key === 'reverse') reverse = pyTruthy(r.value);
      }
      const arr = [...toIterable(v)];
      arr.sort((a, b) => {
        if (typeof a === 'number' && typeof b === 'number') return a - b;
        return pyStr(a).localeCompare(pyStr(b));
      });
      return reverse ? arr.reverse() : arr;
    },
    enumerate: (v: PyVal, start: PyVal = 0) => {
      const s = Number(start);
      return toIterable(v).map((item, idx) => new PyTuple([s + idx, item]));
    },
    zip: (...args: PyVal[]) => {
      const lists = args.map((a) => toIterable(a));
      const minLen = Math.min(...lists.map((l) => l.length));
      const res: PyTuple[] = [];
      for (let i = 0; i < minLen; i++) {
        res.push(new PyTuple(lists.map((l) => l[i])));
      }
      return res;
    },
  };

  const globalEnv: Env = Object.create(builtinsEnv);

  function tick(lineNo: number) {
    stepCount++;
    if (stepCount > MAX_STEPS) {
      throw new PyRuntimeError('RuntimeError', '執行步數超過上限，請檢查是否有無窮迴圈', lineNo);
    }
  }

  function execBlock(lines: ParsedLine[], startIdx: number, expectedIndent: number, env: Env): number {
    let i = startIdx;
    while (i < lines.length) {
      const line = lines[i];
      if (line.indent < expectedIndent) break;
      if (line.indent > expectedIndent) {
        throw new PyRuntimeError('IndentationError', 'unexpected indent', line.lineNo);
      }
      tick(line.lineNo);

      const text = line.text;

      // Multi-statement block checks
      if (text.startsWith('if ') && text.endsWith(':')) {
        let executed = false;
        const condExpr = text.slice(3, -1).trim();
        const blockStart = i + 1;
        const blockEnd = findBlockEnd(lines, blockStart, expectedIndent);
        if (pyTruthy(evalExpr(condExpr, env, line.lineNo))) {
          executed = true;
          if (blockStart < blockEnd) {
            execBlock(lines, blockStart, lines[blockStart].indent, env);
          }
        }
        i = blockEnd;
        while (i < lines.length && lines[i].indent === expectedIndent) {
          const nextText = lines[i].text;
          if (nextText.startsWith('elif ') && nextText.endsWith(':')) {
            const elifCond = nextText.slice(5, -1).trim();
            const bStart = i + 1;
            const bEnd = findBlockEnd(lines, bStart, expectedIndent);
            if (!executed && pyTruthy(evalExpr(elifCond, env, lines[i].lineNo))) {
              executed = true;
              if (bStart < bEnd) execBlock(lines, bStart, lines[bStart].indent, env);
            }
            i = bEnd;
          } else if (nextText === 'else:') {
            const bStart = i + 1;
            const bEnd = findBlockEnd(lines, bStart, expectedIndent);
            if (!executed && bStart < bEnd) {
              execBlock(lines, bStart, lines[bStart].indent, env);
            }
            i = bEnd;
            break;
          } else {
            break;
          }
        }
        continue;
      }

      if (text.startsWith('for ') && text.endsWith(':')) {
        const match = text.slice(4, -1).match(/^(.+?)\s+in\s+(.+)$/);
        if (!match) throw new PyRuntimeError('SyntaxError', 'invalid for syntax', line.lineNo);
        const target = match[1].trim();
        const iterVal = toIterable(evalExpr(match[2].trim(), env, line.lineNo), line.lineNo);
        const bStart = i + 1;
        const bEnd = findBlockEnd(lines, bStart, expectedIndent);
        if (bStart < bEnd) {
          for (const item of iterVal) {
            tick(line.lineNo);
            assignTarget(target, item, env, line.lineNo);
            try {
              execBlock(lines, bStart, lines[bStart].indent, env);
            } catch (sig) {
              if (sig instanceof BreakSignal) break;
              if (sig instanceof ContinueSignal) continue;
              throw sig;
            }
          }
        }
        i = bEnd;
        continue;
      }

      if (text.startsWith('while ') && text.endsWith(':')) {
        const condExpr = text.slice(6, -1).trim();
        const bStart = i + 1;
        const bEnd = findBlockEnd(lines, bStart, expectedIndent);
        if (bStart < bEnd) {
          while (pyTruthy(evalExpr(condExpr, env, line.lineNo))) {
            tick(line.lineNo);
            try {
              execBlock(lines, bStart, lines[bStart].indent, env);
            } catch (sig) {
              if (sig instanceof BreakSignal) break;
              if (sig instanceof ContinueSignal) continue;
              throw sig;
            }
          }
        }
        i = bEnd;
        continue;
      }

      if (text.startsWith('def ') && text.endsWith(':')) {
        const match = text.slice(4, -1).match(/^([A-Za-z_]\w*)\s*\((.*)\)$/);
        if (!match) throw new PyRuntimeError('SyntaxError', 'invalid function definition', line.lineNo);
        const fnName = match[1];
        const rawParams = splitTopLevel(match[2], ',').filter(Boolean);
        const params = rawParams.map((p) => {
          const eqIdx = findTopLevelChar(p, '=');
          if (eqIdx !== -1) {
            return {
              name: p.slice(0, eqIdx).trim(),
              defaultExpr: p.slice(eqIdx + 1).trim(),
            };
          }
          return { name: p.trim() };
        });
        const bStart = i + 1;
        const bEnd = findBlockEnd(lines, bStart, expectedIndent);
        const body = lines.slice(bStart, bEnd);
        const fnObj: UserFunc = { params, body, closure: env };
        const callable = (...callArgs: PyVal[]) => {
          const localEnv: Env = Object.create(fnObj.closure);
          let posIdx = 0;
          const kwMap: Record<string, PyVal> = {};
          for (const a of callArgs) {
            if (isKwargMarker(a)) kwMap[a.key] = a.value;
          }
          for (const param of fnObj.params) {
            if (param.name in kwMap) {
              localEnv[param.name] = kwMap[param.name];
            } else if (posIdx < callArgs.length && !isKwargMarker(callArgs[posIdx])) {
              localEnv[param.name] = callArgs[posIdx++];
            } else if (param.defaultExpr !== undefined) {
              localEnv[param.name] = evalExpr(param.defaultExpr, fnObj.closure, line.lineNo);
            } else {
              throw new PyRuntimeError('TypeError', `${fnName}() missing required argument: '${param.name}'`, line.lineNo);
            }
          }
          try {
            if (fnObj.body.length > 0) {
              execBlock(fnObj.body, 0, fnObj.body[0].indent, localEnv);
            }
            return null;
          } catch (sig) {
            if (sig instanceof ReturnSignal) return sig.value;
            throw sig;
          }
        };
        env[fnName] = callable;
        i = bEnd;
        continue;
      }

      if (text === 'try:') {
        const bStart = i + 1;
        const bEnd = findBlockEnd(lines, bStart, expectedIndent);
        let caught = false;
        try {
          if (bStart < bEnd) execBlock(lines, bStart, lines[bStart].indent, env);
        } catch (err) {
          if (err instanceof ReturnSignal || err instanceof BreakSignal || err instanceof ContinueSignal) {
            throw err;
          }
          caught = true;
          let j = bEnd;
          let handled = false;
          while (j < lines.length && lines[j].indent === expectedIndent && lines[j].text.startsWith('except')) {
            const exText = lines[j].text;
            const exStart = j + 1;
            const exEnd = findBlockEnd(lines, exStart, expectedIndent);
            const errType = err instanceof PyRuntimeError ? err.pyType : 'Exception';
            const header = exText.slice(6, -1).trim();
            if (!header || header.startsWith('Exception') || header.includes(errType)) {
              const asMatch = header.match(/\bas\s+([A-Za-z_]\w*)$/);
              if (asMatch) env[asMatch[1]] = err instanceof Error ? err.message : String(err);
              if (exStart < exEnd) execBlock(lines, exStart, lines[exStart].indent, env);
              handled = true;
              j = exEnd;
              break;
            }
            j = exEnd;
          }
          if (!handled) throw err;
        }
        let nextIdx = bEnd;
        while (
          nextIdx < lines.length &&
          lines[nextIdx].indent === expectedIndent &&
          (lines[nextIdx].text.startsWith('except') || lines[nextIdx].text === 'finally:')
        ) {
          const fStart = nextIdx + 1;
          const fEnd = findBlockEnd(lines, fStart, expectedIndent);
          if (lines[nextIdx].text === 'finally:' && fStart < fEnd) {
            execBlock(lines, fStart, lines[fStart].indent, env);
          }
          nextIdx = fEnd;
        }
        if (caught) {
          i = nextIdx;
          continue;
        }
        i = nextIdx;
        continue;
      }

      execSimpleStatement(text, env, line.lineNo);
      i++;
    }
    return i;
  }

  function findBlockEnd(lines: ParsedLine[], startIdx: number, parentIndent: number): number {
    let idx = startIdx;
    while (idx < lines.length && lines[idx].indent > parentIndent) {
      idx++;
    }
    return idx;
  }

  function execSimpleStatement(stmt: string, env: Env, lineNo: number) {
    if (stmt === 'pass') return;
    if (stmt === 'break') throw new BreakSignal();
    if (stmt === 'continue') throw new ContinueSignal();
    if (stmt === 'return') throw new ReturnSignal(null);
    if (stmt.startsWith('return ')) {
      const expr = stmt.slice(7).trim();
      throw new ReturnSignal(evalExpr(expr, env, lineNo));
    }

    // Augmented assignments
    const augOps = ['+=', '-=', '*=', '/=', '//=', '%=', '**='];
    for (const op of augOps) {
      const idx = findTopLevelToken(stmt, op);
      if (idx !== -1) {
        const left = stmt.slice(0, idx).trim();
        const right = stmt.slice(idx + op.length).trim();
        const cur = evalExpr(left, env, lineNo);
        const rhs = evalExpr(right, env, lineNo);
        const baseOp = op.slice(0, -1);
        const newVal = applyBinaryOp(baseOp, cur, rhs, lineNo);
        assignTarget(left, newVal, env, lineNo);
        return;
      }
    }

    // Standard assignment
    const eqIdx = findTopLevelAssign(stmt);
    if (eqIdx !== -1) {
      const left = stmt.slice(0, eqIdx).trim();
      const right = stmt.slice(eqIdx + 1).trim();
      const val = evalExpr(right, env, lineNo);
      assignTarget(left, val, env, lineNo);
      return;
    }

    // Expression statement
    evalExpr(stmt, env, lineNo);
  }

  function assignTarget(target: string, val: PyVal, env: Env, lineNo: number) {
    const targets = splitTopLevel(target, ',');
    if (targets.length > 1) {
      const items = toIterable(val, lineNo);
      if (items.length !== targets.length) {
        throw new PyRuntimeError('ValueError', `not enough/too many values to unpack`, lineNo);
      }
      targets.forEach((t, idx) => assignTarget(t.trim(), items[idx], env, lineNo));
      return;
    }

    const bracketIdx = findTopLevelChar(target, '[');
    if (bracketIdx !== -1 && target.endsWith(']')) {
      const containerExpr = target.slice(0, bracketIdx).trim();
      const keyExpr = target.slice(bracketIdx + 1, -1).trim();
      const container = evalExpr(containerExpr, env, lineNo);
      const key = evalExpr(keyExpr, env, lineNo);
      if (Array.isArray(container)) {
        let idx = Number(key);
        if (idx < 0) idx += container.length;
        if (idx < 0 || idx >= container.length) {
          throw new PyRuntimeError('IndexError', 'list assignment index out of range', lineNo);
        }
        container[idx] = val;
        return;
      }
      if (isPlainObject(container)) {
        container[pyStr(key)] = val;
        return;
      }
      throw new PyRuntimeError('TypeError', `'${pyTypeName(container)}' object does not support item assignment`, lineNo);
    }

    if (!/^[A-Za-z_]\w*$/.test(target)) {
      throw new PyRuntimeError('SyntaxError', `cannot assign to '${target}'`, lineNo);
    }
    env[target] = val;
  }

  function evalExpr(expr: string, env: Env, lineNo: number): PyVal {
    const trimmed = expr.trim();
    if (!trimmed) return null;

    // Ternary: a if cond else b
    const ternMatch = splitTernary(trimmed);
    if (ternMatch) {
      const condVal = evalExpr(ternMatch.cond, env, lineNo);
      return pyTruthy(condVal)
        ? evalExpr(ternMatch.ifTrue, env, lineNo)
        : evalExpr(ternMatch.ifFalse, env, lineNo);
    }

    // Tuple without parens (top-level comma)
    const commaParts = splitTopLevel(trimmed, ',');
    if (commaParts.length > 1) {
      return new PyTuple(commaParts.filter(Boolean).map((p) => evalExpr(p, env, lineNo)));
    }

    // Logical OR
    const orParts = splitTopLevelKeyword(trimmed, 'or');
    if (orParts.length > 1) {
      let cur: PyVal = false;
      for (const p of orParts) {
        cur = evalExpr(p, env, lineNo);
        if (pyTruthy(cur)) return cur;
      }
      return cur;
    }

    // Logical AND
    const andParts = splitTopLevelKeyword(trimmed, 'and');
    if (andParts.length > 1) {
      let cur: PyVal = true;
      for (const p of andParts) {
        cur = evalExpr(p, env, lineNo);
        if (!pyTruthy(cur)) return cur;
      }
      return cur;
    }

    // Logical NOT
    if (trimmed.startsWith('not ') && !isWrappedInParens(trimmed)) {
      return !pyTruthy(evalExpr(trimmed.slice(4), env, lineNo));
    }

    // Comparisons (including chained or single)
    const compResult = tryEvalComparison(trimmed, env, lineNo);
    if (compResult !== undefined) return compResult;

    // Addition / Subtraction
    const addSplit = findLastTopLevelBinaryOp(trimmed, ['+', '-']);
    if (addSplit) {
      const l = evalExpr(addSplit.left, env, lineNo);
      const r = evalExpr(addSplit.right, env, lineNo);
      return applyBinaryOp(addSplit.op, l, r, lineNo);
    }

    // Multiplication / Division / Modulo
    const mulSplit = findLastTopLevelBinaryOp(trimmed, ['//', '*', '/', '%']);
    if (mulSplit) {
      const l = evalExpr(mulSplit.left, env, lineNo);
      const r = evalExpr(mulSplit.right, env, lineNo);
      return applyBinaryOp(mulSplit.op, l, r, lineNo);
    }

    // Unary +/-
    if ((trimmed.startsWith('-') || trimmed.startsWith('+')) && isUnaryPrefix(trimmed)) {
      const val = Number(evalExpr(trimmed.slice(1), env, lineNo));
      return trimmed.startsWith('-') ? -val : val;
    }

    // Power **
    const powIdx = findTopLevelToken(trimmed, '**');
    if (powIdx !== -1) {
      const l = evalExpr(trimmed.slice(0, powIdx), env, lineNo);
      const r = evalExpr(trimmed.slice(powIdx + 2), env, lineNo);
      return Number(l) ** Number(r);
    }

    // Literals & primary expressions
    return evalPrimary(trimmed, env, lineNo);
  }

  function tryEvalComparison(expr: string, env: Env, lineNo: number): PyVal | undefined {
    const ops = ['not in', 'in', '==', '!=', '<=', '>=', '<', '>'];
    const found = findFirstTopLevelComp(expr, ops);
    if (!found) return undefined;
    const leftVal = evalExpr(found.left, env, lineNo);
    const rightVal = evalExpr(found.right, env, lineNo);
    switch (found.op) {
      case '==':
        return pyEqual(leftVal, rightVal);
      case '!=':
        return !pyEqual(leftVal, rightVal);
      case '<':
        return (leftVal as number) < (rightVal as number);
      case '>':
        return (leftVal as number) > (rightVal as number);
      case '<=':
        return (leftVal as number) <= (rightVal as number);
      case '>=':
        return (leftVal as number) >= (rightVal as number);
      case 'in':
        return checkIn(leftVal, rightVal, lineNo);
      case 'not in':
        return !checkIn(leftVal, rightVal, lineNo);
    }
    return undefined;
  }

  function checkIn(item: PyVal, container: PyVal, lineNo: number): boolean {
    if (typeof container === 'string') return container.includes(pyStr(item));
    if (Array.isArray(container)) return container.some((x) => pyEqual(x, item));
    if (container instanceof PyTuple) return container.items.some((x) => pyEqual(x, item));
    if (container instanceof PySet) return container.items.has(pyRepr(item));
    if (isPlainObject(container)) return pyStr(item) in container;
    throw new PyRuntimeError('TypeError', `argument of type '${pyTypeName(container)}' is not iterable`, lineNo);
  }

  function applyBinaryOp(op: string, l: PyVal, r: PyVal, lineNo: number): PyVal {
    if (op === '+') {
      if (typeof l === 'string' && typeof r === 'string') return l + r;
      if (Array.isArray(l) && Array.isArray(r)) return [...l, ...r];
      if ((typeof l === 'number' || typeof l === 'boolean') && (typeof r === 'number' || typeof r === 'boolean')) {
        return Number(l) + Number(r);
      }
      throw new PyRuntimeError('TypeError', `unsupported operand type(s) for +: '${pyTypeName(l)}' and '${pyTypeName(r)}'`, lineNo);
    }
    if (op === '*') {
      if (typeof l === 'string' && typeof r === 'number') return l.repeat(Math.max(0, r));
      if (typeof l === 'number' && typeof r === 'string') return r.repeat(Math.max(0, l));
      if (Array.isArray(l) && typeof r === 'number') {
        const res: PyVal[] = [];
        for (let i = 0; i < r; i++) res.push(...l);
        return res;
      }
      return Number(l) * Number(r);
    }
    if (op === '-') return Number(l) - Number(r);
    if (op === '/') {
      if (Number(r) === 0) throw new PyRuntimeError('ZeroDivisionError', 'division by zero', lineNo);
      return Number(l) / Number(r);
    }
    if (op === '//') {
      if (Number(r) === 0) throw new PyRuntimeError('ZeroDivisionError', 'integer division or modulo by zero', lineNo);
      return Math.floor(Number(l) / Number(r));
    }
    if (op === '%') {
      if (Number(r) === 0) throw new PyRuntimeError('ZeroDivisionError', 'integer division or modulo by zero', lineNo);
      const a = Number(l);
      const b = Number(r);
      return ((a % b) + b) % b;
    }
    if (op === '**') return Number(l) ** Number(r);
    throw new PyRuntimeError('SyntaxError', `unsupported operator ${op}`, lineNo);
  }

  function evalPrimary(expr: string, env: Env, lineNo: number): PyVal {
    // Parenthesized expression
    if (expr.startsWith('(') && expr.endsWith(')') && isWrappedInParens(expr)) {
      const inner = expr.slice(1, -1).trim();
      if (inner.endsWith(',')) {
        return new PyTuple([evalExpr(inner.slice(0, -1), env, lineNo)]);
      }
      return evalExpr(inner, env, lineNo);
    }

    // f-string
    if ((expr.startsWith('f"') && expr.endsWith('"')) || (expr.startsWith("f'") && expr.endsWith("'"))) {
      const raw = expr.slice(2, -1);
      return evalFString(raw, env, lineNo);
    }

    // String literal
    if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
      return unescapeString(expr.slice(1, -1));
    }

    // Number literal
    if (/^\d+(\.\d+)?$/.test(expr)) {
      return Number(expr);
    }

    // List literal or list comprehension
    if (expr.startsWith('[') && expr.endsWith(']') && isMatchingBracket(expr, '[', ']')) {
      const inner = expr.slice(1, -1).trim();
      if (!inner) return [];
      const compMatch = matchListComprehension(inner);
      if (compMatch) {
        const res: PyVal[] = [];
        const iter = toIterable(evalExpr(compMatch.iterExpr, env, lineNo), lineNo);
        for (const item of iter) {
          const compEnv = Object.create(env);
          assignTarget(compMatch.varName, item, compEnv, lineNo);
          if (!compMatch.condExpr || pyTruthy(evalExpr(compMatch.condExpr, compEnv, lineNo))) {
            res.push(evalExpr(compMatch.mapExpr, compEnv, lineNo));
          }
        }
        return res;
      }
      return splitTopLevel(inner, ',').filter(Boolean).map((el) => evalExpr(el, env, lineNo));
    }

    // Dict or Set literal
    if (expr.startsWith('{') && expr.endsWith('}') && isMatchingBracket(expr, '{', '}')) {
      const inner = expr.slice(1, -1).trim();
      if (!inner) return {};
      const parts = splitTopLevel(inner, ',').filter(Boolean);
      const firstColon = findTopLevelChar(parts[0], ':');
      if (firstColon !== -1) {
        const obj: Record<string, PyVal> = {};
        for (const p of parts) {
          const cIdx = findTopLevelChar(p, ':');
          if (cIdx === -1) throw new PyRuntimeError('SyntaxError', 'invalid dict literal', lineNo);
          const k = pyStr(evalExpr(p.slice(0, cIdx), env, lineNo));
          const v = evalExpr(p.slice(cIdx + 1), env, lineNo);
          obj[k] = v;
        }
        return obj;
      }
      return new PySet(parts.map((p) => evalExpr(p, env, lineNo)));
    }

    // Identifier
    if (/^[A-Za-z_]\w*$/.test(expr)) {
      if (expr in env) return env[expr];
      throw new PyRuntimeError('NameError', `name '${expr}' is not defined`, lineNo);
    }

    // Postfix chain: calls (), indexing [], attribute .attr
    const postfix = splitLastPostfix(expr);
    if (postfix) {
      if (postfix.kind === 'call') {
        const argStr = postfix.content;
        const args = splitTopLevel(argStr, ',')
          .filter(Boolean)
          .map((a) => {
            const eq = findTopLevelChar(a, '=');
            if (eq !== -1 && a[eq + 1] !== '=' && a[eq - 1] !== '!' && a[eq - 1] !== '<' && a[eq - 1] !== '>') {
              return makeKwargMarker(a.slice(0, eq).trim(), evalExpr(a.slice(eq + 1), env, lineNo));
            }
            return evalExpr(a, env, lineNo);
          });
        // Check method call
        const dotIdx = findLastTopLevelDot(postfix.base);
        if (dotIdx !== -1) {
          const targetObj = evalExpr(postfix.base.slice(0, dotIdx), env, lineNo);
          const methodName = postfix.base.slice(dotIdx + 1).trim();
          return invokeMethod(targetObj, methodName, args, lineNo);
        }
        const fn = evalExpr(postfix.base, env, lineNo);
        if (typeof fn !== 'function') {
          throw new PyRuntimeError('TypeError', `'${pyTypeName(fn)}' object is not callable`, lineNo);
        }
        return fn(...args);
      }

      if (postfix.kind === 'index') {
        const baseVal = evalExpr(postfix.base, env, lineNo);
        const sliceParts = splitTopLevel(postfix.content, ':');
        if (sliceParts.length >= 2) {
          return applySlice(baseVal, sliceParts, env, lineNo);
        }
        const keyVal = evalExpr(postfix.content, env, lineNo);
        if (Array.isArray(baseVal) || typeof baseVal === 'string' || baseVal instanceof PyTuple) {
          const seq = baseVal instanceof PyTuple ? baseVal.items : baseVal;
          let idx = Number(keyVal);
          if (idx < 0) idx += seq.length;
          if (idx < 0 || idx >= seq.length) {
            throw new PyRuntimeError('IndexError', 'index out of range', lineNo);
          }
          return seq[idx];
        }
        if (isPlainObject(baseVal)) {
          const k = pyStr(keyVal);
          if (!(k in baseVal)) throw new PyRuntimeError('KeyError', `'${k}'`, lineNo);
          return baseVal[k];
        }
        throw new PyRuntimeError('TypeError', `'${pyTypeName(baseVal)}' object is not subscriptable`, lineNo);
      }
    }

    throw new PyRuntimeError('SyntaxError', `無法解析運算式：${expr}`, lineNo);
  }

  function applySlice(baseVal: PyVal, sliceParts: string[], env: Env, lineNo: number): PyVal {
    const isStr = typeof baseVal === 'string';
    const arr = isStr
      ? (baseVal as string).split('')
      : Array.isArray(baseVal)
      ? baseVal
      : baseVal instanceof PyTuple
      ? baseVal.items
      : null;
    if (!arr) throw new PyRuntimeError('TypeError', `'${pyTypeName(baseVal)}' object is not sliceable`, lineNo);

    const len = arr.length;
    const step = sliceParts[2]?.trim() ? Number(evalExpr(sliceParts[2], env, lineNo)) : 1;
    if (step === 0) throw new PyRuntimeError('ValueError', 'slice step cannot be zero', lineNo);

    let start = sliceParts[0].trim() ? Number(evalExpr(sliceParts[0], env, lineNo)) : step > 0 ? 0 : len - 1;
    let end = sliceParts[1].trim() ? Number(evalExpr(sliceParts[1], env, lineNo)) : step > 0 ? len : -len - 1;

    if (sliceParts[0].trim() && start < 0) start += len;
    if (sliceParts[1].trim() && end < 0) end += len;

    const out: PyVal[] = [];
    if (step > 0) {
      start = Math.max(0, start);
      end = Math.min(len, end);
      for (let i = start; i < end; i += step) out.push(arr[i]);
    } else {
      start = Math.min(len - 1, start);
      end = Math.max(-1, end);
      for (let i = start; i > end; i += step) out.push(arr[i]);
    }
    if (isStr) return out.join('');
    if (baseVal instanceof PyTuple) return new PyTuple(out);
    return out;
  }

  function invokeMethod(obj: PyVal, method: string, args: PyVal[], lineNo: number): PyVal {
    if (Array.isArray(obj)) {
      if (method === 'append') {
        obj.push(args[0]);
        return null;
      }
      if (method === 'pop') {
        if (obj.length === 0) throw new PyRuntimeError('IndexError', 'pop from empty list', lineNo);
        if (args.length === 0) return obj.pop();
        let idx = Number(args[0]);
        if (idx < 0) idx += obj.length;
        return obj.splice(idx, 1)[0];
      }
      if (method === 'insert') {
        obj.splice(Number(args[0]), 0, args[1]);
        return null;
      }
      if (method === 'remove') {
        const idx = obj.findIndex((x) => pyEqual(x, args[0]));
        if (idx === -1) throw new PyRuntimeError('ValueError', 'list.remove(x): x not in list', lineNo);
        obj.splice(idx, 1);
        return null;
      }
      if (method === 'sort') {
        obj.sort((a, b) => (typeof a === 'number' && typeof b === 'number' ? a - b : pyStr(a).localeCompare(pyStr(b))));
        return null;
      }
      if (method === 'reverse') {
        obj.reverse();
        return null;
      }
      if (method === 'count') {
        return obj.filter((x) => pyEqual(x, args[0])).length;
      }
      if (method === 'index') {
        const idx = obj.findIndex((x) => pyEqual(x, args[0]));
        if (idx === -1) throw new PyRuntimeError('ValueError', `${pyRepr(args[0])} is not in list`, lineNo);
        return idx;
      }
    }

    if (typeof obj === 'string') {
      if (method === 'upper') return obj.toUpperCase();
      if (method === 'lower') return obj.toLowerCase();
      if (method === 'strip') return obj.trim();
      if (method === 'split') {
        if (args.length === 0) return obj.trim() ? obj.trim().split(/\s+/) : [];
        return obj.split(pyStr(args[0]));
      }
      if (method === 'join') {
        return toIterable(args[0], lineNo).map((x) => pyStr(x)).join(obj);
      }
      if (method === 'replace') {
        return obj.split(pyStr(args[0])).join(pyStr(args[1]));
      }
      if (method === 'startswith') return obj.startsWith(pyStr(args[0]));
      if (method === 'endswith') return obj.endsWith(pyStr(args[0]));
      if (method === 'find') return obj.indexOf(pyStr(args[0]));
      if (method === 'isdigit') return /^\d+$/.test(obj);
    }

    if (obj instanceof PySet) {
      if (method === 'add') {
        const k = pyRepr(args[0]);
        obj.items.add(k);
        obj.raw.set(k, args[0]);
        return null;
      }
      if (method === 'remove') {
        const k = pyRepr(args[0]);
        obj.items.delete(k);
        obj.raw.delete(k);
        return null;
      }
    }

    if (isPlainObject(obj)) {
      if (method === 'get') {
        const k = pyStr(args[0]);
        return k in obj ? obj[k] : args.length > 1 ? args[1] : null;
      }
      if (method === 'keys') return Object.keys(obj);
      if (method === 'values') return Object.values(obj);
      if (method === 'items') return Object.entries(obj).map(([k, v]) => new PyTuple([k, v]));
      if (method === 'pop') {
        const k = pyStr(args[0]);
        if (!(k in obj)) {
          if (args.length > 1) return args[1];
          throw new PyRuntimeError('KeyError', `'${k}'`, lineNo);
        }
        const v = obj[k];
        delete obj[k];
        return v;
      }
      if (method === 'update' && isPlainObject(args[0])) {
        Object.assign(obj, args[0]);
        return null;
      }
    }

    throw new PyRuntimeError('AttributeError', `'${pyTypeName(obj)}' object has no attribute '${method}'`, lineNo);
  }

  function evalFString(raw: string, env: Env, lineNo: number): string {
    let res = '';
    let i = 0;
    while (i < raw.length) {
      if (raw[i] === '{') {
        if (raw[i + 1] === '{') {
          res += '{';
          i += 2;
          continue;
        }
        let depth = 1;
        let j = i + 1;
        while (j < raw.length && depth > 0) {
          if (raw[j] === '{') depth++;
          else if (raw[j] === '}') depth--;
          j++;
        }
        const exprChunk = raw.slice(i + 1, j - 1);
        const colonIdx = findTopLevelChar(exprChunk, ':');
        if (colonIdx !== -1) {
          const val = evalExpr(exprChunk.slice(0, colonIdx), env, lineNo);
          const fmt = exprChunk.slice(colonIdx + 1).trim();
          const fixedMatch = fmt.match(/^\.(\d+)f$/);
          if (fixedMatch) {
            res += Number(val).toFixed(Number(fixedMatch[1]));
          } else {
            res += pyStr(val);
          }
        } else {
          res += pyStr(evalExpr(exprChunk, env, lineNo));
        }
        i = j;
      } else if (raw[i] === '}' && raw[i + 1] === '}') {
        res += '}';
        i += 2;
      } else {
        res += raw[i];
        i++;
      }
    }
    return unescapeString(res);
  }

  try {
    const parsed = preprocessLines(code);
    if (parsed.length > 0) {
      execBlock(parsed, 0, parsed[0].indent, globalEnv);
    }
    return {
      stdout: output.join('\n'),
      stderr: '',
    };
  } catch (err) {
    if (err instanceof PyRuntimeError) {
      const linePrefix = err.lineNo ? `第 ${err.lineNo} 行：` : '';
      return {
        stdout: output.join('\n'),
        stderr: `${linePrefix}${err.message}\n\n提示：${translateErrorHint(err.message)}`,
      };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return {
      stdout: output.join('\n'),
      stderr: msg,
    };
  }
}

interface KwargMarker {
  __kwarg: true;
  key: string;
  value: PyVal;
}
function makeKwargMarker(key: string, value: PyVal): KwargMarker {
  return { __kwarg: true, key, value };
}
function isKwargMarker(v: unknown): v is KwargMarker {
  return typeof v === 'object' && v !== null && '__kwarg' in v;
}

function unescapeString(s: string): string {
  return s.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

function splitTopLevel(str: string, delimiter: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let start = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '(' || ch === '[' || ch === '{') {
      depth++;
    } else if (ch === ')' || ch === ']' || ch === '}') {
      depth--;
    } else if (depth === 0 && ch === delimiter) {
      parts.push(str.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(str.slice(start));
  return parts;
}

function findTopLevelChar(str: string, target: string): number {
  let depth = 0;
  let quote: string | null = null;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (depth === 0 && ch === target) return i;
    else if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;
  }
  return -1;
}

function findTopLevelToken(str: string, token: string): number {
  let depth = 0;
  let quote: string | null = null;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;
    else if (depth === 0 && str.startsWith(token, i)) return i;
  }
  return -1;
}

function findTopLevelAssign(str: string): number {
  let depth = 0;
  let quote: string | null = null;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;
    else if (
      depth === 0 &&
      ch === '=' &&
      str[i + 1] !== '=' &&
      str[i - 1] !== '=' &&
      str[i - 1] !== '!' &&
      str[i - 1] !== '<' &&
      str[i - 1] !== '>'
    ) {
      return i;
    }
  }
  return -1;
}

function splitTopLevelKeyword(str: string, kw: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let start = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;
    else if (depth === 0 && str.startsWith(kw, i)) {
      const prevOk = i === 0 || /\s/.test(str[i - 1]);
      const nextOk = i + kw.length === str.length || /\s/.test(str[i + kw.length]);
      if (prevOk && nextOk) {
        parts.push(str.slice(start, i).trim());
        start = i + kw.length;
        i += kw.length - 1;
      }
    }
  }
  parts.push(str.slice(start).trim());
  return parts;
}

function splitTernary(expr: string): { ifTrue: string; cond: string; ifFalse: string } | null {
  let depth = 0;
  let quote: string | null = null;
  let ifIdx = -1;
  let elseIdx = -1;
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;
    else if (depth === 0) {
      if (ifIdx === -1 && expr.startsWith(' if ', i)) ifIdx = i;
      else if (ifIdx !== -1 && expr.startsWith(' else ', i)) {
        elseIdx = i;
        break;
      }
    }
  }
  if (ifIdx !== -1 && elseIdx !== -1) {
    return {
      ifTrue: expr.slice(0, ifIdx).trim(),
      cond: expr.slice(ifIdx + 4, elseIdx).trim(),
      ifFalse: expr.slice(elseIdx + 6).trim(),
    };
  }
  return null;
}

function findFirstTopLevelComp(
  expr: string,
  ops: string[]
): { left: string; op: string; right: string } | null {
  let depth = 0;
  let quote: string | null = null;
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;
    else if (depth === 0) {
      for (const op of ops) {
        if (op === 'in' || op === 'not in') {
          if (expr.startsWith(op, i)) {
            const prevOk = i > 0 && /\s/.test(expr[i - 1]);
            const nextOk = i + op.length < expr.length && /\s/.test(expr[i + op.length]);
            if (prevOk && nextOk) {
              return {
                left: expr.slice(0, i).trim(),
                op,
                right: expr.slice(i + op.length).trim(),
              };
            }
          }
        } else if (expr.startsWith(op, i)) {
          return {
            left: expr.slice(0, i).trim(),
            op,
            right: expr.slice(i + op.length).trim(),
          };
        }
      }
    }
  }
  return null;
}

function findLastTopLevelBinaryOp(
  expr: string,
  ops: string[]
): { left: string; op: string; right: string } | null {
  let depth = 0;
  let quote: string | null = null;
  let best: { idx: number; op: string } | null = null;

  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;
    else if (depth === 0) {
      for (const op of ops) {
        if (expr.startsWith(op, i)) {
          if (op === '*' && (expr.startsWith('**', i) || (i > 0 && expr[i - 1] === '*'))) continue;
          if (op === '/' && (expr.startsWith('//', i) || (i > 0 && expr[i - 1] === '/'))) continue;
          if ((op === '+' || op === '-') && i === 0) continue;
          if (op === '-' || op === '+') {
            const prev = expr.slice(0, i).trimEnd();
            if (!prev || /[+\-*/%(,[{=<>!]$/.test(prev)) continue;
          }
          best = { idx: i, op };
          i += op.length - 1;
          break;
        }
      }
    }
  }
  if (!best) return null;
  return {
    left: expr.slice(0, best.idx).trim(),
    op: best.op,
    right: expr.slice(best.idx + best.op.length).trim(),
  };
}

function isUnaryPrefix(expr: string): boolean {
  let depth = 0;
  let quote: string | null = null;
  for (let i = 1; i < expr.length; i++) {
    const ch = expr[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;
    else if (depth === 0 && (ch === '+' || ch === '-' || ch === '*' || ch === '/')) {
      return false;
    }
  }
  return true;
}

function isWrappedInParens(expr: string): boolean {
  if (!expr.startsWith('(') || !expr.endsWith(')')) return false;
  return isMatchingBracket(expr, '(', ')');
}

function isMatchingBracket(expr: string, open: string, close: string): boolean {
  let depth = 0;
  let quote: string | null = null;
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0 && i < expr.length - 1) return false;
    }
  }
  return depth === 0;
}

function matchListComprehension(
  inner: string
): { mapExpr: string; varName: string; iterExpr: string; condExpr?: string } | null {
  let depth = 0;
  let quote: string | null = null;
  let forIdx = -1;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;
    else if (depth === 0 && inner.startsWith(' for ', i)) {
      forIdx = i;
      break;
    }
  }
  if (forIdx === -1) return null;
  const mapExpr = inner.slice(0, forIdx).trim();
  const rest = inner.slice(forIdx + 5).trim();
  const inIdx = findTopLevelToken(rest, ' in ');
  if (inIdx === -1) return null;
  const varName = rest.slice(0, inIdx).trim();
  const afterIn = rest.slice(inIdx + 4).trim();
  const ifIdx = findTopLevelToken(afterIn, ' if ');
  if (ifIdx !== -1) {
    return {
      mapExpr,
      varName,
      iterExpr: afterIn.slice(0, ifIdx).trim(),
      condExpr: afterIn.slice(ifIdx + 4).trim(),
    };
  }
  return { mapExpr, varName, iterExpr: afterIn };
}

function splitLastPostfix(
  expr: string
): { kind: 'call' | 'index'; base: string; content: string } | null {
  const last = expr[expr.length - 1];
  if (last !== ')' && last !== ']') return null;
  const open = last === ')' ? '(' : '[';
  let depth = 0;
  let quote: string | null = null;
  for (let i = expr.length - 1; i >= 0; i--) {
    const ch = expr[i];
    if (quote) {
      if (ch === quote && expr[i - 1] !== '\\') quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === last) depth++;
    else if (ch === open) {
      depth--;
      if (depth === 0) {
        if (i === 0) return null;
        return {
          kind: last === ')' ? 'call' : 'index',
          base: expr.slice(0, i).trim(),
          content: expr.slice(i + 1, -1).trim(),
        };
      }
    }
  }
  return null;
}

function findLastTopLevelDot(expr: string): number {
  let depth = 0;
  let quote: string | null = null;
  for (let i = expr.length - 1; i >= 0; i--) {
    const ch = expr[i];
    if (quote) {
      if (ch === quote && expr[i - 1] !== '\\') quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === ')' || ch === ']' || ch === '}') depth++;
    else if (ch === '(' || ch === '[' || ch === '{') depth--;
    else if (depth === 0 && ch === '.') return i;
  }
  return -1;
}
