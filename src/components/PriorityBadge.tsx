import React from 'react';
import { PriorityLevel } from '../types';
import { AlertCircle, AlertTriangle, ShieldAlert, Info } from 'lucide-react';

interface PriorityBadgeProps {
  priority: PriorityLevel | string;
  score?: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  score,
  showScore = false,
  size = 'md',
}) => {
  const p = (priority || 'medium').toLowerCase();

  let bg = 'bg-amber-100 text-amber-800 border-amber-300';
  let icon = <AlertCircle className="w-3.5 h-3.5" />;
  let label = 'Medium Priority';

  if (p === 'critical') {
    bg = 'bg-rose-100 text-rose-800 border-rose-300 font-semibold';
    icon = <ShieldAlert className="w-3.5 h-3.5 text-rose-600 animate-pulse" />;
    label = 'Critical Priority';
  } else if (p === 'high') {
    bg = 'bg-orange-100 text-orange-800 border-orange-300 font-medium';
    icon = <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />;
    label = 'High Priority';
  } else if (p === 'low') {
    bg = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    icon = <Info className="w-3.5 h-3.5 text-emerald-600" />;
    label = 'Low Priority';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border ${bg} ${sizeClasses}`}
    >
      {icon}
      <span>{label}</span>
      {showScore && score !== undefined && (
        <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/70 text-[10px] font-mono font-bold shadow-2xs">
          {score} pts
        </span>
      )}
    </span>
  );
};
