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
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string>('p1');
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [activeChatId, setActiveChatId] = useState<string>('c1');
  const [messages, setMessages] =
    useState<Record<string, Message[]>>(INITIAL_MESSAGES);

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

  const handleRetryMessage = (msgId: string) => {
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

    setMessages({ ...messages, [activeChatId]: updated });
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
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

  const handleDeleteSelected = () => {
    const currentMsgs = messages[activeChatId] || [];
    const updated = currentMsgs.filter(
      (msg) => !selectedMessageIds.has(msg.id),
    );
    setMessages({ ...messages, [activeChatId]: updated });
    setSelectedMessageIds(new Set());
    setSelectionMode(false);
  };

  const handleForkSelection = () => {
    if (selectedMessageIds.size === 0) return;
    const forkId = `c-fork-${Date.now()}`;
    const forkName = `↳ Fork: Branch ${chats.length - 2}`;
    const newChat: Chat = {
      id: forkId,
      name: forkName,
      parentId: activeChatId,
      hidden: false,
    };

    const currentMsgs = messages[activeChatId] || [];
    const forkedMsgs = currentMsgs
      .filter((msg) => selectedMessageIds.has(msg.id))
      .map((msg) => ({ ...msg, id: `fork-${msg.id}-${Date.now()}` }));

    setChats([...chats, newChat]);
    setMessages({ ...messages, [forkId]: forkedMsgs });
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

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setChats(chats.filter((c) => c.id !== chatId));
    if (activeChatId === chatId) setActiveChatId('c1');
  };

  const handleHideChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setChats(chats.map((c) => (c.id === chatId ? { ...c, hidden: true } : c)));
  };

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
            'Hello! I am Chatterbox. Start typing below to begin a new conversation.',
        },
      ],
    });
    setActiveChatId(newId);
  };

  const handleNewProject = () => {
    const name = prompt('Enter project name:');
    if (!name) return;
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
          activeProjectName={activeProject.name}
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
