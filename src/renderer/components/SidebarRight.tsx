import React from 'react';
import { SamplerSettings } from '../types';

interface SidebarRightProps {
  collapsed: boolean;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  samplerSettings: SamplerSettings;
  setSamplerSettings: (settings: SamplerSettings) => void;
  selectionMode: boolean;
  setSelectionMode: (mode: boolean) => void;
  selectedMessageIds: Set<string>;
  setSelectedMessageIds: (ids: Set<string>) => void;
  handleForkSelection: () => void;
  handleDeleteSelected: () => void;
  handleExportWholeChat: () => void;
  handleSaveToFile: () => void;
}

export default function SidebarRight({
  collapsed,
  systemPrompt,
  setSystemPrompt,
  samplerSettings,
  setSamplerSettings,
  selectionMode,
  setSelectionMode,
  selectedMessageIds,
  setSelectedMessageIds,
  handleForkSelection,
  handleDeleteSelected,
  handleExportWholeChat,
  handleSaveToFile,
}: SidebarRightProps) {
  return (
    <aside className={`right-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div
        className="section-header"
        style={{ height: '64px', display: 'flex', alignItems: 'center' }}
      >
        <span style={{ fontWeight: 700, fontSize: '1rem' }}>
          Configuration Panel
        </span>
      </div>

      <div className="right-sidebar-scroll">
        <div className="settings-group">
          <span className="settings-group-title">System Prompt</span>
          <textarea
            className="system-prompt-textarea"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="System prompt instructions..."
          />
        </div>

        <div className="settings-group">
          <span className="settings-group-title">Sampler Settings</span>

          <div className="sampler-item">
            <div className="sampler-label-row">
              <span className="sampler-name">Temperature</span>
              <span className="sampler-value">
                {samplerSettings.temperature}
              </span>
            </div>
            <input
              type="range"
              className="sampler-slider"
              min="0.0"
              max="2.0"
              step="0.1"
              value={samplerSettings.temperature}
              onChange={(e) =>
                setSamplerSettings({
                  ...samplerSettings,
                  temperature: parseFloat(e.target.value),
                })
              }
            />
          </div>

          <div className="sampler-item">
            <div className="sampler-label-row">
              <span className="sampler-name">Max Completion Tokens</span>
              <span className="sampler-value">{samplerSettings.maxTokens}</span>
            </div>
            <input
              type="range"
              className="sampler-slider"
              min="100"
              max="16384"
              step="100"
              value={samplerSettings.maxTokens}
              onChange={(e) =>
                setSamplerSettings({
                  ...samplerSettings,
                  maxTokens: parseInt(e.target.value, 10),
                })
              }
            />
          </div>

          <div className="sampler-item">
            <div className="sampler-label-row">
              <span className="sampler-name">Top P</span>
              <span className="sampler-value">{samplerSettings.topP}</span>
            </div>
            <input
              type="range"
              className="sampler-slider"
              min="0.0"
              max="1.0"
              step="0.05"
              value={samplerSettings.topP}
              onChange={(e) =>
                setSamplerSettings({
                  ...samplerSettings,
                  topP: parseFloat(e.target.value),
                })
              }
            />
          </div>

          <div className="sampler-item">
            <div className="sampler-label-row">
              <span className="sampler-name">Presence Penalty</span>
              <span className="sampler-value">
                {samplerSettings.presencePenalty}
              </span>
            </div>
            <input
              type="range"
              className="sampler-slider"
              min="-2.0"
              max="2.0"
              step="0.1"
              value={samplerSettings.presencePenalty}
              onChange={(e) =>
                setSamplerSettings({
                  ...samplerSettings,
                  presencePenalty: parseFloat(e.target.value),
                })
              }
            />
          </div>
        </div>

        <div className="settings-group">
          <span className="settings-group-title">Batch & Utility Actions</span>
          <div className="btn-grid">
            <button
              type="button"
              className={`action-btn-block ${selectionMode ? 'active' : ''}`}
              onClick={() => {
                setSelectionMode(!selectionMode);
                setSelectedMessageIds(new Set());
              }}
            >
              <span
                className="material-symbols-rounded"
                style={{ fontSize: '20px' }}
              >
                check_box
              </span>
              {selectionMode
                ? 'Exit Selection Mode'
                : 'Enable Message Selection'}
            </button>

            {selectionMode && (
              <>
                <button
                  type="button"
                  className="action-btn-block"
                  onClick={handleForkSelection}
                  disabled={selectedMessageIds.size === 0}
                  style={{ opacity: selectedMessageIds.size === 0 ? 0.5 : 1 }}
                >
                  <span
                    className="material-symbols-rounded"
                    style={{ fontSize: '20px' }}
                  >
                    fork_right
                  </span>
                  Fork Selected to New Chat
                </button>

                <button
                  type="button"
                  className="action-btn-block"
                  onClick={handleDeleteSelected}
                  disabled={selectedMessageIds.size === 0}
                  style={{
                    opacity: selectedMessageIds.size === 0 ? 0.5 : 1,
                    color: 'var(--color-danger)',
                  }}
                >
                  <span
                    className="material-symbols-rounded"
                    style={{ fontSize: '20px' }}
                  >
                    delete
                  </span>
                  Delete Selected Messages
                </button>
              </>
            )}

            <button
              type="button"
              className="action-btn-block"
              onClick={handleExportWholeChat}
            >
              <span
                className="material-symbols-rounded"
                style={{ fontSize: '20px' }}
              >
                content_copy
              </span>
              Copy Whole Chat to Clipboard
            </button>

            <button
              type="button"
              className="action-btn-block"
              onClick={handleSaveToFile}
            >
              <span
                className="material-symbols-rounded"
                style={{ fontSize: '20px' }}
              >
                save
              </span>
              Save Chat to File
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
