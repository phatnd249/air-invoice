import React from 'react';
import { SettingsTabId, SETTINGS_TABS } from './types';

interface SettingsTabsNavProps {
  activeTab: SettingsTabId;
  setActiveTab: (tab: SettingsTabId) => void;
}

export function SettingsTabsNav({ activeTab, setActiveTab }: SettingsTabsNavProps) {
  return (
    <div className="sticky top-16 z-20 bg-slate-50/90 -mx-2 px-2 pb-2 backdrop-blur">
      <nav className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xs flex-wrap">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

