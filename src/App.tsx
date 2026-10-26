import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Editor, EditorHandle } from './components/Editor';
import { ConsoleOutput } from './components/ConsoleOutput';
import { CanvasRenderer } from './components/CanvasRenderer';
import { VariablesInspector } from './components/VariablesInspector';
import { DocsModal } from './components/DocsModal';
import { runNoxProgram, NoxEnvironment, NoxInterpreterRunner, createDefaultBuiltins } from './nox/interpreter';
import { NOX_EXAMPLES } from './nox/samples';
import { ExampleScript, DrawCommand, NoxValue } from './nox/types';
import { Terminal, Palette, Database, Code, Sparkles, Plus, X, Layers } from 'lucide-react';

interface FileTab {
  id: string;
  name: string;
  content: string;
}

const DEFAULT_FILES: FileTab[] = [
  {
    id: 'main',
    name: 'main.nox',
    content: `# NOX Tablet IDE 2.0
say "Hello, NOX!"

name = "NOX"
say "현재 실행 중인 언어: " + name
say 10 + 20

# 포함형 정수 범위 (1, 5)는 1부터 5까지 모두 포함합니다
for n in (1, 5):
    say "단계 " + str(n)
`
  },
  {
    id: 'canvas_demo',
    name: 'canvas_art.nox',
    content: NOX_EXAMPLES.find(ex => ex.id === 'canvas_rings')?.code || ''
  },
  {
    id: 'game_demo',
    name: 'game_arena.nox',
    content: NOX_EXAMPLES.find(ex => ex.id === 'dice_battle')?.code || ''
  }
];

