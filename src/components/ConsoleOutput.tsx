import React, { useState } from 'react';
import { Terminal, Copy, Check, Trash2, Download, AlertTriangle, Clock, Zap } from 'lucide-react';

interface ConsoleOutputProps {
  output: string[];
  error: string | null;
  status: string;
  executionTimeMs: number;
  totalSteps: number;
  onClear: () => void;
}

export const ConsoleOutput: React.FC<ConsoleOutputProps> = ({
  output,
  error,
  status,
  executionTimeMs,
  totalSteps,
  onClear,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const textToCopy = error ? `[오류]\n${error}\n\n[출력]\n${output.join('\n')}` : output.join('\n');
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownloadLog = () => {
    const content = `=== NOX 실행 기록 ===\n상태: ${status}\n실행 시간: ${executionTimeMs}ms\n단계: ${totalSteps}\n\n${error ? `[오류]\n${error}\n\n` : ''}[출력]\n${output.join('\n')}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `nox_output_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const isError = Boolean(error);

  return (
    <div className="flex flex-col h-full bg-[#0a1120] rounded-xl border border-[#1e2c44] overflow-hidden">
      {/* Console Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0e172a] border-b border-[#1e2c44] text-xs">
        <div className="flex items-center gap-2">
          <Terminal size={15} className={isError ? 'text-rose-400' : 'text-emerald-400'} />
          <span className="font-semibold text-slate-200">터미널 실행 결과</span>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${
              isError
                ? 'bg-rose-950/40 text-rose-300 border-rose-800/40'
                : status.includes('완료')
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {status}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {executionTimeMs > 0 && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 font-mono bg-[#142033] px-2 py-0.5 rounded border border-[#223552]">
              <Clock size={11} className="text-cyan-400" />
              <span>{executionTimeMs}ms</span>
              {totalSteps > 0 && (
                <>
                  <span className="text-slate-600">|</span>
                  <Zap size={11} className="text-amber-400" />
                  <span>{totalSteps} steps</span>
                </>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleCopy}
            title="결과 클립보드에 복사"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#16253e] hover:bg-[#203657] text-slate-200 border border-[#263c5e] text-xs font-medium transition-colors cursor-pointer"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copied ? '복사됨' : '복사'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadLog}
            title="텍스트 파일로 저장"
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-[#1a2842] transition-colors cursor-pointer"
          >
            <Download size={14} />
          </button>

          <button
            type="button"
            onClick={onClear}
            title="터미널 지우기"
            className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Console Body */}
      <div className="flex-1 p-3 overflow-y-auto font-mono text-[13px] leading-relaxed bg-[#070c17] select-text">
        {/* Error Box if any */}
        {error && (
          <div className="mb-3 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-200 flex items-start gap-2.5">
            <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-rose-300 text-xs mb-1">실행 오류 (Execution Error)</div>
              <div className="whitespace-pre-wrap break-all text-xs text-rose-100">{error}</div>
            </div>
          </div>
        )}

        {/* Output lines */}
        {output.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 py-8">
            <Terminal size={26} className="mb-2 opacity-30 text-slate-400" />
            <p className="text-xs">상단의 [▶ 실행] 버튼을 누르면 프로그램 결과가 여기에 출력됩니다.</p>
            <p className="text-[11px] text-slate-600 mt-1">단축키: Ctrl + Enter 또는 ⌘ + Enter</p>
          </div>
        ) : (
          <div className="space-y-1">
            {output.map((line, idx) => (
              <div key={idx} className="flex items-start gap-2.5 hover:bg-slate-900/60 px-1 py-0.5 rounded">
                <span className="text-[11px] text-slate-600 select-none w-6 text-right shrink-0">
                  {idx + 1}
                </span>
                <span className="text-[#a7f3d0] whitespace-pre-wrap break-all">{line}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
