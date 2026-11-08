import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Info,
  AlertCircle,
} from 'lucide-react';
import type { Instruction, InstructionType } from '@/types';

const TYPE_LABELS: Record<InstructionType, { label: string; color: string; icon: React.ElementType }> = {
  setup: { label: 'Початкове положення', color: 'text-neon-blue', icon: Info },
  movement: { label: 'Рух', color: 'text-neon-pink', icon: Info },
  breathing: { label: 'Дихання', color: 'text-neon-green', icon: Info },
  safety: { label: 'Безпека', color: 'text-neon-amber', icon: AlertCircle },
};

interface ExerciseInstructionProps {
  instructions: Instruction[];
  title?: string;
  className?: string;
}

export function ExerciseInstruction({
  instructions,
  title = 'Як виконувати',
  className = '',
}: ExerciseInstructionProps) {
  const [open, setOpen] = useState(false);

  if (!instructions || instructions.length === 0) return null;

  return (
    <div className={`cyber-panel overflow-hidden ${className}`}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-between w-full py-3 px-4 text-left bg-cyber-surface/50 border-b border-cyber-border/50 hover:bg-cyber-surface/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info size={16} className="text-neon-blue" />
          <span className="text-sm font-semibold tracking-widest uppercase">{title}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-cyber-muted" /> : <ChevronDown size={16} className="text-cyber-muted" />}
      </button>
      {open && (
        <div className="divide-y divide-cyber-border/40 px-4 pb-3 pt-2">
          {instructions.map((instruction, i) => {
            const meta = TYPE_LABELS[instruction.type];
            return (
              <div key={i} className="flex items-start gap-2.5 py-2">
                <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${meta.color} border-${meta.color === 'text-neon-blue' ? 'neon-blue' : meta.color === 'text-neon-pink' ? 'neon-pink' : meta.color === 'text-neon-green' ? 'neon-green' : 'neon-amber'}/20 bg-${meta.color === 'text-neon-blue' ? 'neon-blue' : meta.color === 'text-neon-pink' ? 'neon-pink' : meta.color === 'text-neon-green' ? 'neon-green' : 'neon-amber'}/5`}>
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
                  </div>
                  <p className="text-xs text-cyber-text/85 leading-relaxed mt-0.5">{instruction.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
