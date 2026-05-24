import React from 'react';
import { Project, Chat } from '../types';

interface SidebarLeftProps {
  collapsed: boolean;
  projects: Project[];
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  chats: Chat[];
  activeChatId: string;
  setActiveChatId: (id: string) => void;
  handleNewChat: () => void;
  handleNewProject: () => void;
  handleHideChat: (e: React.MouseEvent, id: string) => void;
  handleDeleteChat: (e: React.MouseEvent, id: string) => void;
}

export default function SidebarLeft({
  collapsed,
  projects,
  activeProjectId,
  setActiveProjectId,
  chats,
  activeChatId,
  setActiveChatId,
  handleNewChat,
  handleNewProject,
  handleHideChat,
  handleDeleteChat,
}: SidebarLeftProps) {
  const activeProject =
    projects.find((p) => p.id === activeProjectId) || projects[0];

  const renderChatTree = () => {
    const visibleChats = chats.filter((c) => !c.hidden);
    const rootChats = visibleChats.filter((c) => c.parentId === null);

    return rootChats.map((rootChat) => {
      const children = visibleChats.filter((c) => c.parentId === rootChat.id);
      return (
        <div key={rootChat.id} className="tree-node-container">
          <div
            className={`tree-node ${activeChatId === rootChat.id ? 'active' : ''}`}
            onClick={() => setActiveChatId(rootChat.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setActiveChatId(rootChat.id);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <span className="node-title">
              <span
                className="material-symbols-rounded"
                style={{ fontSize: '18px', marginRight: '6px' }}
              >
                chat_bubble
              </span>
              {rootChat.name}
            </span>
            <div className="node-actions">
              <button
                type="button"
                className="action-btn-mini"
                title="Hide Chat"
                onClick={(e) => handleHideChat(e, rootChat.id)}
              >
                <span
                  className="material-symbols-rounded"
                  style={{ fontSize: '16px' }}
                >
                  visibility_off
                </span>
              </button>
              <button
                type="button"
                className="action-btn-mini danger"
                title="Delete Chat"
                onClick={(e) => handleDeleteChat(e, rootChat.id)}
              >
                <span
                  className="material-symbols-rounded"
                  style={{ fontSize: '16px' }}
                >
                  delete
                </span>
              </button>
            </div>
          </div>
          {children.map((childChat) => (
            <div
              key={childChat.id}
              className={`tree-node ${activeChatId === childChat.id ? 'active' : ''}`}
              onClick={() => setActiveChatId(childChat.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setActiveChatId(childChat.id);
                }
              }}
              role="button"
              tabIndex={0}
              style={{ paddingLeft: '16px' }}
            >
              <div className="tree-indent" />
              <span
                className="material-symbols-rounded"
                style={{
                  fontSize: '16px',
                  marginRight: '4px',
                  color: 'var(--text-muted)',
                }}
              >
                fork_right
              </span>
              <span
                className="node-title"
                style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}
              >
                {childChat.name}
              </span>
              <div className="node-actions">
                <button
                  type="button"
                  className="action-btn-mini"
                  title="Hide"
                  onClick={(e) => handleHideChat(e, childChat.id)}
                >
                  <span
                    className="material-symbols-rounded"
                    style={{ fontSize: '16px' }}
                  >
                    visibility_off
                  </span>
                </button>
                <button
                  type="button"
                  className="action-btn-mini danger"
                  title="Delete"
                  onClick={(e) => handleDeleteChat(e, childChat.id)}
                >
                  <span
                    className="material-symbols-rounded"
                    style={{ fontSize: '16px' }}
                  >
                    delete
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    });
  };

  return (
    <aside className={`left-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="section-header">
        <div className="app-logo">
          <div className="logo-icon" />
          <span>Chatterbox</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--text-dark)',
              textTransform: 'uppercase',
            }}
          >
            Active Project
          </span>
          <select
            className="project-selector"
            value={activeProjectId}
            onChange={(e) => setActiveProjectId(e.target.value)}
          >
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="sidebar-scroll">
        <div className="list-section">
          <div className="list-section-title">
            <span>Conversations</span>
            <button
              type="button"
              className="add-btn-small"
              onClick={handleNewChat}
              title="New Chat"
            >
              <span
                className="material-symbols-rounded"
                style={{ fontSize: '16px', marginRight: '4px' }}
              >
                add
              </span>
              New
            </button>
          </div>
          {renderChatTree()}
        </div>

        <div
          className="list-section"
          style={{ marginTop: 'auto', padding: '8px' }}
        >
          <div className="list-section-title">Project Context</div>
          <div className="project-card">
            <div className="project-card-title">
              <span
                className="material-symbols-rounded"
                style={{
                  fontSize: '18px',
                  marginRight: '6px',
                  verticalAlign: 'text-bottom',
                }}
              >
                folder
              </span>
              {activeProject?.name}
            </div>
            <div className="project-card-summary">{activeProject?.summary}</div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                marginTop: '6px',
              }}
            >
              {activeProject?.connectors.map((c) => (
                <span
                  key={`connector-${activeProject.id}-${c}`}
                  className="connector-pill"
                >
                  <span
                    className="material-symbols-rounded"
                    style={{ fontSize: '14px', marginRight: '4px' }}
                  >
                    link
                  </span>
                  {c.length > 22 ? `${c.substring(0, 20)}...` : c}
                </span>
              ))}{' '}
            </div>
          </div>
        </div>
      </div>

      <div className="left-sidebar-footer">
        <button type="button" className="footer-btn" onClick={handleNewProject}>
          <span className="material-symbols-rounded">create_new_folder</span>
          New Project Workspace
        </button>
      </div>
    </aside>
  );
}
