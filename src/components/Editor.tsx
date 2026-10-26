import React, { useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react';
import { TabletKeypad } from './TabletKeypad';
import { Sparkles, FileCode, Copy, Check, RotateCcw } from 'lucide-react';

export interface EditorHandle {
  insertText: (text: string, cursorOffset?: number) => void;
  indent: () => void;
  outdent: () => void;
  focus: () => void;
}

interface EditorProps {
  code: string;
  onChange: (newCode: string) => void;
  activeLine?: number | null;
  errorLine?: number | null;
  fileName?: string;
  onRun?: () => void;
}

export const Editor = forwardRef<EditorHandle, EditorProps>(({
  code,
  onChange,
  activeLine = null,
  errorLine = null,
  fileName = 'main.nox',
  onRun
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lineNumbersRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);

  const lines = code.split('\n');
  const lineCount = Math.max(lines.length, 1);

  // Sync scroll between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const insertTextAtCursor = (text: string, cursorOffset?: number) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = code.substring(0, start);
    const after = code.substring(end);
    const newCode = before + text + after;
    onChange(newCode);

    setTimeout(() => {
      el.focus();
      const newPos = start + (cursorOffset !== undefined ? cursorOffset : text.length);
      el.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleIndent = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    if (start === end) {
      // Just insert 4 spaces at cursor
      insertTextAtCursor('    ', 4);
    } else {
      // Indent selected lines
      const lineStart = code.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = code.indexOf('\n', end);
      const effectiveEnd = lineEnd === -1 ? code.length : lineEnd;
      const selectedBlock = code.substring(lineStart, effectiveEnd);
      const indentedBlock = selectedBlock
        .split('\n')
        .map(l => '    ' + l)
        .join('\n');

      const newCode = code.substring(0, lineStart) + indentedBlock + code.substring(effectiveEnd);
      onChange(newCode);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(lineStart, lineStart + indentedBlock.length);
      }, 0);
    }
  };

  const handleOutdent = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const lineStart = code.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = code.indexOf('\n', end);
    const effectiveEnd = lineEnd === -1 ? code.length : lineEnd;
    const selectedBlock = code.substring(lineStart, effectiveEnd);

    const outdentedBlock = selectedBlock
      .split('\n')
      .map(l => (l.startsWith('    ') ? l.substring(4) : l.replace(/^\s{1,3}/, '')))
      .join('\n');

    const newCode = code.substring(0, lineStart) + outdentedBlock + code.substring(effectiveEnd);
    onChange(newCode);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(lineStart, lineStart + outdentedBlock.length);
    }, 0);
  };

  useImperativeHandle(ref, () => ({
    insertText: insertTextAtCursor,
    indent: handleIndent,
    outdent: handleOutdent,
    focus: () => textareaRef.current?.focus()
  }));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = textareaRef.current;
    if (!el) return;

    // Ctrl+Enter or Cmd+Enter to Run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (onRun) onRun();
      return;
    }

    // Tab key handling
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        handleOutdent();
      } else {
        handleIndent();
      }
      return;
    }

    // Auto-indentation after Enter
    if (e.key === 'Enter') {
      const cursor = el.selectionStart;
      const lineStart = code.lastIndexOf('\n', cursor - 1) + 1;
      const currentLineText = code.substring(lineStart, cursor);
      const indentMatch = currentLineText.match(/^ */);
      let indent = indentMatch ? indentMatch[0] : '';

      // If line ends with a colon :, increase indent by 4 spaces
      if (currentLineText.trim().endsWith(':')) {
        indent += '    ';
      }

      e.preventDefault();
      const insert = '\n' + indent;
      insertTextAtCursor(insert, insert.length);
      return;
    }

    // Auto-closing quotes and brackets
    const pairs: Record<string, string> = {
      '"': '"',
      "'": "'",
      '(': ')',
      '[': ']',
      '{': '}'
    };

    if (pairs[e.key]) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      if (start !== end) {
        // Wrap selected text
        e.preventDefault();
        const selected = code.substring(start, end);
        const wrapped = e.key + selected + pairs[e.key];
        const newCode = code.substring(0, start) + wrapped + code.substring(end);
        onChange(newCode);
        setTimeout(() => {
          el.setSelectionRange(start + 1, end + 1);
        }, 0);
        return;
      } else {
        // Auto-close single quote/bracket
        e.preventDefault();
        insertTextAtCursor(e.key + pairs[e.key], 1);
        return;
      }
    }
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a1120] rounded-xl border border-[#1e2c44] overflow-hidden shadow-lg">
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0e172a] border-b border-[#1e2c44] text-xs">
        <div className="flex items-center gap-2">
          <FileCode size={15} className="text-cyan-400" />
          <span className="font-semibold text-slate-200 font-mono">{fileName}</span>
          <span className="text-[11px] text-slate-400 px-1.5 py-0.5 rounded bg-[#17253d] border border-[#263b59]">
            {lineCount}줄 · {code.length}자
          </span>
          {activeLine && (
            <span className="text-[11px] text-amber-300 font-mono bg-amber-950/60 border border-amber-700/50 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
              <span>▶ 현재 실행 중: {activeLine}행</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyCode}
            title="전체 코드 복사"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#16253e] hover:bg-[#203657] text-slate-200 border border-[#263c5e] text-xs font-medium transition-colors cursor-pointer"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? '복사됨' : '복사'}</span>
          </button>
        </div>
      </div>

      {/* Editor Main Canvas (Line Numbers + Textarea) */}
      <div className="relative flex-1 flex overflow-hidden bg-[#070d1a]">
        {/* Line Numbers Column */}
        <div
          ref={lineNumbersRef}
          className="w-12 select-none overflow-hidden bg-[#070d18] text-right font-mono text-[13px] leading-[24px] text-slate-600 border-r border-[#172438] py-3 pr-2.5 shrink-0"
        >
          {Array.from({ length: lineCount }).map((_, i) => {
            const lineNum = i + 1;
            const isActive = activeLine === lineNum;
            const isError = errorLine === lineNum;

            return (
              <div
                key={i}
                className={`h-[24px] transition-colors flex items-center justify-end gap-1 ${
                  isActive
                    ? 'text-amber-300 font-bold bg-amber-500/20'
                    : isError
                    ? 'text-rose-400 font-bold bg-rose-500/20'
                    : 'hover:text-slate-400'
                }`}
              >
                {isActive && <span className="text-[10px] text-amber-400">▶</span>}
                {isError && <span className="text-[10px] text-rose-400">●</span>}
                <span>{lineNum}</span>
              </div>
            );
          })}
        </div>

        {/* Text Area */}
        <div className="relative flex-1 h-full">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="w-full h-full p-3 font-mono text-[13px] leading-[24px] text-[#e0f2fe] bg-transparent resize-none outline-none border-0 overflow-auto whitespace-pre selection:bg-cyan-600/30 selection:text-cyan-100"
            style={{ tabSize: 4 }}
            placeholder={`say "Hello, NOX!"\nname = "NOX"\nsay name\n\nfor n in (1, 5):\n    say n`}
          />
        </div>
      </div>

      {/* Quick Tablet Keypad */}
      <TabletKeypad
        onInsertText={insertTextAtCursor}
        onIndent={handleIndent}
        onOutdent={handleOutdent}
      />
    </div>
  );
});
