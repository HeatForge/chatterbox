import React from 'react';
import { Message } from '../types';

interface MessageItemProps {
  msg: Message;
  model: string;
  selectionMode: boolean;
  isSelected: boolean;
  handleSelectMessage: (id: string) => void;
  handleSiblingSwitch: (id: string, direction: 'prev' | 'next') => void;
  handleRetryMessage: (id: string) => void;
  handleCopyText: (text: string) => void;
}

export default function MessageItem({
  msg,
  model,
  selectionMode,
  isSelected,
  handleSelectMessage,
  handleSiblingSwitch,
  handleRetryMessage,
  handleCopyText,
}: MessageItemProps) {
  return (
    <div
      key={msg.id}
      className={`message-card ${msg.sender} ${isSelected ? 'selected' : ''}`}
    >
      {selectionMode && (
        <input
          type="checkbox"
          className="message-select-checkbox"
          checked={isSelected}
          onChange={() => handleSelectMessage(msg.id)}
        />
      )}

      <div className={`message-avatar ${msg.sender}`}>
        {msg.sender === 'user' ? (
          <span className="material-symbols-rounded">person</span>
        ) : (
          <span className="material-symbols-rounded">smart_toy</span>
        )}
      </div>

      <div className="message-content-wrapper">
        <div className="message-sender">
          {msg.sender === 'user' ? 'You' : model}
        </div>
        <div className="message-text">{msg.content}</div>

        {msg.attachments &&
          msg.attachments.map((url) => (
            <img
              key={`msg-attach-${msg.id}-${url}`}
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
              type="button"
              className="sibling-btn"
              onClick={() => handleSiblingSwitch(msg.id, 'prev')}
              title="Previous sibling version"
            >
              <span
                className="material-symbols-rounded"
                style={{ fontSize: '18px' }}
              >
                chevron_left
              </span>
            </button>
            <span>
              {(msg.activeSiblingIndex || 0) + 1}/{msg.siblings.length}
            </span>
            <button
              type="button"
              className="sibling-btn"
              onClick={() => handleSiblingSwitch(msg.id, 'next')}
              title="Next sibling version"
            >
              <span
                className="material-symbols-rounded"
                style={{ fontSize: '18px' }}
              >
                chevron_right
              </span>
            </button>
          </div>
        )}
        {/* Regenerate/Retry button */}
        {msg.sender === 'assistant' && (
          <button
            type="button"
            className="msg-action-btn"
            title="Retry / Get New Variation"
            onClick={() => handleRetryMessage(msg.id)}
          >
            <span
              className="material-symbols-rounded"
              style={{ fontSize: '18px', marginRight: '4px' }}
            >
              refresh
            </span>
            Redo
          </button>
        )}
        {/* Copy text button */}
        <button
          type="button"
          className="msg-action-btn"
          title="Copy Text"
          onClick={() => handleCopyText(msg.content)}
        >
          <span
            className="material-symbols-rounded"
            style={{ fontSize: '18px', marginRight: '4px' }}
          >
            content_copy
          </span>
          Copy
        </button>{' '}
      </div>
    </div>
  );
}