export default function App() {
  const [files, setFiles] = useState<FileTab[]>(() => {
    try {
      const saved = localStorage.getItem('nox_ide_files');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_FILES;
  });

  const [activeFileId, setActiveFileId] = useState<string>('main');
  const [output, setOutput] = useState<string[]>([]);
  const [drawCommands, setDrawCommands] = useState<DrawCommand[]>([]);
  const [variables, setVariables] = useState<Record<string, NoxValue>>({});
  const [status, setStatus] = useState<string>('준비됨');
  const [error, setError] = useState<string | null>(null);
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState<number>(0);
  const [totalSteps, setTotalSteps] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isStepping, setIsStepping] = useState<boolean>(false);
  
  // Right panel active tab: 'output' | 'canvas' | 'variables'
  const [activePanelTab, setActivePanelTab] = useState<'output' | 'canvas' | 'variables'>('output');
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);

  const editorRef = useRef<EditorHandle | null>(null);

  // Stepper state
  const stepSessionRef = useRef<{
    lines: string[];
    env: NoxEnvironment;
    currentLineIndex: number;
  } | null>(null);

  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  // Autosave to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nox_ide_files', JSON.stringify(files));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }, [files]);

  const updateCurrentCode = (newCode: string) => {
    setFiles(prev =>
      prev.map(f => (f.id === activeFileId ? { ...f, content: newCode } : f))
    );
  };

  // Run entire program
  const handleRun = () => {
    if (!activeFile) return;
    setIsRunning(true);
    setIsStepping(false);
    stepSessionRef.current = null;
    setActiveLine(null);
    setErrorLine(null);
    setError(null);
    setStatus('실행 중...');

    try {
      const result = runNoxProgram(activeFile.content);
      setOutput(result.output);
      setDrawCommands(result.drawCommands);
      setVariables(result.variables);
      setExecutionTimeMs(result.executionTimeMs);
      setTotalSteps(result.totalSteps);
      setStatus('실행 완료');

      // Auto switch to canvas if graphical commands were used
      if (result.drawCommands.length > 0 && activePanelTab !== 'canvas') {
        setActivePanelTab('canvas');
      } else if (result.drawCommands.length === 0 && activePanelTab === 'canvas') {
        setActivePanelTab('output');
      }
    } catch (err: any) {
      const msg = err.message || '알 수 없는 오류가 발생했습니다.';
      setError(msg);
      setStatus('실행 실패');
      setActivePanelTab('output');

      // Attempt to extract line number from error message
      const lineMatch = msg.match(/(\d+)행/);
      if (lineMatch) {
        setErrorLine(parseInt(lineMatch[1], 10));
      }
    } finally {
      setIsRunning(false);
    }
  };

  // Step-by-step debugger execution
  const handleStep = () => {
    if (!activeFile) return;

    // If no active session, start one
    if (!stepSessionRef.current) {
      const lines = activeFile.content.replace(/\r/g, '').split('\n');
      const cmds: DrawCommand[] = [];
      const out: string[] = [];
      const env = new NoxEnvironment(null, cmds, out);
      createDefaultBuiltins(env);

      stepSessionRef.current = {
        lines,
        env,
        currentLineIndex: 0
      };
      setIsStepping(true);
      setError(null);
      setErrorLine(null);
      setOutput([]);
      setDrawCommands(cmds);
      setVariables(env.getAllVariables());
      setStatus('단계별 디버깅 중...');
    }

    const session = stepSessionRef.current;
    if (!session) return;

    // Find next non-empty, non-comment line
    let i = session.currentLineIndex;
    while (i < session.lines.length) {
      const trim = session.lines[i].trim();
      if (!trim || trim.startsWith('#')) {
        i++;
        continue;
      }
      break;
    }

    if (i >= session.lines.length) {
      setStatus('단계 디버깅 종료');
      setIsStepping(false);
      setActiveLine(null);
      stepSessionRef.current = null;
      return;
    }

    try {
      setActiveLine(i + 1);
      // Run block starting at line i for one step
      const runner = new NoxInterpreterRunner(session.lines, session.env);
      const nextIdx = runner.findBlockEnd(i, (session.lines[i].match(/^ */) || [''])[0].length);
      runner.runBlock(i, i + 1, (session.lines[i].match(/^ */) || [''])[0].length);

      session.currentLineIndex = i + 1;
      setOutput([...session.env.output]);
      setDrawCommands([...session.env.drawCommands]);
      setVariables(session.env.getAllVariables());
      setTotalSteps(session.env.currentSteps);

      if (session.env.drawCommands.length > 0 && activePanelTab === 'output') {
        setActivePanelTab('canvas');
      }
    } catch (err: any) {
      const msg = err.message || '실행 오류';
      setError(msg);
      setStatus('디버그 중단');
      setErrorLine(i + 1);
      setIsStepping(false);
      stepSessionRef.current = null;
    }
  };

  const handleReset = () => {
    stepSessionRef.current = null;
    setIsStepping(false);
    setIsRunning(false);
    setActiveLine(null);
    setErrorLine(null);
    setError(null);
    setStatus('준비됨');
    setExecutionTimeMs(0);
    setTotalSteps(0);
  };

  const handleClearTerminal = () => {
    setOutput([]);
    setError(null);
    setStatus('준비됨');
  };

  const handleSelectExample = (example: ExampleScript) => {
    updateCurrentCode(example.code);
    handleReset();
    setOutput([]);
    setDrawCommands([]);
  };

  const handleInsertCodeFromDocs = (snippet: string) => {
    editorRef.current?.insertText('\n' + snippet + '\n');
  };

  const handleNewFile = () => {
    const newId = `file_${Date.now()}`;
    const newName = `script_${files.length + 1}.nox`;
    const newFile: FileTab = {
      id: newId,
      name: newName,
      content: `# ${newName}\nsay "안녕하세요, 새로운 NOX 파일입니다!"\n`
    };
    setFiles([...files, newFile]);
    setActiveFileId(newId);
    handleReset();
  };

  const handleSaveFile = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = activeFile.name.endsWith('.nox') ? activeFile.name : `${activeFile.name}.nox`;
    a.click();
    URL.revokeObjectURL(a.href);
    setStatus(`'${activeFile.name}' 파일이 저장되었습니다.`);
  };

  const handleOpenFile = async (file: File) => {
    try {
      const text = await file.text();
      const newId = `file_${Date.now()}`;
      const newFile: FileTab = {
        id: newId,
        name: file.name,
        content: text
      };
      setFiles(prev => [...prev, newFile]);
      setActiveFileId(newId);
      handleReset();
      setStatus(`'${file.name}' 파일을 불러왔습니다.`);
    } catch (e: any) {
      setError(`파일을 열 수 없습니다: ${e.message}`);
    }
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length <= 1) return;
    const remaining = files.filter(f => f.id !== id);
    setFiles(remaining);
    if (activeFileId === id) {
      setActiveFileId(remaining[0].id);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#080d1a] text-slate-100 select-none">
      {/* Top Application Header */}
      <Header
        onRun={handleRun}
        onStep={handleStep}
        onReset={handleReset}
        isRunning={isRunning}
        isStepping={isStepping}
        onOpenDocs={() => setIsDocsOpen(true)}
        onSelectExample={handleSelectExample}
        examples={NOX_EXAMPLES}
        onNewFile={handleNewFile}
        onSaveFile={handleSaveFile}
        onOpenFile={handleOpenFile}
        currentFileName={activeFile.name}
      />

      {/* File Tabs Bar */}
      <div className="flex items-center justify-between px-3 sm:px-5 bg-[#0b1220] border-b border-[#1a273d] overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1">
          {files.map(file => {
            const isActive = file.id === activeFileId;
            return (
              <div
                key={file.id}
                onClick={() => {
                  setActiveFileId(file.id);
                  handleReset();
                }}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-t-lg transition-colors cursor-pointer border-t-2 ${
                  isActive
                    ? 'bg-[#070d1a] text-cyan-300 border-cyan-400 font-semibold shadow-xs'
                    : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-[#121c2e]'
                }`}
              >
                <Code size={13} className={isActive ? 'text-cyan-400' : 'text-slate-500'} />
                <span>{file.name}</span>
                {files.length > 1 && (
                  <button
                    type="button"
                    onClick={e => handleCloseTab(file.id, e)}
                    className="p-0.5 rounded hover:bg-slate-700/60 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={handleNewFile}
            title="새 탭 추가"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#142033] rounded-md transition-colors cursor-pointer ml-1"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Quick Example Quick-Pills for 1-Tap Load */}
        <div className="hidden xl:flex items-center gap-1 py-1">
          <span className="text-[11px] text-slate-500 mr-1">추천 예제:</span>
          {NOX_EXAMPLES.slice(0, 4).map(ex => (
            <button
              key={ex.id}
              type="button"
              onClick={() => handleSelectExample(ex)}
              className="text-[11px] px-2 py-0.5 rounded bg-[#131d2f] hover:bg-[#1e2f4a] text-slate-300 hover:text-cyan-300 border border-[#213550] transition-colors cursor-pointer font-mono"
            >
              {ex.title.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Workspace (Editor + Output Panels) */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 sm:p-4 overflow-hidden bg-[#080d1a]">
        {/* Left Column: Code Editor (7 cols on Desktop) */}
        <section className="lg:col-span-7 h-full flex flex-col min-h-0">
          <Editor
            ref={editorRef}
            code={activeFile.content}
            onChange={updateCurrentCode}
            activeLine={activeLine}
            errorLine={errorLine}
            fileName={activeFile.name}
            onRun={handleRun}
          />
        </section>

        {/* Right Column: Output / Canvas / Variables Panels (5 cols on Desktop) */}
        <section className="lg:col-span-5 h-full flex flex-col min-h-0 bg-[#0a1120] rounded-xl border border-[#1e2c44] overflow-hidden shadow-lg">
          {/* Panel Tabs Navigation */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#0e172a] border-b border-[#1e2c44]">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActivePanelTab('output')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activePanelTab === 'output'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#15233b]'
                }`}
              >
                <Terminal size={14} />
                <span>터미널</span>
                {output.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 font-mono">
                    {output.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActivePanelTab('canvas')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activePanelTab === 'canvas'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#15233b]'
                }`}
              >
                <Palette size={14} />
                <span>캔버스</span>
                {drawCommands.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 font-mono">
                    {drawCommands.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActivePanelTab('variables')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activePanelTab === 'variables'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#15233b]'
                }`}
              >
                <Database size={14} />
                <span>변수 감시</span>
              </button>
            </div>

            {/* Quick Helper indicator */}
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>실시간 인터프리터 준비됨</span>
            </div>
          </div>

          {/* Panel Viewport */}
          <div className="flex-1 overflow-hidden">
            {activePanelTab === 'output' && (
              <ConsoleOutput
                output={output}
                error={error}
                status={status}
                executionTimeMs={executionTimeMs}
                totalSteps={totalSteps}
                onClear={handleClearTerminal}
              />
            )}

            {activePanelTab === 'canvas' && (
              <CanvasRenderer
                commands={drawCommands}
                width={480}
                height={320}
              />
            )}

            {activePanelTab === 'variables' && (
              <VariablesInspector
                variables={variables}
              />
            )}
          </div>
        </section>
      </main>

      {/* Docs & Syntax Guide Modal */}
      <DocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
        onInsertCode={handleInsertCodeFromDocs}
      />
    </div>
  );
}
