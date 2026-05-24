/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable react/button-has-type */
import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Interfaces for our state model
interface Project {
  id: string;
  name: string;
  summary: string;
  connectors: string[];
}

interface Chat {
  id: string;
  name: string;
  parentId: string | null;
  hidden: boolean;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  attachments?: string[];
  siblings?: string[]; // Alternative assistant responses
  activeSiblingIndex?: number;
}

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Chatterbox Spec & Dev',
    summary:
      'Building a rich-featured local electron client utilizing RAG and OpenRouter APIs.',
    connectors: ['/home/user/Coding/chatterbox', 'github.com/chatterbox/app'],
  },
  {
    id: 'p2',
    name: 'Marketing Engine RAG',
    summary:
      'Managing copywriting workflows and querying marketing documents folder.',
    connectors: ['/home/user/Documents/MarketingPlans'],
  },
];

const INITIAL_CHATS: Chat[] = [
  {
    id: 'c1',
    name: 'OpenRouter & API Client Setup',
    parentId: null,
    hidden: false,
  },
  {
    id: 'c1-fork-1',
    name: '↳ Fork: Local Ollama Fallback',
    parentId: 'c1',
    hidden: false,
  },
  {
    id: 'c1-fork-2',
    name: '↳ Fork: Anthropic Direct Connectors',
    parentId: 'c1',
    hidden: false,
  },
  {
    id: 'c2',
    name: 'RAG Pipeline Architecture',
    parentId: null,
    hidden: false,
  },
  {
    id: 'c2-fork-1',
    name: '↳ Fork: HNSWLib Indexing',
    parentId: 'c2',
    hidden: false,
  },
  {
    id: 'c3',
    name: 'Glassmorphism Theme Details',
    parentId: null,
    hidden: false,
  },
];

const INITIAL_MESSAGES: Record<string, Message[]> = {
  c1: [
    {
      id: 'm1',
      sender: 'user',
      content:
        'I want to integrate OpenRouter with connection retry logic. How should we set up the provider client?',
    },
    {
      id: 'm2',
      sender: 'assistant',
      content:
        'Here is the recommended connection configuration for OpenRouter. We can use a custom Axios instance or the official SDK with backoff retries.',
      siblings: [
        'Here is the recommended connection configuration for OpenRouter. We can use a custom Axios instance or the official SDK with backoff retries.',
        'Alternative response: We could also implement a local proxy server in the Electron main process to handle all API keys securely and handle rates/retries before sending data to the renderer.',
        'Third variant: A clean way to handle this is exposing a main-process IPC route like "openrouter:send-request" that handles the fetch call with retries and streams the text back via webContents.',
      ],
      activeSiblingIndex: 0,
    },
  ],
  'c1-fork-1': [
    {
      id: 'm1_f1',
      sender: 'user',
      content:
        'How should we configure Ollama fallback if OpenRouter is offline?',
    },
    {
      id: 'm2_f1',
      sender: 'assistant',
      content:
        'We can build a ProviderManager class that automatically catches connection errors. If an error is caught and a local Ollama service is detected running on http://127.0.0.1:11434, it falls back seamlessly.',
      siblings: [
        'We can build a ProviderManager class that automatically catches connection errors. If an error is caught and a local Ollama service is detected running on http://127.0.0.1:11434, it falls back seamlessly.',
      ],
      activeSiblingIndex: 0,
    },
  ],
  c2: [
    {
      id: 'm3',
      sender: 'user',
      content:
        'What embeddings model should we use for local document indexing?',
    },
    {
      id: 'm4',
      sender: 'assistant',
      content:
        'For fully local execution, a light sentence-transformers model like all-MiniLM-L6-v2 via transformers.js is standard and runs smoothly inside Electron helper processes. If internet is available, we can also use Cohere or OpenAI embeddings.',
      siblings: [
        'For fully local execution, a light sentence-transformers model like all-MiniLM-L6-v2 via transformers.js is standard and runs smoothly inside Electron helper processes. If internet is available, we can also use Cohere or OpenAI embeddings.',
      ],
      activeSiblingIndex: 0,
    },
  ],
};

