import React from 'react';
import { ReportStatus } from '../types';
import { Clock, CheckCircle2, AlertCircle, Wrench, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: ReportStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let bg = 'bg-slate-100 text-slate-700 border-slate-300';
  let icon = <Clock className="w-3.5 h-3.5" />;

  switch (status) {
    case 'Reported':
      bg = 'bg-amber-50 text-amber-800 border-amber-200';
      icon = <Clock className="w-3.5 h-3.5 text-amber-600" />;
      break;
    case 'Assigned':
      bg = 'bg-blue-50 text-blue-800 border-blue-200';
      icon = <AlertCircle className="w-3.5 h-3.5 text-blue-600" />;
      break;
    case 'In Progress':
      bg = 'bg-indigo-50 text-indigo-800 border-indigo-200';
      icon = <Wrench className="w-3.5 h-3.5 text-indigo-600 animate-spin" style={{ animationDuration: '6s' }} />;
      break;
    case 'Resolved':
      bg = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium';
      icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      break;
    case 'Rejected':
      bg = 'bg-rose-50 text-rose-800 border-rose-200';
      icon = <XCircle className="w-3.5 h-3.5 text-rose-600" />;
      break;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  }[size];

  return (
    <span className={`inline-flex items-center rounded-full border ${bg} ${sizeClasses}`}>
      {icon}
      <span>{status}</span>
    </span>
  );
};
