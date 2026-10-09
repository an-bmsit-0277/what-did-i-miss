import React from 'react';
import type { ActiveTab } from '../types';
import { Layers, CheckSquare, AlertCircle } from 'lucide-react';

interface NavigationTabsProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  taskCount: number;
  importantCount: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onTabChange,
  taskCount,
  importantCount,
}) => {
  return (
    <div className="flex items-center border-b border-slate-200 bg-white px-2 select-none">
      {/* Overview Tab */}
      <button
        type="button"
        onClick={() => onTabChange('overview')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-all ${
          activeTab === 'overview'
            ? 'border-emerald-600 text-emerald-700'
            : 'border-transparent text-slate-500 hover:text-slate-800'
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        <span>Overview</span>
      </button>

      {/* Tasks Tab */}
      <button
        type="button"
        onClick={() => onTabChange('tasks')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-all ${
          activeTab === 'tasks'
            ? 'border-emerald-600 text-emerald-700'
            : 'border-transparent text-slate-500 hover:text-slate-800'
        }`}
      >
        <CheckSquare className="w-3.5 h-3.5" />
        <span>Tasks</span>
        {taskCount > 0 && (
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'tasks'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {taskCount}
          </span>
        )}
      </button>

      {/* Important Tab */}
      <button
        type="button"
        onClick={() => onTabChange('important')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-all ${
          activeTab === 'important'
            ? 'border-emerald-600 text-emerald-700'
            : 'border-transparent text-slate-500 hover:text-slate-800'
        }`}
      >
        <AlertCircle className="w-3.5 h-3.5" />
        <span>Important</span>
        {importantCount > 0 && (
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'important'
                ? 'bg-rose-100 text-rose-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {importantCount}
          </span>
        )}
      </button>
    </div>
  );
};

