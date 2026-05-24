import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { Project, Chat, Message, SamplerSettings, ToolsConfig } from './types';
import {
  INITIAL_PROJECTS,
  INITIAL_CHATS,
  INITIAL_MESSAGES,
  PROVIDERS,
  MODELS_MAP,
} from './constants';

import SidebarLeft from './components/SidebarLeft';
import SidebarRight from './components/SidebarRight';
import Header from './components/Header';
import ToolsStrip from './components/ToolsStrip';
import MessageItem from './components/MessageItem';
import ChatInput from './components/ChatInput';

export default function App() {
  // Navigation Sidebars toggles
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

  // Core Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>('');
  const [messages, setMessages] = useState<Record<string, Message[]>>({});

  // Settings & Toggles
  const [provider, setProvider] = useState<string>('OpenRouter');
  const [model, setModel] = useState<string>('anthropic/claude-3.5-sonnet');
  const [tools, setTools] = useState<ToolsConfig>({
    webSearch: true,
    codeInterpreter: false,
    vectorRag: true,
  });

  // Sampler settings state
  const [samplerSettings, setSamplerSettings] = useState<SamplerSettings>({
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChatId]);

  // Load data from DB on mount
  useEffect(() => {
    const loadInitialData = async () => {
      let dbProjects = await window.electron.db.getProjects();
      if (dbProjects.length === 0) {
        // First run: seed with constants
        // eslint-disable-next-line no-restricted-syntax
        for (const p of INITIAL_PROJECTS) {
          // eslint-disable-next-line no-await-in-loop
          await window.electron.db.saveProject(p);
        }
        dbProjects = await window.electron.db.getProjects();
      }
      setProjects(dbProjects);
      if (dbProjects.length > 0) setActiveProjectId(dbProjects[0].id);

      let dbChats = await window.electron.db.getChats();
      if (dbChats.length === 0) {
        // First run: seed with constants
        // eslint-disable-next-line no-restricted-syntax
        for (const c of INITIAL_CHATS) {
          const chatToSave = {
            id: c.id,
            projectId: dbProjects[0]?.id || 'p1',
            name: c.name,
            isHidden: c.hidden,
          };
          // eslint-disable-next-line no-await-in-loop
          await window.electron.db.saveChat(chatToSave);

          // Seed messages for initial chats
          const initialMsgs = INITIAL_MESSAGES[c.id] || [];
          // eslint-disable-next-line no-restricted-syntax
          for (const m of initialMsgs) {
            // eslint-disable-next-line no-await-in-loop
            await window.electron.db.saveMessage(
              { ...m, chatId: c.id, parentId: null },
              m.content,
            );
            // If there are more siblings, add them too
            if (m.siblings && m.siblings.length > 1) {
              // eslint-disable-next-line no-plusplus
              for (let i = 1; i < m.siblings.length; i++) {
                // eslint-disable-next-line no-await-in-loop
                await window.electron.db.addMessageSibling(m.id, m.siblings[i]);
              }
            }
          }
        }
        dbChats = await window.electron.db.getChats();
      }
      const normalizedChats = dbChats.map((c: any) => ({
        ...c,
        hidden: c.isHidden,
      }));
      setChats(normalizedChats);
      if (normalizedChats.length > 0) setActiveChatId(normalizedChats[0].id);
    };

    loadInitialData();
  }, []);

  // Load messages whenever activeChatId changes
  useEffect(() => {
    const loadMessages = async () => {
      if (activeChatId) {
        const dbMsgs = await window.electron.db.getMessages(activeChatId);
        setMessages((prev) => ({ ...prev, [activeChatId]: dbMsgs }));
      }
    };
    loadMessages();
  }, [activeChatId]);

  // Handle Project Change
  const activeProject =
    projects.find((p) => p.id === activeProjectId) || projects[0];

  // Send mock message
  const handleSendMessage = async () => {
    if (!inputValue.trim() && attachedImages.length === 0) return;

    const userMsgId = `m-user-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      sender: 'user',
      content: inputValue,
      attachments: attachedImages.length > 0 ? [...attachedImages] : undefined,
    };

    // Persist User Message
    await window.electron.db.saveMessage(
      { ...userMsg, chatId: activeChatId, parentId: null },
      userMsg.content,
    );

    const currentChatMsgs = messages[activeChatId] || [];
    const updatedMsgs = [...currentChatMsgs, userMsg];

    setMessages({
      ...messages,
      [activeChatId]: updatedMsgs,
    });
    setInputValue('');
    setAttachedImages([]);

    // Trigger mock assistant response
    setTimeout(async () => {
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

      // Persist Assistant Message and Siblings
      await window.electron.db.saveMessage(
        { ...assistantMsg, chatId: activeChatId, parentId: userMsgId },
        responses[0],
      );
      // Add other mock siblings to DB
      // eslint-disable-next-line no-plusplus
      for (let i = 1; i < responses.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        await window.electron.db.addMessageSibling(
          assistantMsgId,
          responses[i],
        );
      }

      setMessages((prev) => ({
        ...prev,
        [activeChatId]: [...(prev[activeChatId] || []), assistantMsg],
      }));
    }, 1000);
  };

  const handleAttachImage = () => {
    setAttachedImages([
      ...attachedImages,
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=60',
    ]);
  };

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

    setMessages({ ...messages, [activeChatId]: updated });
  };

  const handleRetryMessage = async (msgId: string) => {
    const chatMsgs = messages[activeChatId] || [];
    const newSibling = `Regenerated output using current temperature ${samplerSettings.temperature}:\n\nHere is a newly generated response showing that we preserved the previous responses in the sibling list.`;

    await window.electron.db.addMessageSibling(msgId, newSibling);

    const updated = chatMsgs.map((msg) => {
      if (msg.id === msgId) {
        const siblings = msg.siblings || [msg.content];
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

    setMessages({ ...messages, [activeChatId]: updated });
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    // eslint-disable-next-line no-alert
    alert('Copied to clipboard!');
  };

  const handleSelectMessage = (msgId: string) => {
    const updatedSelection = new Set(selectedMessageIds);
    if (updatedSelection.has(msgId)) {
      updatedSelection.delete(msgId);
    } else {
      updatedSelection.add(msgId);
    }
    setSelectedMessageIds(updatedSelection);
  };

  const handleDeleteSelected = async () => {
    const currentMsgs = messages[activeChatId] || [];
    // Note: In a real app we might want a batch delete IPC call
    // Individual message delete isn't in dbService yet.
    // Let's just update the local state for now, but in Phase 7 we'll need this.
    const updated = currentMsgs.filter(
      (msg) => !selectedMessageIds.has(msg.id),
    );
    setMessages({ ...messages, [activeChatId]: updated });
    setSelectedMessageIds(new Set());
    setSelectionMode(false);
  };

  const handleForkSelection = async () => {
    if (selectedMessageIds.size === 0) return;
    const forkId = `c-fork-${Date.now()}`;
    const forkName = `↳ Fork: Branch ${chats.length - 1}`;
    const newChat: Chat = {
      id: forkId,
      name: forkName,
      parentId: activeChatId,
      hidden: false,
    };

    await window.electron.db.saveChat({
      id: forkId,
      projectId: activeProjectId,
      name: forkName,
      isHidden: false,
    });

    const currentMsgs = messages[activeChatId] || [];
    const forkedMsgs = currentMsgs.filter((msg) =>
      selectedMessageIds.has(msg.id),
    );

    // eslint-disable-next-line no-restricted-syntax
    for (const msg of forkedMsgs) {
      const newMsgId = `fork-${msg.id}-${Date.now()}`;
      // eslint-disable-next-line no-await-in-loop
      await window.electron.db.saveMessage(
        { ...msg, id: newMsgId, chatId: forkId },
        msg.content,
      );
      // If there were siblings, we should ideally fork them too, but keeping it simple for now.
    }

    // Refresh messages for the new chat
    const dbMsgs = await window.electron.db.getMessages(forkId);

    setChats([...chats, newChat]);
    setMessages({ ...messages, [forkId]: dbMsgs });
    setActiveChatId(forkId);
    setSelectedMessageIds(new Set());
    setSelectionMode(false);
  };

  const handleExportWholeChat = () => {
    const currentMsgs = messages[activeChatId] || [];
    const exportString = currentMsgs
      .map((msg) => `[${msg.sender.toUpperCase()}]\n${msg.content}\n`)
      .join('\n---\n\n');
    navigator.clipboard.writeText(exportString);
    // eslint-disable-next-line no-alert
    alert('Copied entire chat script to clipboard!');
  };

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

  const toggleTool = (toolName: keyof ToolsConfig) => {
    setTools({ ...tools, [toolName]: !tools[toolName] });
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    await window.electron.db.deleteChat(chatId);
    setChats(chats.filter((c) => c.id !== chatId));
    if (activeChatId === chatId) {
      const remainingChats = chats.filter((c) => c.id !== chatId);
      if (remainingChats.length > 0) {
        setActiveChatId(remainingChats[0].id);
      } else {
        setActiveChatId('');
      }
    }
  };

  const handleHideChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      const updatedChat = {
        ...chat,
        hidden: true,
        projectId: activeProjectId,
      };
      await window.electron.db.saveChat({
        ...updatedChat,
        isHidden: true,
      });
      setChats(chats.map((c) => (c.id === chatId ? updatedChat : c)));
    }
  };

  const handleNewChat = async () => {
    const newId = `c-${Date.now()}`;
    const newChat: Chat = {
      id: newId,
      name: `New Chat Thread ${chats.filter((c) => !c.parentId).length + 1}`,
      parentId: null,
      hidden: false,
    };

    await window.electron.db.saveChat({
      id: newChat.id,
      projectId: activeProjectId,
      name: newChat.name,
      isHidden: false,
    });

    const initMsg = {
      id: `m-init-${Date.now()}`,
      sender: 'assistant' as const,
      content:
        'Hello! I am Chatterbox. Start typing below to begin a new conversation.',
    };

    await window.electron.db.saveMessage(
      { ...initMsg, chatId: newId, parentId: null },
      initMsg.content,
    );

    setChats([...chats, newChat]);
    setMessages({
      ...messages,
      [newId]: [initMsg],
    });
    setActiveChatId(newId);
  };

  const handleNewProject = async () => {
    // eslint-disable-next-line no-alert
    const name = prompt('Enter project name:');
    if (!name) return;
    // eslint-disable-next-line no-alert
    const connectorsInput = prompt(
      'Enter data directory path (comma separated):',
    );
    const connectors = connectorsInput
      ? connectorsInput.split(',').map((s) => s.trim())
      : [];
    const newProject: Project = {
      id: `p-${Date.now()}`,
      name,
      summary: `A new workspace focusing on local data ingestion.`,
      connectors,
    };

    await window.electron.db.saveProject(newProject);
    setProjects([...projects, newProject]);
    setActiveProjectId(newProject.id);
  };

  return (
    <div className="app-container">
      <SidebarLeft
        collapsed={leftSidebarCollapsed}
        projects={projects}
        activeProjectId={activeProjectId}
        setActiveProjectId={setActiveProjectId}
        chats={chats}
        activeChatId={activeChatId}
        setActiveChatId={setActiveChatId}
        handleNewChat={handleNewChat}
        handleNewProject={handleNewProject}
        handleHideChat={handleHideChat}
        handleDeleteChat={handleDeleteChat}
      />

      <main className="main-chat-window">
        <Header
          leftSidebarCollapsed={leftSidebarCollapsed}
          setLeftSidebarCollapsed={setLeftSidebarCollapsed}
          rightSidebarCollapsed={rightSidebarCollapsed}
          setRightSidebarCollapsed={setRightSidebarCollapsed}
          activeChatName={
            chats
              .find((c) => c.id === activeChatId)
              ?.name.replace('↳ Fork: ', '') || 'No Active Chat'
          }
          activeProjectName={activeProject?.name || 'No Project'}
          provider={provider}
          setProvider={setProvider}
          model={model}
          setModel={setModel}
          providers={PROVIDERS}
          modelsMap={MODELS_MAP}
        />

        <ToolsStrip tools={tools} toggleTool={toggleTool} />

        <div className="messages-container">
          {(messages[activeChatId] || []).map((msg) => (
            <MessageItem
              key={msg.id}
              msg={msg}
              model={model}
              selectionMode={selectionMode}
              isSelected={selectedMessageIds.has(msg.id)}
              handleSelectMessage={handleSelectMessage}
              handleSiblingSwitch={handleSiblingSwitch}
              handleRetryMessage={handleRetryMessage}
              handleCopyText={handleCopyText}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          inputValue={inputValue}
          setInputValue={setInputValue}
          attachedImages={attachedImages}
          setAttachedImages={setAttachedImages}
          handleSendMessage={handleSendMessage}
          handleAttachImage={handleAttachImage}
        />
      </main>

      <SidebarRight
        collapsed={rightSidebarCollapsed}
        systemPrompt={systemPrompt}
        setSystemPrompt={setSystemPrompt}
        samplerSettings={samplerSettings}
        setSamplerSettings={setSamplerSettings}
        selectionMode={selectionMode}
        setSelectionMode={setSelectionMode}
        selectedMessageIds={selectedMessageIds}
        setSelectedMessageIds={setSelectedMessageIds}
        handleForkSelection={handleForkSelection}
        handleDeleteSelected={handleDeleteSelected}
        handleExportWholeChat={handleExportWholeChat}
        handleSaveToFile={handleSaveToFile}
      />
    </div>
  );
}
