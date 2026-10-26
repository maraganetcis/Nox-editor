import { NoxValue, NoxFunction, DrawCommand } from './types';

export interface Token {
  kind: 'num' | 'str' | 'id' | 'op';
  val: string | number;
  raw: string;
}

export function tokenize(s: string): Token[] {
  // Regex to match numbers, double/single quoted strings, identifiers, and operators
  const re = /\s*(?:(\d+(?:\.\d+)?)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|([A-Za-z_]\w*)|(==|!=|<=|>=|\*\*|&&|\|\||[()+\-*/%<>,:=[\]!.]))/gy;
  const tokens: Token[] = [];
  let p = 0;
  
  while (p < s.length) {
    // Skip trailing whitespace
    if (/^\s*$/.test(s.slice(p))) break;
    // Skip comments starting with #
    if (s[p] === '#') {
      break;
    }
    
    re.lastIndex = p;
    const m = re.exec(s);
    if (!m) {
      // If we hit a comment inline
      const rest = s.slice(p).trim();
      if (rest.startsWith('#')) break;
      throw new Error(`표현식 문법 오류: ${s.slice(p)}`);
    }
    p = re.lastIndex;

    if (m[1] !== undefined) {
      tokens.push({ kind: 'num', val: Number(m[1]), raw: m[1] });
    } else if (m[2] !== undefined) {
      const unescaped = m[2]
        .slice(1, -1)
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\(["'\\])/g, '$1');
      tokens.push({ kind: 'str', val: unescaped, raw: m[2] });
    } else if (m[3] !== undefined) {
      tokens.push({ kind: 'id', val: m[3], raw: m[3] });
    } else if (m[4] !== undefined) {
      tokens.push({ kind: 'op', val: m[4], raw: m[4] });
    }
  }

  return tokens;
}

const PRECEDENCE: Record<string, number> = {
  'or': 1,
  '||': 1,
  'and': 2,
  '&&': 2,
  '==': 3,
  '!=': 3,
  '<': 4,
  '>': 4,
  '<=': 4,
  '>=': 4,
  '+': 5,
  '-': 5,
  '*': 6,
  '/': 6,
  '%': 6,
  '**': 7,
};

export class NoxEnvironment {
  parent: NoxEnvironment | null;
  values: Record<string, NoxValue>;
  drawCommands: DrawCommand[];
  output: string[];
  maxSteps: number;
  currentSteps: number;

  constructor(parent: NoxEnvironment | null = null, drawCommands: DrawCommand[] = [], output: string[] = []) {
    this.parent = parent;
    this.values = Object.create(null);
    this.drawCommands = parent ? parent.drawCommands : drawCommands;
    this.output = parent ? parent.output : output;
    this.maxSteps = parent ? parent.maxSteps : 1000000;
    this.currentSteps = parent ? parent.currentSteps : 0;
  }

  get(name: string): NoxValue {
    if (name in this.values) {
      return this.values[name];
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    throw new Error(`정의되지 않은 이름: '${name}'`);
  }

  set(name: string, value: NoxValue): void {
    // If it exists in a parent scope, update it there, else set in current scope
    let curr: NoxEnvironment | null = this;
    while (curr) {
      if (name in curr.values) {
        curr.values[name] = value;
        return;
      }
      curr = curr.parent;
    }
    this.values[name] = value;
  }

  has(name: string): boolean {
    if (name in this.values) return true;
    if (this.parent) return this.parent.has(name);
    return false;
  }

  getAllVariables(): Record<string, NoxValue> {
    const result: Record<string, NoxValue> = {};
    if (this.parent) {
      Object.assign(result, this.parent.getAllVariables());
    }
    Object.assign(result, this.values);
    return result;
  }

  incrementStep(lineNum?: number): void {
    this.currentSteps++;
    if (this.parent) {
      this.parent.currentSteps = this.currentSteps;
    }
    if (this.currentSteps > this.maxSteps) {
      throw new Error(`실행 단계 제한(1,000,000회)을 초과했습니다. 무한 루프가 발생하지 않았는지 확인하세요.${lineNum ? ` (행: ${lineNum})` : ''}`);
    }
  }
}

export function formatNoxValue(v: NoxValue): string {
  if (Array.isArray(v)) {
    return '[' + v.map(formatNoxValue).join(', ') + ']';
  }
  if (v === null) return 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v && '__isNoxFn' in v) {
    return `<함수 ${(v as NoxFunction).name || '익명'}>`;
  }
  return String(v);
}

// Built-in functions & math utilities
export function createDefaultBuiltins(env: NoxEnvironment): void {
  // Built-in standard functions
  env.values['len'] = ((arg: any) => {
    if (Array.isArray(arg) || typeof arg === 'string') return arg.length;
    throw new Error(`len()은 문자열 또는 배열에만 사용할 수 있습니다.`);
  }) as any;

  env.values['abs'] = ((n: any) => {
    if (typeof n !== 'number') throw new Error(`abs()는 숫자에만 사용할 수 있습니다.`);
    return Math.abs(n);
  }) as any;

  env.values['min'] = ((...args: any[]) => {
    if (args.length === 1 && Array.isArray(args[0])) {
      return Math.min(...args[0]);
    }
    return Math.min(...args);
  }) as any;

  env.values['max'] = ((...args: any[]) => {
    if (args.length === 1 && Array.isArray(args[0])) {
      return Math.max(...args[0]);
    }
    return Math.max(...args);
  }) as any;

  env.values['round'] = ((n: any, decimals: any = 0) => {
    if (typeof n !== 'number') throw new Error(`round()는 숫자에만 사용할 수 있습니다.`);
    const factor = Math.pow(10, decimals || 0);
    return Math.round(n * factor) / factor;
  }) as any;

  env.values['sqrt'] = ((n: any) => {
    if (typeof n !== 'number' || n < 0) throw new Error(`sqrt()는 0 이상의 숫자에만 사용할 수 있습니다.`);
    return Math.sqrt(n);
  }) as any;

  env.values['random'] = ((min: any = 1, max: any = 100) => {
    const low = Number.isInteger(min) ? min : 0;
    const high = Number.isInteger(max) ? max : 100;
    return Math.floor(Math.random() * (high - low + 1)) + low;
  }) as any;

  env.values['int'] = ((v: any) => {
    const num = parseInt(v, 10);
    if (isNaN(num)) throw new Error(`'${v}'을(를) 정수로 변환할 수 없습니다.`);
    return num;
  }) as any;

  env.values['float'] = ((v: any) => {
    const num = parseFloat(v);
    if (isNaN(num)) throw new Error(`'${v}'을(를) 실수로 변환할 수 없습니다.`);
    return num;
  }) as any;

  env.values['str'] = ((v: any) => formatNoxValue(v)) as any;
  env.values['bool'] = ((v: any) => Boolean(v)) as any;

  env.values['sin'] = ((deg: any) => Math.sin((deg * Math.PI) / 180)) as any;
  env.values['cos'] = ((deg: any) => Math.cos((deg * Math.PI) / 180)) as any;

  // Draw object namespace
  const drawObj: Record<string, any> = {
    circle: (x: number, y: number, r: number, color: string = '#70d6b2', fill: boolean = true) => {
      env.drawCommands.push({ type: 'circle', args: [x, y, r, color, fill] });
      return null;
    },
    rect: (x: number, y: number, w: number, h: number, color: string = '#38bdf8', fill: boolean = true) => {
      env.drawCommands.push({ type: 'rect', args: [x, y, w, h, color, fill] });
      return null;
    },
    line: (x1: number, y1: number, x2: number, y2: number, color: string = '#e2e8f0', width: number = 2) => {
      env.drawCommands.push({ type: 'line', args: [x1, y1, x2, y2, color, width] });
      return null;
    },
    text: (text: string, x: number, y: number, color: string = '#ffffff', size: number = 16) => {
      env.drawCommands.push({ type: 'text', args: [String(text), x, y, color, size] });
      return null;
    },
    clear: (color: string = '#0b1220') => {
      env.drawCommands.push({ type: 'clear', args: [color] });
      return null;
    },
    pixel: (x: number, y: number, color: string = '#70d6b2') => {
      env.drawCommands.push({ type: 'pixel', args: [x, y, color] });
      return null;
    },
    star: (x: number, y: number, points: number = 5, outerR: number = 20, innerR: number = 10, color: string = '#fbbf24') => {
      env.drawCommands.push({ type: 'star', args: [x, y, points, outerR, innerR, color] });
      return null;
    }
  };

  env.values['draw'] = drawObj as any;
}

export class NoxParser {
  tokens: Token[];
  index: number;
  env: NoxEnvironment;
  programLines: string[];

  constructor(tokens: Token[], env: NoxEnvironment, programLines: string[] = []) {
    this.tokens = tokens;
    this.index = 0;
    this.env = env;
    this.programLines = programLines;
  }

  peek(): Token | undefined {
    return this.tokens[this.index];
  }

  next(): Token {
    return this.tokens[this.index++];
  }

  primary(): NoxValue {
    const x = this.next();
    if (!x) throw new Error('표현식이 비어 있거나 불완전합니다.');

    if (x.kind === 'num') return x.val as number;
    if (x.kind === 'str') return x.val as string;

    if (x.kind === 'id') {
      const name = x.val as string;
      if (name === 'true') return true;
      if (name === 'false') return false;
      if (name === 'null') return null;
      if (name === 'not') {
        return !this.primary();
      }

      // Check for function or method call or property access
      let val: NoxValue;
      if (this.env.has(name)) {
        val = this.env.get(name);
      } else {
        throw new Error(`정의되지 않은 이름: '${name}'`);
      }

      return this.parsePostfix(val);
    }

    // Unary minus or not
    if (x.val === '-') {
      const p = this.primary();
      if (typeof p !== 'number') throw new Error(`'-' 단항 연산자는 숫자에만 적용할 수 있습니다.`);
      return -p;
    }
    if (x.val === '!') {
      return !this.primary();
    }

    // Parentheses (expr) or Range (start, end)
    if (x.val === '(') {
      // Could be empty tuple ()
      if (this.peek()?.val === ')') {
        this.next();
        return [];
      }

      const first = this.parseExpression(0);
      
      // Check if it's a range (start, end)
      if (this.peek()?.val === ',') {
        this.next(); // consume ','
        const second = this.parseExpression(0);
        const closing = this.next();
        if (closing?.val !== ')') {
          throw new Error('범위 표현식 뒤에 닫는 괄호 )가 필요합니다.');
        }

        if (typeof first !== 'number' || typeof second !== 'number' || !Number.isInteger(first) || !Number.isInteger(second)) {
          throw new Error(`범위의 시작과 끝은 정수여야 합니다. (입력: (${first}, ${second}))`);
        }

        const count = Math.abs(second - first) + 1;
        if (count > 100000) {
          throw new Error(`범위는 100,000개 이하만 지원합니다. (시작: ${first}, 끝: ${second}, 개수: ${count})`);
        }

        const rangeArr: number[] = [];
        const step = first <= second ? 1 : -1;
        for (let q = first; q !== second; q += step) {
          rangeArr.push(q);
        }
        rangeArr.push(second);
        return this.parsePostfix(rangeArr);
      }

      const closing = this.next();
      if (closing?.val !== ')') {
        throw new Error('닫는 괄호 )가 누락되었습니다.');
      }
      return this.parsePostfix(first);
    }

    // List literal [1, 2, 3]
    if (x.val === '[') {
      const list: NoxValue[] = [];
      if (this.peek()?.val !== ']') {
        while (this.index < this.tokens.length) {
          list.push(this.parseExpression(0));
          if (this.peek()?.val === ',') {
            this.next();
            if (this.peek()?.val === ']') break;
          } else {
            break;
          }
        }
      }
      if (this.next()?.val !== ']') {
        throw new Error('리스트 뒤에 닫는 대괄호 ]가 필요합니다.');
      }
      return this.parsePostfix(list);
    }

    throw new Error(`지원하지 않거나 올바르지 않은 표현식 토큰: '${x.val}'`);
  }

  parsePostfix(baseVal: NoxValue): NoxValue {
    let curr = baseVal;

    while (this.index < this.tokens.length) {
      const p = this.peek();
      if (!p) break;

      // Method or property access: obj.prop or draw.circle
      if (p.val === '.') {
        this.next(); // consume '.'
        const propToken = this.next();
        if (!propToken || propToken.kind !== 'id') {
          throw new Error(`'.' 뒤에 속성 이름이 필요합니다.`);
        }
        const propName = String(propToken.val);
        if (typeof curr !== 'object' || curr === null) {
          throw new Error(`객체가 아닌 값에서 '${propName}' 속성에 접근할 수 없습니다.`);
        }
        curr = (curr as any)[propName];
        continue;
      }

      // Function or method call: func(arg1, arg2)
      if (p.val === '(') {
        this.next(); // consume '('
        const args: NoxValue[] = [];
        if (this.peek()?.val !== ')') {
          while (this.index < this.tokens.length) {
            args.push(this.parseExpression(0));
            if (this.peek()?.val === ',') {
              this.next();
              if (this.peek()?.val === ')') break;
            } else {
              break;
            }
          }
        }
        if (this.next()?.val !== ')') {
          throw new Error(`함수 호출 뒤에 닫는 괄호 )가 필요합니다.`);
        }

        if (typeof curr === 'function') {
          // Native JavaScript function
          curr = (curr as Function)(...args);
        } else if (typeof curr === 'object' && curr && '__isNoxFn' in curr) {
          // User-defined NOX function
          const fn = curr as NoxFunction;
          curr = this.executeUserFunction(fn, args);
        } else {
          throw new Error(`호출할 수 없는 대상입니다: ${formatNoxValue(curr)}`);
        }
        continue;
      }

      // Indexing or slice: list[idx] or string[idx]
      if (p.val === '[') {
        this.next(); // consume '['
        const idxVal = this.parseExpression(0);
        if (this.next()?.val !== ']') {
          throw new Error(`대괄호 인덱싱 뒤에 ]가 필요합니다.`);
        }
        if (typeof idxVal !== 'number' || !Number.isInteger(idxVal)) {
          throw new Error(`인덱스는 정수여야 합니다.`);
        }
        if (Array.isArray(curr)) {
          let pos = idxVal;
          if (pos < 0) pos = curr.length + pos;
          if (pos < 0 || pos >= curr.length) {
            throw new Error(`배열 인덱스 범위를 벗어났습니다: ${idxVal} (길이: ${curr.length})`);
          }
          curr = curr[pos];
        } else if (typeof curr === 'string') {
          let pos = idxVal;
          if (pos < 0) pos = curr.length + pos;
          if (pos < 0 || pos >= curr.length) {
            throw new Error(`문자열 인덱스 범위를 벗어났습니다: ${idxVal} (길이: ${curr.length})`);
          }
          curr = curr[pos];
        } else {
          throw new Error(`인덱싱은 배열 또는 문자열에만 적용할 수 있습니다.`);
        }
        continue;
      }

      break;
    }

    return curr;
  }

  executeUserFunction(fn: NoxFunction, args: NoxValue[]): NoxValue {
    if (args.length !== fn.params.length) {
      throw new Error(`함수 '${fn.name}'은(는) ${fn.params.length}개의 인자가 필요하지만 ${args.length}개가 전달되었습니다.`);
    }

    const localEnv = new NoxEnvironment(this.env);
    // Bind parameters
    for (let i = 0; i < fn.params.length; i++) {
      localEnv.set(fn.params[i], args[i]);
    }

    const runner = new NoxInterpreterRunner(this.programLines, localEnv);
    const flow = runner.runBlock(fn.body.startLine, fn.body.endLine, fn.body.indent);
    if (flow && typeof flow === 'object' && 'type' in flow && (flow as any).type === 'return') {
      return (flow as any).value !== undefined ? (flow as any).value : null;
    }
    return (flow as NoxValue) !== undefined ? (flow as NoxValue) : null;
  }

  parseExpression(minPrec: number): NoxValue {
    let left = this.primary();

    while (this.index < this.tokens.length) {
      const opToken = this.peek();
      if (!opToken) break;
      const op = String(opToken.val);
      const prec = PRECEDENCE[op];
      if (prec === undefined || prec < minPrec) break;

      this.next(); // consume operator
      const nextMinPrec = op === '**' ? prec : prec + 1; // right-associative for **
      const right = this.parseExpression(nextMinPrec);

      switch (op) {
        case '+':
          if (typeof left === 'string' || typeof right === 'string') {
            left = String(formatNoxValue(left)) + String(formatNoxValue(right));
          } else if (Array.isArray(left) && Array.isArray(right)) {
            left = [...left, ...right];
          } else if (typeof left === 'number' && typeof right === 'number') {
            left = left + right;
          } else {
            throw new Error(`'+' 연산자를 적용할 수 없는 타입입니다: ${typeof left} + ${typeof right}`);
          }
          break;
        case '-':
          if (typeof left !== 'number' || typeof right !== 'number') {
            throw new Error(`'-' 연산자는 숫자에만 적용할 수 있습니다.`);
          }
          left = left - right;
          break;
        case '*':
          if (typeof left === 'string' && typeof right === 'number') {
            left = left.repeat(Math.max(0, Math.floor(right)));
          } else if (typeof left === 'number' && typeof right === 'number') {
            left = left * right;
          } else {
            throw new Error(`'*' 연산자는 숫자 또는 문자열 반복에만 적용할 수 있습니다.`);
          }
          break;
        case '/':
          if (typeof left !== 'number' || typeof right !== 'number') {
            throw new Error(`'/' 연산자는 숫자에만 적용할 수 있습니다.`);
          }
          if (right === 0) throw new Error('0으로 나눌 수 없습니다 (ZeroDivisionError).');
          left = left / right;
          break;
        case '%':
          if (typeof left !== 'number' || typeof right !== 'number') {
            throw new Error(`'%' 연산자는 숫자에만 적용할 수 있습니다.`);
          }
          if (right === 0) throw new Error('0으로 나눈 나머지를 구할 수 없습니다.');
          left = left % right;
          break;
        case '**':
          if (typeof left !== 'number' || typeof right !== 'number') {
            throw new Error(`'**' 거듭제곱 연산자는 숫자에만 적용할 수 있습니다.`);
          }
          left = Math.pow(left, right);
          break;
        case '==':
          left = JSON.stringify(left) === JSON.stringify(right);
          break;
        case '!=':
          left = JSON.stringify(left) !== JSON.stringify(right);
          break;
        case '<':
          left = (left as any) < (right as any);
          break;
        case '>':
          left = (left as any) > (right as any);
          break;
        case '<=':
          left = (left as any) <= (right as any);
          break;
        case '>=':
          left = (left as any) >= (right as any);
          break;
        case 'and':
        case '&&':
          left = Boolean(left) && Boolean(right);
          break;
        case 'or':
        case '||':
          left = Boolean(left) || Boolean(right);
          break;
        default:
          throw new Error(`지원하지 않는 연산자: '${op}'`);
      }
    }

    return left;
  }
}

export function evalExpression(exprStr: string, env: NoxEnvironment, programLines: string[] = []): NoxValue {
  const tokens = tokenize(exprStr);
  if (tokens.length === 0) throw new Error('비어 있는 표현식입니다.');
  const parser = new NoxParser(tokens, env, programLines);
  const result = parser.parseExpression(0);
  if (parser.index < tokens.length) {
    throw new Error(`표현식 뒤에 해석할 수 없는 토큰이 남았습니다: '${tokens[parser.index].raw}'`);
  }
  return result;
}

export interface StatementFlowControl {
  type: 'return' | 'break' | 'continue';
  value?: NoxValue;
}

export class NoxInterpreterRunner {
  lines: string[];
  env: NoxEnvironment;
  onLineStep?: (lineNum: number, currentEnv: Record<string, NoxValue>) => void;

  constructor(lines: string[], env: NoxEnvironment, onLineStep?: (lineNum: number, currentEnv: Record<string, NoxValue>) => void) {
    this.lines = lines;
    this.env = env;
    this.onLineStep = onLineStep;
  }

  // Pre-scan function definitions so functions can be called anywhere
  scanFunctions(start: number, end: number, indent: number): void {
    let i = start;
    while (i < end) {
      const raw = this.lines[i];
      const trim = raw.trim();
      if (!trim || trim.startsWith('#')) {
        i++;
        continue;
      }
      const lineIndent = (raw.match(/^ */) || [''])[0].length;
      if (lineIndent < indent) break;
      if (lineIndent === indent) {
        const fnMatch = trim.match(/^(?:fn|def)\s+([A-Za-z_]\w*)\s*\((.*?)\)\s*:$/);
        if (fnMatch) {
          const fnName = fnMatch[1];
          const rawParams = fnMatch[2].trim();
          const params = rawParams ? rawParams.split(',').map(p => p.trim()) : [];
          
          const bodyStart = i + 1;
          if (bodyStart >= this.lines.length) {
            throw new Error(`함수 '${fnName}'에 실행할 본문 블록이 필요합니다.`);
          }
          const childIndent = (this.lines[bodyStart].match(/^ */) || [''])[0].length;
          if (childIndent <= indent) {
            throw new Error(`${i + 1}행: 함수 본문은 들여쓰기되어야 합니다.`);
          }
          const bodyEnd = this.findBlockEnd(bodyStart, childIndent);
          const noxFn: NoxFunction = {
            __isNoxFn: true,
            name: fnName,
            params,
            body: {
              startLine: bodyStart,
              endLine: bodyEnd,
              indent: childIndent
            },
            closure: this.env.getAllVariables()
          };
          this.env.set(fnName, noxFn);
          i = bodyEnd;
          continue;
        }
      }
      i++;
    }
  }

  findBlockEnd(start: number, expectedIndent: number): number {
    let i = start;
    while (i < this.lines.length) {
      const raw = this.lines[i];
      const trim = raw.trim();
      if (!trim || trim.startsWith('#')) {
        i++;
        continue;
      }
      const n = (raw.match(/^ */) || [''])[0].length;
      if (n < expectedIndent) {
        break;
      }
      i++;
    }
    return i;
  }

  runBlock(start: number, end: number, indent: number): NoxValue | StatementFlowControl | undefined {
    this.scanFunctions(start, end, indent);
    let i = start;

    while (i < end) {
      const raw = this.lines[i];
      const trim = raw.trim();
      if (!trim || trim.startsWith('#')) {
        i++;
        continue;
      }

      const n = (raw.match(/^ */) || [''])[0].length;
      if (n < indent) break;
      if (n > indent) {
        throw new Error(`${i + 1}행: 예상하지 않은 들여쓰기입니다.`);
      }

      this.env.incrementStep(i + 1);
      if (this.onLineStep) {
        this.onLineStep(i + 1, this.env.getAllVariables());
      }

      // Check for 'return' statement
      const retMatch = trim.match(/^return(?:\s+(.*))?$/);
      if (retMatch) {
        const val = retMatch[1] ? evalExpression(retMatch[1].trim(), this.env, this.lines) : null;
        return { type: 'return', value: val };
      }

      // Check for 'break'
      if (trim === 'break') {
        return { type: 'break' };
      }

      // Check for 'continue'
      if (trim === 'continue') {
        return { type: 'continue' };
      }

      // Check for 'otherwise:' or 'otherwise if' at block top level
      if (trim === 'otherwise:' || trim.startsWith('otherwise:') || trim.startsWith('elif ')) {
        break;
      }

      // 1. say statement: say <expr>
      const sayMatch = trim.match(/^say\s+(.+)$/);
      if (sayMatch) {
        const val = evalExpression(sayMatch[1].trim(), this.env, this.lines);
        this.env.output.push(formatNoxValue(val));
        i++;
        continue;
      }

      // 2. Function definition: fn / def (already scanned, skip block)
      const fnDefMatch = trim.match(/^(?:fn|def)\s+([A-Za-z_]\w*)\s*\((.*?)\)\s*:$/);
      if (fnDefMatch) {
        const bodyStart = i + 1;
        const childIndent = (this.lines[bodyStart]?.match(/^ */) || [''])[0].length;
        const bodyEnd = this.findBlockEnd(bodyStart, childIndent);
        i = bodyEnd;
        continue;
      }

      // 3. For loop: for <id> in (<start>, <end>): OR for <id> in <expr>:
      const forRangeMatch = trim.match(/^for\s+([A-Za-z_]\w*)\s+in\s+\((.+),\s*(.+)\):$/);
      const forIterMatch = trim.match(/^for\s+([A-Za-z_]\w*)\s+in\s+(.+):$/);

      if (forRangeMatch || forIterMatch) {
        const loopVar = forRangeMatch ? forRangeMatch[1] : forIterMatch![1];
        let items: NoxValue[] = [];

        if (forRangeMatch) {
          const a = evalExpression(forRangeMatch[2].trim(), this.env, this.lines);
          const b = evalExpression(forRangeMatch[3].trim(), this.env, this.lines);
          if (typeof a !== 'number' || typeof b !== 'number' || !Number.isInteger(a) || !Number.isInteger(b)) {
            throw new Error(`${i + 1}행: 범위의 시작과 끝은 정수여야 합니다.`);
          }
          if (Math.abs(b - a) + 1 > 100000) {
            throw new Error(`${i + 1}행: 반복 범위가 100,000회를 초과합니다.`);
          }
          const step = a <= b ? 1 : -1;
          for (let v = a; v !== b; v += step) {
            items.push(v);
          }
          items.push(b);
        } else {
          const iterObj = evalExpression(forIterMatch![2].trim(), this.env, this.lines);
          if (Array.isArray(iterObj)) {
            items = iterObj;
          } else if (typeof iterObj === 'string') {
            items = iterObj.split('');
          } else {
            throw new Error(`${i + 1}행: for in 뒤에는 반복 가능한 배열, 범위 또는 문자열이 와야 합니다.`);
          }
        }

        const bodyStart = i + 1;
        if (bodyStart >= this.lines.length) {
          throw new Error(`${i + 1}행: for 문에 실행할 본문 블록이 필요합니다.`);
        }
        const childIndent = (this.lines[bodyStart].match(/^ */) || [''])[0].length;
        if (childIndent <= indent) {
          throw new Error(`${i + 1}행: for 문 안에 들여쓴 코드가 필요합니다.`);
        }
        const bodyEnd = this.findBlockEnd(bodyStart, childIndent);

        for (const item of items) {
          this.env.set(loopVar, item);
          const flow = this.runBlock(bodyStart, bodyEnd, childIndent);
          if (flow && typeof flow === 'object' && 'type' in flow) {
            if (flow.type === 'return') return flow;
            if (flow.type === 'break') break;
            if (flow.type === 'continue') continue;
          }
        }

        i = bodyEnd;
        continue;
      }

      // 4. While loop: while <cond>:
      const whileMatch = trim.match(/^while\s+(.+):$/);
      if (whileMatch) {
        const condExpr = whileMatch[1].trim();
        const bodyStart = i + 1;
        if (bodyStart >= this.lines.length) {
          throw new Error(`${i + 1}행: while 문에 실행할 본문 블록이 필요합니다.`);
        }
        const childIndent = (this.lines[bodyStart].match(/^ */) || [''])[0].length;
        if (childIndent <= indent) {
          throw new Error(`${i + 1}행: while 문 안에 들여쓴 코드가 필요합니다.`);
        }
        const bodyEnd = this.findBlockEnd(bodyStart, childIndent);

        while (Boolean(evalExpression(condExpr, this.env, this.lines))) {
          this.env.incrementStep(i + 1);
          const flow = this.runBlock(bodyStart, bodyEnd, childIndent);
          if (flow && typeof flow === 'object' && 'type' in flow) {
            if (flow.type === 'return') return flow;
            if (flow.type === 'break') break;
            if (flow.type === 'continue') continue;
          }
        }

        i = bodyEnd;
        continue;
      }

      // 5. If / Otherwise If / Otherwise
      const ifMatch = trim.match(/^if\s+(.+):$/);
      if (ifMatch) {
        const cond = Boolean(evalExpression(ifMatch[1].trim(), this.env, this.lines));
        const bodyStart = i + 1;
        if (bodyStart >= this.lines.length) {
          throw new Error(`${i + 1}행: if 문에 실행할 본문 블록이 필요합니다.`);
        }
        const childIndent = (this.lines[bodyStart].match(/^ */) || [''])[0].length;
        if (childIndent <= indent) {
          throw new Error(`${i + 1}행: if 문 안에 들여쓴 코드가 필요합니다.`);
        }
        const bodyEnd = this.findBlockEnd(bodyStart, childIndent);

        let branchExecuted = false;
        if (cond) {
          const flow = this.runBlock(bodyStart, bodyEnd, childIndent);
          if (flow && typeof flow === 'object' && 'type' in flow) return flow;
          branchExecuted = true;
        }

        // Scan subsequent elif or otherwise blocks
        let nextBlockStart = bodyEnd;
        while (nextBlockStart < this.lines.length && !this.lines[nextBlockStart].trim()) {
          nextBlockStart++;
        }

        while (nextBlockStart < this.lines.length) {
          const nextRaw = this.lines[nextBlockStart];
          const nextTrim = nextRaw.trim();
          const nextIndent = (nextRaw.match(/^ */) || [''])[0].length;

          if (nextIndent !== indent) break;

          // elif or otherwise if
          const elifMatch = nextTrim.match(/^(?:elif|otherwise\s+if)\s+(.+):$/);
          const elseMatch = nextTrim.match(/^(?:otherwise|else):$/);

          if (elifMatch) {
            const elifStart = nextBlockStart + 1;
            const elifChildIndent = (this.lines[elifStart]?.match(/^ */) || [''])[0].length;
            if (elifChildIndent <= indent) {
              throw new Error(`${nextBlockStart + 1}행: elif 안에 들여쓴 코드가 필요합니다.`);
            }
            const elifEnd = this.findBlockEnd(elifStart, elifChildIndent);

            if (!branchExecuted) {
              const elifCond = Boolean(evalExpression(elifMatch[1].trim(), this.env, this.lines));
              if (elifCond) {
                const flow = this.runBlock(elifStart, elifEnd, elifChildIndent);
                if (flow && typeof flow === 'object' && 'type' in flow) return flow;
                branchExecuted = true;
              }
            }
            nextBlockStart = elifEnd;
            while (nextBlockStart < this.lines.length && !this.lines[nextBlockStart].trim()) {
              nextBlockStart++;
            }
            continue;
          }

          if (elseMatch) {
            const elseStart = nextBlockStart + 1;
            const elseChildIndent = (this.lines[elseStart]?.match(/^ */) || [''])[0].length;
            if (elseChildIndent <= indent) {
              throw new Error(`${nextBlockStart + 1}행: otherwise 안에 들여쓴 코드가 필요합니다.`);
            }
            const elseEnd = this.findBlockEnd(elseStart, elseChildIndent);

            if (!branchExecuted) {
              const flow = this.runBlock(elseStart, elseEnd, elseChildIndent);
              if (flow && typeof flow === 'object' && 'type' in flow) return flow;
              branchExecuted = true;
            }
            nextBlockStart = elseEnd;
            break;
          }

          break;
        }

        i = nextBlockStart;
        continue;
      }

      // 6. Variable assignment: <id> = <expr> or <id> += <expr>, etc.
      const assignMatch = trim.match(/^([A-Za-z_]\w*(?:\[.*?\])?)\s*(=|\+=|-=|\*=|\/=)\s*(.+)$/);
      if (assignMatch) {
        const target = assignMatch[1].trim();
        const op = assignMatch[2];
        const valExpr = assignMatch[3].trim();
        const rhsVal = evalExpression(valExpr, this.env, this.lines);

        // Check if target is indexing like arr[0]
        const indexTarget = target.match(/^([A-Za-z_]\w*)\[(.+)\]$/);
        if (indexTarget) {
          const arrVar = indexTarget[1];
          const arr = this.env.get(arrVar);
          if (!Array.isArray(arr)) {
            throw new Error(`${i + 1}행: '${arrVar}'은(는) 배열이 아닙니다.`);
          }
          const idxVal = evalExpression(indexTarget[2].trim(), this.env, this.lines);
          if (typeof idxVal !== 'number' || !Number.isInteger(idxVal)) {
            throw new Error(`${i + 1}행: 인덱스는 정수여야 합니다.`);
          }
          let pos = idxVal;
          if (pos < 0) pos = arr.length + pos;
          if (pos < 0 || pos >= arr.length) {
            throw new Error(`${i + 1}행: 인덱스 범위를 벗어났습니다 (${idxVal})`);
          }
          arr[pos] = rhsVal;
        } else {
          if (op === '=') {
            this.env.set(target, rhsVal);
          } else {
            const current = this.env.get(target);
            let updated: NoxValue;
            if (op === '+=') {
              updated = (current as any) + (rhsVal as any);
            } else if (op === '-=') {
              updated = (current as any) - (rhsVal as any);
            } else if (op === '*=') {
              updated = (current as any) * (rhsVal as any);
            } else {
              updated = (current as any) / (rhsVal as any);
            }
            this.env.set(target, updated);
          }
        }

        i++;
        continue;
      }

      // 7. Standalone expression or procedure call (e.g., draw.circle(...), func(...))
      try {
        evalExpression(trim, this.env, this.lines);
        i++;
        continue;
      } catch (err: any) {
        throw new Error(`${i + 1}행: 지원하지 않거나 올바르지 않은 문장입니다: '${trim}' (${err.message})`);
      }
    }

    return undefined;
  }
}

export interface RunResult {
  output: string[];
  drawCommands: DrawCommand[];
  variables: Record<string, NoxValue>;
  executionTimeMs: number;
  totalSteps: number;
}

export function runNoxProgram(
  source: string,
  onLineStep?: (lineNum: number, variables: Record<string, NoxValue>) => void
): RunResult {
  const startTime = performance.now();
  const lines = source.replace(/\r/g, '').split('\n');
  const drawCommands: DrawCommand[] = [];
  const output: string[] = [];
  
  const env = new NoxEnvironment(null, drawCommands, output);
  createDefaultBuiltins(env);

  const runner = new NoxInterpreterRunner(lines, env, onLineStep);
  runner.runBlock(0, lines.length, 0);

  const endTime = performance.now();
  return {
    output,
    drawCommands,
    variables: env.getAllVariables(),
    executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
    totalSteps: env.currentSteps
  };
}
