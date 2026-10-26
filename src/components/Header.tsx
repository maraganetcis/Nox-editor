import React, { useRef } from 'react';
import { 
  Play, 
  StepForward, 
  RotateCcw, 
  BookOpen, 
  FolderOpen, 
  Download, 
  Sparkles, 
  Code, 
  Layers,
  HelpCircle,
  FilePlus
} from 'lucide-react';
import { ExampleScript } from '../nox/types';

interface HeaderProps {
  onRun: () => void;
  onStep: () => void;
  onReset: () => void;
  isRunning: boolean;
  isStepping: boolean;
  onOpenDocs: () => void;
  onSelectExample: (example: ExampleScript) => void;
  examples: ExampleScript[];
  onNewFile: () => void;
  onSaveFile: () => void;
  onOpenFile: (file: File) => void;
  currentFileName: string;
}

export const Header: React.FC<HeaderProps> = ({
  onRun,
  onStep,
  onReset,
  isRunning,
  isStepping,
  onOpenDocs,
  onSelectExample,
  examples,
  onNewFile,
  onSaveFile,
  onOpenFile,
  currentFileName
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onOpenFile(file);
    }
  };

  return (
    <header className="px-3 sm:px-5 py-2.5 bg-[#0a1120]/95 backdrop-blur-md border-b border-[#1c2c45] flex items-center justify-between gap-3 sticky top-0 z-30">
      {/* Brand & File Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-[#09151c] font-black text-sm tracking-wider">
            NOX
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 leading-tight">
              <span>NOX</span>
              <span className="text-emerald-400 font-medium">Tablet IDE</span>
            </h1>
            <p className="text-[10px] text-slate-400 hidden sm:block leading-tight">
              브라우저 및 태블릿용 반응형 인터프리터 스튜디오
            </p>
          </div>
        </div>

        {/* Current File indicator */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-300 bg-[#121c2d] px-2.5 py-1 rounded-md border border-[#213550]">
          <Code size={13} className="text-cyan-400" />
          <span className="font-mono text-[11px]">{currentFileName}</span>
        </div>
      </div>

      {/* Primary Actions: Run, Step, Examples, Docs */}
      <div className="flex items-center gap-2">
        {/* Run Button */}
        <button
          type="button"
          onClick={onRun}
          disabled={isRunning}
          title="코드 실행 (Ctrl + Enter)"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-[#062017] font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <Play size={14} className="fill-current" />
          <span>실행</span>
        </button>

        {/* Step Debug Button */}
        <button
          type="button"
          onClick={onStep}
          title="한 줄씩 단계별 디버깅 실행"
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-all active:scale-95 cursor-pointer ${
            isStepping
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              : 'bg-[#15233b] hover:bg-[#1d3152] text-slate-200 border-[#2b3f61]'
          }`}
        >
          <StepForward size={14} className="text-amber-400" />
          <span className="hidden sm:inline">단계 실행</span>
        </button>

        {/* Reset */}
        <button
          type="button"
          onClick={onReset}
          title="실행 상태 초기화"
          className="p-2 rounded-lg bg-[#142033] hover:bg-[#1c2e49] text-slate-300 hover:text-white border border-[#233754] text-xs transition-colors cursor-pointer"
        >
          <RotateCcw size={14} />
        </button>

        <div className="h-4 w-[1px] bg-[#223552] mx-0.5 hidden sm:block" />

        {/* Examples Selector */}
        <div className="relative group">
          <select
            onChange={e => {
              const selected = examples.find(ex => ex.id === e.target.value);
              if (selected) onSelectExample(selected);
              e.target.value = '';
            }}
            defaultValue=""
            className="px-2.5 py-1.5 rounded-lg bg-[#142033] hover:bg-[#1c2e49] text-slate-200 border border-[#233754] text-xs font-medium transition-colors cursor-pointer outline-none max-w-[120px] sm:max-w-none"
          >
            <option value="" disabled>
              💡 예제 불러오기
            </option>
            {examples.map(ex => (
              <option key={ex.id} value={ex.id} className="bg-[#0e172a] text-slate-200">
                [{ex.category.split(' ')[0]}] {ex.title}
              </option>
            ))}
          </select>
        </div>

        {/* File Actions */}
        <div className="hidden lg:flex items-center gap-1">
          <button
            type="button"
            onClick={onNewFile}
            title="새 파일"
            className="p-1.5 rounded-lg bg-[#142033] hover:bg-[#1c2e49] text-slate-300 hover:text-white border border-[#233754] text-xs transition-colors cursor-pointer"
          >
            <FilePlus size={14} />
          </button>
          <button
            type="button"
            onClick={onSaveFile}
            title=".nox 파일로 내보내기/저장"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#142033] hover:bg-[#1c2e49] text-slate-300 hover:text-white border border-[#233754] text-xs font-medium transition-colors cursor-pointer"
          >
            <Download size={13} />
            <span>.nox 저장</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="기존 .nox 파일 열기"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#142033] hover:bg-[#1c2e49] text-slate-300 hover:text-white border border-[#233754] text-xs font-medium transition-colors cursor-pointer"
          >
            <FolderOpen size={13} />
            <span>파일 열기</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".nox,.txt,text/plain"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Cheatsheet Guide Modal Button */}
        <button
          type="button"
          onClick={onOpenDocs}
          title="문법 및 함수 안내"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/50 text-cyan-300 border border-cyan-800/50 text-xs font-medium transition-colors cursor-pointer"
        >
          <BookOpen size={14} />
          <span className="hidden md:inline">문법 안내</span>
        </button>
      </div>
    </header>
  );
};
