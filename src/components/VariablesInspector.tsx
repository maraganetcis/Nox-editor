import React, { useState } from 'react';
import { NoxValue } from '../nox/types';
import { Database, Search, Brackets, Hash, Type, HelpCircle, Code } from 'lucide-react';

interface VariablesInspectorProps {
  variables: Record<string, NoxValue>;
}

export const VariablesInspector: React.FC<VariablesInspectorProps> = ({ variables }) => {
  const [filter, setFilter] = useState('');

  const entries = Object.entries(variables).filter(([key]) => {
    // Filter out built-in functions / internals if they don't match
    if (['len', 'abs', 'min', 'max', 'round', 'sqrt', 'random', 'int', 'float', 'str', 'bool', 'sin', 'cos', 'draw'].includes(key)) {
      return false;
    }
    if (!filter) return true;
    return key.toLowerCase().includes(filter.toLowerCase());
  });

  const getTypeLabel = (val: NoxValue): { label: string; color: string; icon: any } => {
    if (Array.isArray(val)) {
      return { label: `배열[${val.length}]`, color: 'text-amber-400 bg-amber-950/40 border-amber-800/40', icon: Brackets };
    }
    if (typeof val === 'number') {
      return { label: Number.isInteger(val) ? '정수' : '실수', color: 'text-purple-400 bg-purple-950/40 border-purple-800/40', icon: Hash };
    }
    if (typeof val === 'string') {
      return { label: `문자열(${val.length})`, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40', icon: Type };
    }
    if (typeof val === 'boolean') {
      return { label: '불리언', color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40', icon: HelpCircle };
    }
    if (typeof val === 'object' && val && '__isNoxFn' in val) {
      return { label: '사용자 함수', color: 'text-pink-400 bg-pink-950/40 border-pink-800/40', icon: Code };
    }
    return { label: '기타', color: 'text-slate-400 bg-slate-900 border-slate-700', icon: Database };
  };

  const formatDisplay = (val: NoxValue): string => {
    if (Array.isArray(val)) {
      if (val.length > 8) {
        return `[${val.slice(0, 8).map(v => JSON.stringify(v)).join(', ')}, ... +${val.length - 8}개]`;
      }
      return JSON.stringify(val);
    }
    if (typeof val === 'string') {
      return `"${val}"`;
    }
    if (typeof val === 'object' && val && '__isNoxFn' in val) {
      const fn = val as any;
      return `fn ${fn.name}(${fn.params.join(', ')})`;
    }
    return String(val);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a1120] rounded-xl border border-[#1e2c44] overflow-hidden text-xs">
      {/* Header & Filter */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0e172a] border-b border-[#1e2c44] gap-2">
        <div className="flex items-center gap-2">
          <Database size={15} className="text-purple-400" />
          <span className="font-semibold text-slate-200">변수 감시창 (Variables Watch)</span>
          <span className="text-[11px] px-1.5 py-0.2 rounded bg-[#17253d] text-slate-400 border border-[#2b3c58]">
            {entries.length}개
          </span>
        </div>

        {entries.length > 3 && (
          <div className="relative w-36">
            <Search size={12} className="absolute left-2 top-2 text-slate-500" />
            <input
              type="text"
              placeholder="변수명 검색..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="w-full bg-[#131d2e] border border-[#253752] rounded-md pl-6 pr-2 py-1 text-slate-200 text-[11px] outline-none focus:border-purple-400"
            />
          </div>
        )}
      </div>

      {/* Variables List */}
      <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#18263d]">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center text-slate-500">
            <Database size={24} className="mb-2 opacity-40 text-slate-400" />
            <p className="text-xs">현재 저장된 활성 변수가 없습니다.</p>
            <p className="text-[11px] text-slate-600 mt-1">코드를 실행하거나 단계별 디버깅을 시작하면 변수가 여기에 나타납니다.</p>
          </div>
        ) : (
          entries.map(([name, val]) => {
            const typeInfo = getTypeLabel(val);
            const Icon = typeInfo.icon;
            return (
              <div key={name} className="py-2 px-2 hover:bg-[#111c30] rounded-md transition-colors flex items-start justify-between gap-3 font-mono">
                <div className="flex flex-col gap-0.5 min-w-[100px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-cyan-300 font-semibold text-xs">{name}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${typeInfo.color} w-fit`}>
                    <Icon size={10} />
                    {typeInfo.label}
                  </span>
                </div>

                <div className="flex-1 text-right break-all text-slate-300 text-xs bg-[#070d18] px-2 py-1 rounded border border-[#1b283d] max-h-20 overflow-y-auto">
                  {formatDisplay(val)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
