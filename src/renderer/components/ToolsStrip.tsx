import React from 'react';
import { ToolsConfig } from '../types';

interface ToolsStripProps {
  tools: ToolsConfig;
  toggleTool: (name: keyof ToolsConfig) => void;
}

export default function ToolsStrip({ tools, toggleTool }: ToolsStripProps) {
  return (
    <section className="tools-strip">
      <span className="tools-strip-title">Active Tools:</span>
      <div
        className={`tool-badge ${tools.webSearch ? 'enabled' : ''}`}
        onClick={() => toggleTool('webSearch')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            toggleTool('webSearch');
          }
        }}
        role="button"
        tabIndex={0}
      >
        <span
          className="material-symbols-rounded"
          style={{ fontSize: '18px', marginRight: '6px' }}
        >
          search
        </span>
        <span>Web Search</span>
      </div>
      <div
        className={`tool-badge ${tools.codeInterpreter ? 'enabled' : ''}`}
        onClick={() => toggleTool('codeInterpreter')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            toggleTool('codeInterpreter');
          }
        }}
        role="button"
        tabIndex={0}
      >
        <span
          className="material-symbols-rounded"
          style={{ fontSize: '18px', marginRight: '6px' }}
        >
          terminal
        </span>
        <span>Code Interpreter</span>
      </div>
      <div
        className={`tool-badge ${tools.vectorRag ? 'enabled' : ''}`}
        onClick={() => toggleTool('vectorRag')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            toggleTool('vectorRag');
          }
        }}
        role="button"
        tabIndex={0}
      >
        <span
          className="material-symbols-rounded"
          style={{ fontSize: '18px', marginRight: '6px' }}
        >
          description
        </span>
        <span>RAG Document Query</span>
      </div>
    </section>
  );
}
