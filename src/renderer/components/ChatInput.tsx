/* eslint-disable react/no-array-index-key */
import React, { useRef, useEffect } from 'react';

interface ChatInputProps {
  inputValue: string;
  setInputValue: (val: string) => void;
  attachedImages: string[];
  setAttachedImages: (images: string[]) => void;
  handleSendMessage: () => void;
  handleAttachImage: () => void;
}

export default function ChatInput({
  inputValue,
  setInputValue,
  attachedImages,
  setAttachedImages,
  handleSendMessage,
  handleAttachImage,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle textarea autosize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputValue]);

  return (
    <footer className="input-panel">
      <div className="input-box-wrapper">
        {/* Thumbnail preview of uploads */}
        {attachedImages.length > 0 && (
          <div className="attachments-preview-strip">
            {attachedImages.map((img, i) => (
              <div
                key={`attach-${img}-${i}`}
                className="preview-thumb"
                style={{ backgroundImage: `url(${img})` }}
              >
                <button
                  type="button"
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
              type="button"
              className="icon-btn"
              onClick={handleAttachImage}
              title="Attach Image"
            >
              <span className="material-symbols-rounded">image</span>
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>
              Press Enter to send, Shift+Enter for newline
            </span>
          </div>

          <button
            type="button"
            className="submit-send-btn"
            onClick={handleSendMessage}
          >
            Send
            <span
              className="material-symbols-rounded"
              style={{ fontSize: '20px', marginLeft: '4px' }}
            >
              send
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
}
