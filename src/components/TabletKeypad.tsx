import React from 'react';
import { 
  Indent, 
  Outdent, 
  CornerDownLeft, 
  Hash, 
  Quote, 
  Equal, 
  HelpCircle 
} from 'lucide-react';

interface TabletKeypadProps {
  onInsertText: (text: string, cursorOffset?: number) => void;
  onIndent: () => void;
  onOutdent: () => void;
}

export const TabletKeypad: React.FC<TabletKeypadProps> = ({
  onInsertText,
  onIndent,
  onOutdent
}) => {
  const quickKeys = [
    { label: 'say', insert: 'say ', offset: 4, tip: '출력문', primary: true },
    { label: 'for in', insert: 'for i in (1, 5):\n    ', offset: 23, tip: '범위 반복' },
    { label: 'if', insert: 'if :\n    ', offset: 3, tip: '조건문' },
    { label: 'otherwise:', insert: 'otherwise:\n    ', offset: 15, tip: '그 외 블록' },
    { label: 'fn', insert: 'fn my_fn():\n    return 0', offset: 3, tip: '함수 정의' },
    { label: ':', insert: ':', offset: 1, tip: '콜론' },
    { label: '=', insert: ' = ', offset: 3, tip: '대입' },
    { label: '==', insert: ' == ', offset: 4, tip: '동등 비교' },
    { label: '" "', insert: '""', offset: 1, tip: '문자열' },
    { label: '( , )', insert: '(', offset: 1, tip: '괄호/범위' },
    { label: '[ ]', insert: '[]', offset: 1, tip: '리스트' },
    { label: 'draw.', insert: 'draw.', offset: 5, tip: '그래픽 함수' },
    { label: 'random', insert: 'random(1, 10)', offset: 13, tip: '난수 생성' },
    { label: '+', insert: ' + ', offset: 3, tip: '더하기' },
    { label: '-', insert: ' - ', offset: 3, tip: '빼기' },
    { label: '*', insert: ' * ', offset: 3, tip: '곱하기' },
    { label: '/', insert: ' / ', offset: 3, tip: '나누기' },
    { label: '#', insert: '# ', offset: 2, tip: '주석' },
  ];

  return (
    <div className="bg-[#0b1326] border-t border-[#1e293b] px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar select-none z-10">
      <div className="flex items-center gap-1 shrink-0 mr-1 border-r border-[#1e293b] pr-2">
        <button
          type="button"
          onClick={onIndent}
          title="들여쓰기 (Tab / 4칸)"
          className="p-1.5 text-xs text-slate-300 hover:text-white bg-[#152238] active:bg-cyan-600/30 border border-[#2b3c58] rounded-md transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Indent size={14} className="text-cyan-400" />
          <span className="font-mono text-[11px]">Tab</span>
        </button>
        <button
          type="button"
          onClick={onOutdent}
          title="내어쓰기 (Shift+Tab)"
          className="p-1.5 text-xs text-slate-300 hover:text-white bg-[#152238] active:bg-cyan-600/30 border border-[#2b3c58] rounded-md transition-colors flex items-center cursor-pointer"
        >
          <Outdent size={14} className="text-cyan-400" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {quickKeys.map((k, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onInsertText(k.insert, k.offset)}
            title={k.tip}
            className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-medium transition-all active:scale-95 cursor-pointer border ${
              k.primary
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-[#131f33] text-slate-200 border-[#223552] hover:bg-[#1a2c47] hover:border-cyan-500/30'
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>
    </div>
  );
};
