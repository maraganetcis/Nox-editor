import React, { useRef, useEffect, useState } from 'react';
import { DrawCommand } from '../nox/types';
import { Download, RefreshCw, Crosshair, Palette, Maximize2 } from 'lucide-react';

interface CanvasRendererProps {
  commands: DrawCommand[];
  width?: number;
  height?: number;
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({
  commands,
  width = 480,
  height = 320
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);
  const [showCoordinates, setShowCoordinates] = useState(true);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset transform & clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const cmd of commands) {
      try {
        switch (cmd.type) {
          case 'clear': {
            const color = cmd.args[0] || '#0b1220';
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
          }
          case 'circle': {
            const [x, y, r, color, fill] = cmd.args;
            ctx.beginPath();
            ctx.arc(Number(x), Number(y), Math.max(0, Number(r)), 0, Math.PI * 2);
            if (fill !== false) {
              ctx.fillStyle = color || '#70d6b2';
              ctx.fill();
            } else {
              ctx.strokeStyle = color || '#70d6b2';
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }
            break;
          }
          case 'rect': {
            const [x, y, w, h, color, fill] = cmd.args;
            if (fill !== false) {
              ctx.fillStyle = color || '#38bdf8';
              ctx.fillRect(Number(x), Number(y), Number(w), Number(h));
            } else {
              ctx.strokeStyle = color || '#38bdf8';
              ctx.lineWidth = 1.5;
              ctx.strokeRect(Number(x), Number(y), Number(w), Number(h));
            }
            break;
          }
          case 'line': {
            const [x1, y1, x2, y2, color, lineWidth] = cmd.args;
            ctx.beginPath();
            ctx.moveTo(Number(x1), Number(y1));
            ctx.lineTo(Number(x2), Number(y2));
            ctx.strokeStyle = color || '#e2e8f0';
            ctx.lineWidth = Number(lineWidth) || 2;
            ctx.stroke();
            break;
          }
          case 'pixel': {
            const [x, y, color] = cmd.args;
            ctx.fillStyle = color || '#70d6b2';
            ctx.fillRect(Math.floor(x), Math.floor(y), 2, 2);
            break;
          }
          case 'text': {
            const [text, x, y, color, size] = cmd.args;
            ctx.font = `${Number(size) || 15}px system-ui, -apple-system, sans-serif`;
            ctx.fillStyle = color || '#ffffff';
            ctx.fillText(String(text), Number(x), Number(y));
            break;
          }
          case 'star': {
            const [cx, cy, spikes, outerRadius, innerRadius, color] = cmd.args;
            let rot = (Math.PI / 2) * 3;
            let x = Number(cx);
            let y = Number(cy);
            const step = Math.PI / Number(spikes || 5);

            ctx.beginPath();
            ctx.moveTo(Number(cx), Number(cy) - Number(outerRadius));
            for (let i = 0; i < Number(spikes || 5); i++) {
              x = Number(cx) + Math.cos(rot) * Number(outerRadius);
              y = Number(cy) + Math.sin(rot) * Number(outerRadius);
              ctx.lineTo(x, y);
              rot += step;

              x = Number(cx) + Math.cos(rot) * Number(innerRadius);
              y = Number(cy) + Math.sin(rot) * Number(innerRadius);
              ctx.lineTo(x, y);
              rot += step;
            }
            ctx.lineTo(Number(cx), Number(cy) - Number(outerRadius));
            ctx.closePath();
            ctx.fillStyle = color || '#fbbf24';
            ctx.fill();
            break;
          }
        }
      } catch (err) {
        console.error('Canvas command error:', err);
      }
    }
  };

  useEffect(() => {
    renderCanvas();
  }, [commands, width, height]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    setHoverCoords({ x, y });
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = `nox_canvas_${Date.now()}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  return (
    <div className="flex flex-col h-full bg-[#0a1120] rounded-xl border border-[#1e2c44] overflow-hidden">
      {/* Canvas Top Controls */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0e172a] border-b border-[#1e2c44] text-xs">
        <div className="flex items-center gap-2">
          <Palette size={15} className="text-cyan-400" />
          <span className="font-semibold text-slate-200">NOX 그래픽 캔버스</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#17253d] text-slate-400 border border-[#2b3c58]">
            {width}x{height}
          </span>
          {commands.length > 0 && (
            <span className="text-[11px] text-emerald-400 font-mono">
              {commands.length}개 그리기 명령
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {hoverCoords && showCoordinates && (
            <div className="font-mono text-[11px] text-cyan-300 bg-[#16233b] px-2 py-0.5 rounded border border-cyan-800/40">
              X:{hoverCoords.x} Y:{hoverCoords.y}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowCoordinates(!showCoordinates)}
            title="좌표 오버레이 표시"
            className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
              showCoordinates ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-700/50' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crosshair size={14} />
          </button>
          <button
            type="button"
            onClick={renderCanvas}
            title="캔버스 다시 그리기"
            className="p-1.5 rounded text-xs text-slate-300 hover:text-white hover:bg-[#1a2842] transition-colors cursor-pointer"
          >
            <RefreshCw size={14} />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            title="PNG 이미지로 저장"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#16253e] hover:bg-cyan-600/30 text-cyan-300 border border-cyan-600/30 text-xs font-medium transition-colors cursor-pointer"
          >
            <Download size={13} />
            <span>저장</span>
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="flex-1 flex items-center justify-center p-3 bg-[#080d1a] relative overflow-hidden">
        <div className="relative border border-[#1e2a42] rounded-lg shadow-2xl overflow-hidden bg-[#0b1220]">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverCoords(null)}
            className="block max-w-full h-auto cursor-crosshair touch-none"
            style={{ aspectRatio: `${width}/${height}` }}
          />

          {commands.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center pointer-events-none bg-[#0b1220]/80 backdrop-blur-xs">
              <Palette size={28} className="text-slate-600 mb-2" />
              <p className="text-xs text-slate-400">아직 그래픽 명령이 실행되지 않았습니다.</p>
              <code className="text-[11px] text-cyan-400 font-mono mt-1 bg-[#121c2e] px-2 py-0.5 rounded border border-[#1f2f4a]">
                draw.circle(240, 160, 50, "#70d6b2")
              </code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
