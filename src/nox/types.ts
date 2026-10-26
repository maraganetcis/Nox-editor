export type NoxValue =
  | number
  | string
  | boolean
  | null
  | NoxValue[]
  | NoxFunction
  | NoxObject;

export interface NoxFunction {
  __isNoxFn: true;
  name: string;
  params: string[];
  body: {
    startLine: number;
    endLine: number;
    indent: number;
  };
  closure: Record<string, NoxValue>;
}

export type NoxObject = {
  [key: string]: NoxValue;
};

export interface DrawCommand {
  type: 'circle' | 'rect' | 'line' | 'text' | 'clear' | 'pixel' | 'star';
  args: any[];
}

export interface ExecutionOutputItem {
  id: string;
  type: 'stdout' | 'stderr' | 'system' | 'input-request';
  text: string;
  timestamp: number;
}

export interface ExecutionState {
  status: 'idle' | 'running' | 'stepping' | 'paused' | 'waiting-input' | 'finished' | 'error';
  currentLine: number | null;
  output: ExecutionOutputItem[];
  drawCommands: DrawCommand[];
  variables: Record<string, NoxValue>;
  error: string | null;
  stepCount: number;
  executionTimeMs: number;
}

export interface ExampleScript {
  id: string;
  category: '기초 (Basics)' | '조건문 (Conditionals)' | '반복문 (Loops)' | '함수 (Functions)' | '인터랙티브 & 게임 (Interactive)' | '캔버스 그래픽 (Canvas Art)';
  title: string;
  titleEn: string;
  description: string;
  code: string;
  tags: string[];
}
