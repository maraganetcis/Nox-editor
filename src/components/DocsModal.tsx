import React, { useState } from 'react';
import { X, BookOpen, Copy, Check, Plus, ExternalLink, Lightbulb, Code2 } from 'lucide-react';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertCode: (code: string) => void;
}

interface CheatsheetSection {
  title: string;
  desc: string;
  snippets: {
    title: string;
    code: string;
    explanation: string;
  }[];
}

export const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose, onInsertCode }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null);

  if (!isOpen) return null;

  const sections: CheatsheetSection[] = [
    {
      title: '기초 문법 & 출력',
      desc: 'NOX의 가장 기본적인 출력과 변수 정의',
      snippets: [
        {
          title: 'say 문 (콘솔 출력)',
          code: `say "안녕하세요, NOX!"\nsay 10 + 20\nsay [1, 2, 3]`,
          explanation: 'say 키워드로 화면에 텍스트, 숫자, 계산식, 배열을 손쉽게 출력합니다.'
        },
        {
          title: '변수 대입 및 문자열 연결',
          code: `name = "길동"\nage = 17\nsay name + "님의 나이는 " + str(age) + "세입니다."`,
          explanation: '= 기호로 변수를 선언합니다. 숫자를 문자열과 연결할 때는 str() 함수를 사용합니다.'
        }
      ]
    },
    {
      title: '포함형 범위 & 리스트',
      desc: 'NOX 언어만의 독특한 양 끝 포함형 범위 (start, end)',
      snippets: [
        {
          title: '포함형 정수 범위 (start, end)',
          code: `say (1, 5)   # [1, 2, 3, 4, 5] 출력\nsay (5, 1)   # [5, 4, 3, 2, 1] 내림차순\nsay (3, 3)   # [3]`,
          explanation: '소괄호에 쉼표로 연결된 (시작, 끝)은 양 끝값을 모두 포함하는 배열을 생성합니다.'
        },
        {
          title: '리스트 및 인덱싱',
          code: `items = ["사과", "포도", "딸기"]\nsay items[0]          # 첫 번째 원소 "사과"\nsay items[-1]         # 마지막 원소 "딸기"\nsay len(items)        # 개수 3`,
          explanation: '대괄호 []로 리스트를 생성하며 0부터 시작하는 인덱스나 음수 인덱스로 접근할 수 있습니다.'
        }
      ]
    },
    {
      title: '조건문 (if / elif / otherwise)',
      desc: '상황에 따라 분기 처리하는 조건문',
      snippets: [
        {
          title: '기본 if / otherwise',
          code: `score = 85\nif score >= 80:\n    say "합격입니다!"\notherwise:\n    say "다음 기회에 도전하세요!"`,
          explanation: 'else 대신 친근한 otherwise: 키워드를 사용하여 조건을 분기합니다. 들여쓰기는 4칸을 권장합니다.'
        },
        {
          title: '다중 조건 elif',
          code: `num = 0\nif num > 0:\n    say "양수"\nelif num < 0:\n    say "음수"\notherwise:\n    say "0입니다"`,
          explanation: '여러 분기 조건을 검사할 때는 elif 키워드를 연쇄적으로 사용할 수 있습니다.'
        }
      ]
    },
    {
      title: '반복문 (for / while)',
      desc: '코드를 여러 번 반복 실행하는 루프 구문',
      snippets: [
        {
          title: '범위 for 반복문',
          code: `for n in (1, 5):\n    say "카운트: " + str(n)`,
          explanation: '포함형 범위 (1, 5)를 순회하며 1부터 5까지 총 5회 반복합니다.'
        },
        {
          title: '리스트 for 순회',
          code: `colors = ["빨강", "초록", "파랑"]\nfor c in colors:\n    say c`,
          explanation: '리스트나 문자열의 원소를 차례대로 하나씩 꺼내어 변수에 담아 실행합니다.'
        },
        {
          title: 'while 반복문과 break',
          code: `count = 1\nwhile count <= 10:\n    if count == 5:\n        break\n    say count\n    count = count + 1`,
          explanation: '조건이 참인 동안 계속 반복하며, break를 만나면 루프를 즉시 탈출합니다.'
        }
      ]
    },
    {
      title: '함수 정의 (fn)',
      desc: '독립적인 기능을 재사용 가능한 함수로 묶기',
      snippets: [
        {
          title: '기본 함수 정의와 반환',
          code: `fn add(a, b):\n    return a + b\n\nsay add(10, 25) # 35 출력`,
          explanation: 'fn 함수이름(매개변수): 형식으로 정의하고 return으로 결과값을 반환합니다.'
        },
        {
          title: '알고리즘 함수 예시',
          code: `fn max_val(a, b):\n    if a >= b:\n        return a\n    otherwise:\n        return b\n\nsay max_val(42, 19)`,
          explanation: '함수 안에서 조건문, 반복문, 내장 함수를 자유롭게 활용할 수 있습니다.'
        }
      ]
    },
    {
      title: '캔버스 그래픽 (draw.*)',
      desc: 'NOX 그래픽 캔버스에 도형과 아트 그리기',
      snippets: [
        {
          title: '기본 도형 그리기',
          code: `draw.clear("#080f1d")\ndraw.circle(240, 160, 60, "#70d6b2", true)\ndraw.rect(100, 100, 80, 50, "#38bdf8", true)\ndraw.line(50, 50, 430, 270, "#f43f5e", 3)\ndraw.text("Hello Canvas", 180, 260, "#ffffff", 16)`,
          explanation: 'draw.clear, draw.circle, draw.rect, draw.line, draw.text 등을 통해 멋진 비주얼을 만듭니다.'
        },
        {
          title: '황금 별 그리기',
          code: `draw.clear("#050814")\n# draw.star(중심x, 중심y, 꼭짓점수, 외부반지름, 내부반지름, 색상)\ndraw.star(240, 160, 5, 50, 25, "#fbbf24")`,
          explanation: 'draw.star 함수로 반짝이는 별 도형을 직접 그릴 수 있습니다.'
        }
      ]
    },
    {
      title: '내장 표준 함수',
      desc: '수학, 난수, 변환에 유용한 내장 도구',
      snippets: [
        {
          title: '수학 & 난수 도구',
          code: `say random(1, 100)   # 1부터 100 사이 무작위 난수\nsay abs(-42)          # 절댓값 42\nsay round(3.14159, 2) # 반올림 3.14\nsay sqrt(16)          # 제곱근 4\nsay min(10, 5, 20)    # 최소값 5\nsay max(10, 5, 20)    # 최대값 20`,
          explanation: '수학 계산과 게임 제작에 필수적인 표준 내장 함수들을 기본 지원합니다.'
        }
      ]
    }
  ];

  const handleCopy = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedIdx(id);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0c1424] border border-[#233550] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2e47] bg-[#0e172a]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                NOX 문법 및 함수 공식 안내서
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  v2.0 Spec
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                초보자부터 태블릿 코딩까지 누구나 쉽게 익히는 NOX 언어 핵심 가이드
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2842] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Navigation Sidebar */}
          <div className="w-full md:w-56 bg-[#09101d] border-b md:border-b-0 md:border-r border-[#1e2e47] p-2.5 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto no-scrollbar shrink-0">
            {sections.map((sec, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all shrink-0 cursor-pointer ${
                  activeTab === idx
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#121c2e]'
                }`}
              >
                {sec.title}
              </button>
            ))}
          </div>

          {/* Snippets View */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 bg-[#0b1220]">
            <div>
              <h3 className="text-base font-bold text-white mb-1">
                {sections[activeTab].title}
              </h3>
              <p className="text-xs text-slate-400">
                {sections[activeTab].desc}
              </p>
            </div>

            <div className="space-y-4">
              {sections[activeTab].snippets.map((snip, sIdx) => {
                const uniqueKey = `${activeTab}-${sIdx}`;
                const isCopied = copiedIdx === uniqueKey;

                return (
                  <div
                    key={sIdx}
                    className="p-4 rounded-xl bg-[#0e172a] border border-[#1f2f4a] flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-200 text-xs sm:text-sm flex items-center gap-1.5">
                        <Code2 size={14} className="text-cyan-400" />
                        <span>{snip.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopy(snip.code, uniqueKey)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-[#16233b] hover:bg-[#203454] text-slate-300 text-xs transition-colors cursor-pointer"
                        >
                          {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          <span>{isCopied ? '복사됨' : '복사'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onInsertCode(snip.code);
                            onClose();
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-medium transition-colors cursor-pointer"
                        >
                          <Plus size={12} />
                          <span>에디터에 삽입</span>
                        </button>
                      </div>
                    </div>

                    {/* Code Display */}
                    <pre className="p-3 rounded-lg bg-[#070c17] border border-[#19273c] text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed">
                      {snip.code}
                    </pre>

                    {/* Explanation */}
                    <div className="flex items-start gap-1.5 text-xs text-slate-400">
                      <Lightbulb size={13} className="text-amber-400 shrink-0 mt-0.5" />
                      <span>{snip.explanation}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1e2e47] bg-[#09101d] flex items-center justify-between text-xs text-slate-500">
          <span>NOX 브라우저 & 태블릿 실행 엔진 — 로컬에서 완전히 즉시 실행됩니다.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1a2942] hover:bg-[#23385a] text-slate-200 font-medium cursor-pointer transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
