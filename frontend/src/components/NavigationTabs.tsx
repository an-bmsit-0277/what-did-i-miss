import React from 'react';
import type { ActiveTab } from '@missed/engine';
import { Layers, CheckSquare, AlertCircle } from 'lucide-react';
import { SegmentedTabs, type TabItem } from './ui';

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
  const tabs: ReadonlyArray<TabItem<ActiveTab>> = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Layers className="w-3.5 h-3.5" />,
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: <CheckSquare className="w-3.5 h-3.5" />,
      count: Math.max(0, taskCount),
      badgeVariant: 'amber',
    },
    {
      id: 'important',
      label: 'Important',
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      count: Math.max(0, importantCount),
      badgeVariant: 'urgent',
    },
  ];

  return (
    <div className="px-4 py-2.5 bg-surface border-b border-border-default">
      <SegmentedTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={onTabChange}
        ariaLabel="Catch-up intelligence views"
        className="w-full"
      />
    </div>
  );
};