export default function App() {
  // Navigation Sidebars toggles
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

  // Core Data State
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string>('p1');
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [activeChatId, setActiveChatId] = useState<string>('c1');
  const [messages, setMessages] =
    useState<Record<string, Message[]>>(INITIAL_MESSAGES);

  // Settings & Toggles
  const [provider, setProvider] = useState<string>('OpenRouter');
  const [model, setModel] = useState<string>('anthropic/claude-3.5-sonnet');
  const [tools, setTools] = useState({
    webSearch: true,
    codeInterpreter: false,
    vectorRag: true,
  });

  // Sampler settings state
  const [samplerSettings, setSamplerSettings] = useState({
    temperature: 0.7,
    maxTokens: 4096,
    topP: 0.9,
    presencePenalty: 0.0,
  });
  const [systemPrompt, setSystemPrompt] = useState(
    'You are Chatterbox, a highly capable desktop AI assistant. Keep responses detailed, clean, and helpful.',
  );

  // Batch actions / Selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(
    new Set(),
  );

  // Input states
  const [inputValue, setInputValue] = useState('');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Providers list
  const providers = [
    'OpenRouter',
    'Anthropic Direct',
    'OpenAI Direct',
    'Ollama Local',
  ];
  const modelsMap: Record<string, string[]> = {
    OpenRouter: [
      'anthropic/claude-3.5-sonnet',
      'google/gemini-2.5-pro',
      'meta/llama-3.1-405b',
      'deepseek/deepseek-chat',
    ],
    'Anthropic Direct': [
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-5-haiku-20241022',
    ],
    'OpenAI Direct': ['gpt-4o', 'gpt-4-turbo', 'o1-preview'],
    'Ollama Local': [
      'llama3:8b',
      'mistral:latest',
      'qwen2.5-coder:7b',
      'phi3:latest',
    ],
  };

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChatId]);

  // Handle textarea autosize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputValue]);

  // Handle Project Change
  const activeProject =
    projects.find((p) => p.id === activeProjectId) || projects[0];

  // Send mock message
  const handleSendMessage = () => {
    if (!inputValue.trim() && attachedImages.length === 0) return;

    const userMsgId = `m-user-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      sender: 'user',
      content: inputValue,
      attachments: attachedImages.length > 0 ? [...attachedImages] : undefined,
    };

    // Add user message to active chat
    const currentChatMsgs = messages[activeChatId] || [];
    const updatedMsgs = [...currentChatMsgs, userMsg];

    setMessages({
      ...messages,
      [activeChatId]: updatedMsgs,
    });
    setInputValue('');
    setAttachedImages([]);

    // Trigger mock assistant response
    setTimeout(() => {
      const assistantMsgId = `m-assistant-${Date.now()}`;
      const responses = [
        `I received your query. In your project context "${activeProject.name}", we are querying documents under: ${activeProject.connectors.join(', ')}.\n\nHere is a mock response matching model ${model} with sampler settings: Temp=${samplerSettings.temperature}, TopP=${samplerSettings.topP}.`,
        `Alternative thought: We can index file attachments using RAG parser. Let me know if you would like me to extract text from your attached images!`,
        `This is response option 3. You can use the hover arrows to cycles through these different options to see how the branch/sibling system works!`,
      ];

      const assistantMsg: Message = {
        id: assistantMsgId,
        sender: 'assistant',
        content: responses[0],
        siblings: responses,
        activeSiblingIndex: 0,
      };

      setMessages((prev) => ({
        ...prev,
        [activeChatId]: [...(prev[activeChatId] || []), assistantMsg],
      }));
    }, 1000);
  };

  // Add mock image attachment
  const handleAttachImage = () => {
    // Adding a mock visual thumbnail
    setAttachedImages([
      ...attachedImages,
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=60',
    ]);
  };

  // Handle sibling response switcher
  const handleSiblingSwitch = (msgId: string, direction: 'prev' | 'next') => {
    const chatMsgs = messages[activeChatId] || [];
    const updated = chatMsgs.map((msg) => {
      if (msg.id === msgId && msg.siblings) {
        let nextIndex = msg.activeSiblingIndex || 0;
        if (direction === 'prev') {
          nextIndex =
            (nextIndex - 1 + msg.siblings.length) % msg.siblings.length;
        } else {
          nextIndex = (nextIndex + 1) % msg.siblings.length;
        }
        return {
          ...msg,
          activeSiblingIndex: nextIndex,
          content: msg.siblings[nextIndex],
        };
      }
      return msg;
    });

    setMessages({
      ...messages,
      [activeChatId]: updated,
    });
  };

  // Redo / Retry request
  const handleRetryMessage = (msgId: string) => {
    // Generate an additional sibling option for demonstrating branch saving
    const chatMsgs = messages[activeChatId] || [];
    const updated = chatMsgs.map((msg) => {
      if (msg.id === msgId) {
        const siblings = msg.siblings || [msg.content];
        const newSibling = `Regenerated output (${siblings.length + 1}) using current temperature ${samplerSettings.temperature}:\n\nHere is a newly generated response showing that we preserved the previous responses in the sibling list.`;
        const updatedSiblings = [...siblings, newSibling];
        return {
          ...msg,
          siblings: updatedSiblings,
          activeSiblingIndex: updatedSiblings.length - 1,
          content: newSibling,
        };
      }
      return msg;
    });

    setMessages({
      ...messages,
      [activeChatId]: updated,
    });
  };

  // Copy text to clipboard
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  // Handle chat selection
  const handleSelectMessage = (msgId: string) => {
    const updatedSelection = new Set(selectedMessageIds);
    if (updatedSelection.has(msgId)) {
      updatedSelection.delete(msgId);
    } else {
      updatedSelection.add(msgId);
    }
    setSelectedMessageIds(updatedSelection);
  };

  // Delete selection
  const handleDeleteSelected = () => {
    const currentMsgs = messages[activeChatId] || [];
    const updated = currentMsgs.filter(
      (msg) => !selectedMessageIds.has(msg.id),
    );
    setMessages({
      ...messages,
      [activeChatId]: updated,
    });
    setSelectedMessageIds(new Set());
    setSelectionMode(false);
  };

  // Fork selected messages into a new thread
  const handleForkSelection = () => {
    if (selectedMessageIds.size === 0) {
      alert('Please select at least one message to fork.');
      return;
    }

    const forkId = `c-fork-${Date.now()}`;
    const forkName = `↳ Fork: Branch ${chats.length - 2}`;

    // Add new chat to tree under activeChatId
    const newChat: Chat = {
      id: forkId,
      name: forkName,
      parentId: activeChatId,
      hidden: false,
    };

    // Filter messages to copy to the new fork
    const currentMsgs = messages[activeChatId] || [];
    const forkedMsgs = currentMsgs
      .filter((msg) => selectedMessageIds.has(msg.id))
      .map((msg) => ({ ...msg, id: `fork-${msg.id}-${Date.now()}` }));

    setChats([...chats, newChat]);
    setMessages({
      ...messages,
      [forkId]: forkedMsgs,
    });
    setActiveChatId(forkId);
    setSelectedMessageIds(new Set());
    setSelectionMode(false);
    alert(`Forked selected messages into a new chat thread!`);
  };

  // Export entire chat
  const handleExportWholeChat = () => {
    const currentMsgs = messages[activeChatId] || [];
    const exportString = currentMsgs
      .map((msg) => `[${msg.sender.toUpperCase()}]\n${msg.content}\n`)
      .join('\n---\n\n');

    navigator.clipboard.writeText(exportString);
    alert('Copied entire chat script to clipboard!');
  };

  // Save chat to file mock
  const handleSaveToFile = () => {
    const currentMsgs = messages[activeChatId] || [];
    const blob = new Blob([JSON.stringify(currentMsgs, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatterbox-${activeChatId}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Toggle tool
  const toggleTool = (
    toolName: 'webSearch' | 'codeInterpreter' | 'vectorRag',
  ) => {
    setTools({
      ...tools,
      [toolName]: !tools[toolName],
    });
  };

  // Delete chat node from sidebar list
  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setChats(chats.filter((c) => c.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId('c1');
    }
  };

  // Hide chat node from sidebar list
  const handleHideChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setChats(chats.map((c) => (c.id === chatId ? { ...c, hidden: true } : c)));
  };

  // New Chat action
  const handleNewChat = () => {
    const newId = `c-${Date.now()}`;
    const newChat: Chat = {
      id: newId,
      name: `New Chat Thread ${chats.filter((c) => !c.parentId).length + 1}`,
      parentId: null,
      hidden: false,
    };
    setChats([...chats, newChat]);
    setMessages({
      ...messages,
      [newId]: [
        {
          id: `m-init-${Date.now()}`,
          sender: 'assistant',
          content:
            'Hello! I am Chatterbox. Start typing below to begin a new conversation. Open sampler controls on the right to edit settings.',
        },
      ],
    });
    setActiveChatId(newId);
  };

  // New Project action
  const handleNewProject = () => {
    const newId = `p-${Date.now()}`;
    const name = prompt('Enter project name:');
    if (!name) return;
    const connectorsInput = prompt(
      'Enter data directory path (comma separated):',
    );
    const connectors = connectorsInput
      ? connectorsInput.split(',').map((s) => s.trim())
      : [];

    const newProject: Project = {
      id: newId,
      name,
      summary: `A new workspace focusing on local data ingestion.`,
      connectors,
    };
    setProjects([...projects, newProject]);
    setActiveProjectId(newId);
  };

  // Render tree structure in left sidebar
  const renderChatTree = () => {
    const visibleChats = chats.filter((c) => !c.hidden);
    // Find top-level chats
    const rootChats = visibleChats.filter((c) => c.parentId === null);

    return rootChats.map((rootChat) => {
      const children = visibleChats.filter((c) => c.parentId === rootChat.id);
      return (
        <div key={rootChat.id} className="tree-node-container">
          <div
            className={`tree-node ${activeChatId === rootChat.id ? 'active' : ''}`}
            onClick={() => setActiveChatId(rootChat.id)}
          >
            <span className="node-title">💬 {rootChat.name}</span>
            <div className="node-actions">
              <button
                className="action-btn-mini"
                title="Hide Chat"
                onClick={(e) => handleHideChat(e, rootChat.id)}
              >
                👁️
              </button>
              <button
                className="action-btn-mini danger"
                title="Delete Chat"
                onClick={(e) => handleDeleteChat(e, rootChat.id)}
              >
                🗑️
              </button>
            </div>
          </div>
          {children.map((childChat) => (
            <div
              key={childChat.id}
              className={`tree-node ${activeChatId === childChat.id ? 'active' : ''}`}
              onClick={() => setActiveChatId(childChat.id)}
              style={{ paddingLeft: '16px' }}
            >
              <div className="tree-indent" />
              <span
                className="node-title"
                style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}
              >
                {childChat.name}
              </span>
              <div className="node-actions">
                <button
                  className="action-btn-mini"
                  title="Hide"
                  onClick={(e) => handleHideChat(e, childChat.id)}
                >
                  👁️
                </button>
                <button
                  className="action-btn-mini danger"
                  title="Delete"
                  onClick={(e) => handleDeleteChat(e, childChat.id)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    });
  };

  return (
    <div className="app-container">
      {/* LEFT SIDEBAR */}
      <aside
        className={`left-sidebar ${leftSidebarCollapsed ? 'collapsed' : ''}`}
      >
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
                  📁 {proj.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="sidebar-scroll">
          {/* Chats Section */}
          <div className="list-section">
            <div className="list-section-title">
              <span>Conversations</span>
              <button
                className="add-btn-small"
                onClick={handleNewChat}
                title="New Chat"
              >
                + New
              </button>
            </div>
            {renderChatTree()}
          </div>

          {/* Project Details Panel */}
          <div
            className="list-section"
            style={{ marginTop: 'auto', padding: '8px' }}
          >
            <div className="list-section-title">Project Context</div>
            <div className="project-card">
              <div className="project-card-title">{activeProject.name}</div>
              <div className="project-card-summary">
                {activeProject.summary}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px',
                  marginTop: '6px',
                }}
              >
                {activeProject.connectors.map((c, i) => (
                  <span key={i} className="connector-pill">
                    🔌 {c.length > 22 ? `${c.substring(0, 20)}...` : c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="left-sidebar-footer">
          <button className="footer-btn" onClick={handleNewProject}>
            📂 New Project Workspace
          </button>
        </div>
      </aside>

      {/* MAIN CHAT WINDOW */}
      <main className="main-chat-window">
        <header className="main-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="icon-btn"
              onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
              title={
                leftSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'
              }
            >
              {leftSidebarCollapsed ? '➡️' : '⬅️'}
            </button>
            <div className="header-title-section">
              <span className="header-chat-name">
                {chats
                  .find((c) => c.id === activeChatId)
                  ?.name.replace('↳ Fork: ', '') || 'No Active Chat'}
              </span>
              <span className="header-chat-meta">
                <span className="status-dot" />
                Active context: {activeProject.name}
              </span>
            </div>
          </div>

          <div className="header-controls">
            {/* Provider Selection */}
            <div className="select-input-container">
              <label>Provider</label>
              <select
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
            </div>

            {/* Model Selection */}
            <div className="select-input-container">
              <label>Model</label>
              <select
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
            </div>

            <button
              className="icon-btn"
              onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
              title="Sampler & Settings"
            >
              ⚙️
            </button>
          </div>
        </header>

        {/* Tools Toggle Strip */}
        <section className="tools-strip">
          <span className="tools-strip-title">Active Tools:</span>
          <div
            className={`tool-badge ${tools.webSearch ? 'enabled' : ''}`}
            onClick={() => toggleTool('webSearch')}
          >
            <div className="tool-dot" />
            <span>Web Search</span>
          </div>
          <div
            className={`tool-badge ${tools.codeInterpreter ? 'enabled' : ''}`}
            onClick={() => toggleTool('codeInterpreter')}
          >
            <div className="tool-dot" />
            <span>Code Interpreter</span>
          </div>
          <div
            className={`tool-badge ${tools.vectorRag ? 'enabled' : ''}`}
            onClick={() => toggleTool('vectorRag')}
          >
            <div className="tool-dot" />
            <span>RAG Document Query</span>
          </div>
        </section>

        {/* Messages Scrolling Container */}
        <div className="messages-container">
          {(messages[activeChatId] || []).map((msg) => (
            <div
              key={msg.id}
              className={`message-card ${msg.sender} ${
                selectedMessageIds.has(msg.id) ? 'selected' : ''
              }`}
            >
              {selectionMode && (
                <input
                  type="checkbox"
                  className="message-select-checkbox"
                  checked={selectedMessageIds.has(msg.id)}
                  onChange={() => handleSelectMessage(msg.id)}
                />
              )}

              <div className={`message-avatar ${msg.sender}`}>
                {msg.sender === 'user' ? 'U' : '🤖'}
              </div>

              <div className="message-content-wrapper">
                <div className="message-sender">
                  {msg.sender === 'user' ? 'You' : model}
                </div>
                <div className="message-text">{msg.content}</div>

                {msg.attachments &&
                  msg.attachments.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="Attachment"
                      className="message-attachment"
                    />
                  ))}
              </div>

              {/* Message actions on Hover */}
              <div className="message-hover-actions">
                {/* Sibling message arrows switcher */}
                {msg.siblings && msg.siblings.length > 1 && (
                  <div className="sibling-switcher">
                    <button
                      className="sibling-btn"
                      onClick={() => handleSiblingSwitch(msg.id, 'prev')}
                      title="Previous sibling version"
                    >
                      ◀
                    </button>
                    <span>
                      {(msg.activeSiblingIndex || 0) + 1}/{msg.siblings.length}
                    </span>
                    <button
                      className="sibling-btn"
                      onClick={() => handleSiblingSwitch(msg.id, 'next')}
                      title="Next sibling version"
                    >
                      ▶
                    </button>
                  </div>
                )}

                {/* Regenerate/Retry button */}
                {msg.sender === 'assistant' && (
                  <button
                    className="msg-action-btn"
                    title="Retry / Get New Variation"
                    onClick={() => handleRetryMessage(msg.id)}
                  >
                    🔄 Redo
                  </button>
                )}

                {/* Copy text button */}
                <button
                  className="msg-action-btn"
                  title="Copy Text"
                  onClick={() => handleCopyText(msg.content)}
                >
                  📋 Copy
                </button>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar Panel */}
        <footer className="input-panel">
          <div className="input-box-wrapper">
            {/* Thumbnail preview of uploads */}
            {attachedImages.length > 0 && (
              <div className="attachments-preview-strip">
                {attachedImages.map((img, i) => (
                  <div
                    key={i}
                    className="preview-thumb"
                    style={{ backgroundImage: `url(${img})` }}
                  >
                    <button
                      className="remove-thumb-btn"
                      onClick={() =>
                        setAttachedImages(
                          attachedImages.filter((_, idx) => idx !== i),
                        )
                      }
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="input-row">
              <textarea
                ref={textareaRef}
                className="chat-textarea"
                placeholder="Type your message, query files, or upload images..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
            </div>

            <div className="input-actions-bar">
              <div className="actions-left">
                <button
                  className="icon-btn"
                  onClick={handleAttachImage}
                  title="Attach Image"
                >
                  🖼️
                </button>
                <span
                  style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}
                >
                  Press Enter to send, Shift+Enter for newline
                </span>
              </div>

              <button className="submit-send-btn" onClick={handleSendMessage}>
                Send ⚡
              </button>
            </div>
          </div>
        </footer>
      </main>

      {/* RIGHT SIDEBAR */}
      <aside
        className={`right-sidebar ${rightSidebarCollapsed ? 'collapsed' : ''}`}
      >
        <div
          className="section-header"
          style={{ height: '64px', display: 'flex', alignItems: 'center' }}
        >
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>
            Configuration Panel
          </span>
        </div>

        <div className="right-sidebar-scroll">
          {/* System Prompt section */}
          <div className="settings-group">
            <span className="settings-group-title">System Prompt</span>
            <textarea
              className="system-prompt-textarea"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="System prompt instructions..."
            />
          </div>

          {/* Sampler Settings */}
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
                <span className="sampler-value">
                  {samplerSettings.maxTokens}
                </span>
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

          {/* Quick Actions Panel */}
          <div className="settings-group">
            <span className="settings-group-title">
              Batch & Utility Actions
            </span>
            <div className="btn-grid">
              <button
                className={`action-btn-block ${selectionMode ? 'active' : ''}`}
                onClick={() => {
                  setSelectionMode(!selectionMode);
                  setSelectedMessageIds(new Set());
                }}
              >
                <span className="action-icon">☑️</span>
                {selectionMode
                  ? 'Exit Selection Mode'
                  : 'Enable Message Selection'}
              </button>

              {selectionMode && (
                <>
                  <button
                    className="action-btn-block"
                    onClick={handleForkSelection}
                    disabled={selectedMessageIds.size === 0}
                    style={{ opacity: selectedMessageIds.size === 0 ? 0.5 : 1 }}
                  >
                    <span className="action-icon">🔱</span>
                    Fork Selected to New Chat
                  </button>

                  <button
                    className="action-btn-block"
                    onClick={handleDeleteSelected}
                    disabled={selectedMessageIds.size === 0}
                    style={{
                      opacity: selectedMessageIds.size === 0 ? 0.5 : 1,
                      color: 'var(--color-danger)',
                    }}
                  >
                    <span className="action-icon">🗑️</span>
                    Delete Selected Messages
                  </button>
                </>
              )}

              <button
                className="action-btn-block"
                onClick={handleExportWholeChat}
              >
                <span className="action-icon">📝</span>
                Copy Whole Chat to Clipboard
              </button>

              <button className="action-btn-block" onClick={handleSaveToFile}>
                <span className="action-icon">💾</span>
                Save Chat to File
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
