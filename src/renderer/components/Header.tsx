import React from 'react';

interface HeaderProps {
  leftSidebarCollapsed: boolean;
  setLeftSidebarCollapsed: (collapsed: boolean) => void;
  rightSidebarCollapsed: boolean;
  setRightSidebarCollapsed: (collapsed: boolean) => void;
  activeChatName: string;
  activeProjectName: string;
  provider: string;
  setProvider: (provider: string) => void;
  model: string;
  setModel: (model: string) => void;
  providers: string[];
  modelsMap: Record<string, string[]>;
}

export default function Header({
  leftSidebarCollapsed,
  setLeftSidebarCollapsed,
  rightSidebarCollapsed,
  setRightSidebarCollapsed,
  activeChatName,
  activeProjectName,
  provider,
  setProvider,
  model,
  setModel,
  providers,
  modelsMap,
}: HeaderProps) {
  return (
    <header className="main-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
          title={leftSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <span className="material-symbols-rounded">
            {leftSidebarCollapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
        <div className="header-title-section">
          <span className="header-chat-name">{activeChatName}</span>
          <span className="header-chat-meta">
            <span className="status-dot" />
            Active context: {activeProjectName}
          </span>
        </div>
      </div>

      <div className="header-controls">
        <div className="select-input-container">
          <label htmlFor="provider-select">
            Provider
            <select
              id="provider-select"
              className="select-input"
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value);
                setModel(modelsMap[e.target.value][0]);
              }}
            >
              {providers.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="select-input-container">
          <label htmlFor="model-select">
            Model
            <select
              id="model-select"
              className="select-input"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {modelsMap[provider]?.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          className="icon-btn"
          onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
          title="Sampler & Settings"
        >
          <span className="material-symbols-rounded">settings</span>
        </button>
      </div>
    </header>
  );
}
