import * as sqlite from 'sqlite-electron';
import { app } from 'electron';
import path from 'path';

export async function initDb() {
  const dbPath = app.isPackaged
    ? path.join(app.getPath('userData'), 'chatterbox.db')
    : path.join(process.cwd(), 'chatterbox.db');

  await sqlite.setdbPath(dbPath);

  // Initialize schema
  await sqlite.executeQuery(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      summary TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sqlite.executeQuery(`
    CREATE TABLE IF NOT EXISTS project_connectors (
      project_id TEXT,
      connector TEXT,
      PRIMARY KEY (project_id, connector),
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  await sqlite.executeQuery(`
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      name TEXT NOT NULL,
      is_hidden INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  await sqlite.executeQuery(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT,
      parent_id TEXT,
      sender TEXT CHECK(sender IN ('user', 'assistant')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(chat_id) REFERENCES chats(id) ON DELETE CASCADE
    );
  `);

  await sqlite.executeQuery(`
    CREATE TABLE IF NOT EXISTS message_siblings (
      id TEXT PRIMARY KEY,
      message_id TEXT,
      content TEXT NOT NULL,
      sibling_index INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(message_id) REFERENCES messages(id) ON DELETE CASCADE
    );
  `);

  // eslint-disable-next-line no-console
  console.log('Database initialized at:', dbPath);
}

export const dbService = {
  // Projects
  getProjects: async () => {
    const projects = (await sqlite.fetchAll('SELECT * FROM projects')) as any[];
    const result = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const p of projects) {
      // eslint-disable-next-line no-await-in-loop
      const connectors = (await sqlite.fetchAll(
        'SELECT connector FROM project_connectors WHERE project_id = ?',
        [p.id],
      )) as any[];
      result.push({
        id: p.id,
        name: p.name,
        summary: p.summary,
        connectors: connectors.map((c: any) => c.connector),
      });
    }
    return result;
  },

  saveProject: async (project: any) => {
    const { id, name, summary, connectors } = project;

    await sqlite.executeQuery(
      'INSERT OR REPLACE INTO projects (id, name, summary) VALUES (?, ?, ?)',
      [id, name, summary],
    );
    await sqlite.executeQuery(
      'DELETE FROM project_connectors WHERE project_id = ?',
      [id],
    );
    if (connectors) {
      // eslint-disable-next-line no-restricted-syntax
      for (const c of connectors) {
        // eslint-disable-next-line no-await-in-loop
        await sqlite.executeQuery(
          'INSERT INTO project_connectors (project_id, connector) VALUES (?, ?)',
          [id, c],
        );
      }
    }
    return project;
  },

  deleteProject: async (id: string) => {
    return sqlite.executeQuery('DELETE FROM projects WHERE id = ?', [id]);
  },

  // Chats
  getChats: async (projectId?: string) => {
    let chats;
    if (projectId) {
      chats = (await sqlite.fetchAll(
        'SELECT * FROM chats WHERE project_id = ? ORDER BY created_at DESC',
        [projectId],
      )) as any[];
    } else {
      chats = (await sqlite.fetchAll(
        'SELECT * FROM chats ORDER BY created_at DESC',
      )) as any[];
    }
    return chats.map((c) => ({
      id: c.id,
      projectId: c.project_id,
      name: c.name,
      isHidden: !!c.is_hidden,
    }));
  },

  saveChat: async (chat: any) => {
    const { id, projectId, name, isHidden } = chat;
    return sqlite.executeQuery(
      'INSERT OR REPLACE INTO chats (id, project_id, name, is_hidden) VALUES (?, ?, ?, ?)',
      [id, projectId, name, isHidden ? 1 : 0],
    );
  },

  deleteChat: async (id: string) => {
    return sqlite.executeQuery('DELETE FROM chats WHERE id = ?', [id]);
  },

  // Messages
  getMessages: async (chatId: string) => {
    const messages = (await sqlite.fetchAll(
      'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
      [chatId],
    )) as any[];

    const result = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const m of messages) {
      // eslint-disable-next-line no-await-in-loop
      const siblings = (await sqlite.fetchAll(
        'SELECT * FROM message_siblings WHERE message_id = ? ORDER BY sibling_index ASC',
        [m.id],
      )) as any[];
      result.push({
        id: m.id,
        sender: m.sender,
        chatId: m.chat_id,
        parentId: m.parent_id,
        siblings: siblings.map((s) => s.content),
        activeSiblingIndex: siblings.length - 1,
        content:
          siblings.length > 0 ? siblings[siblings.length - 1].content : '',
      });
    }
    return result;
  },

  saveMessage: async (message: any, siblingContent: string) => {
    const { id, chatId, parentId, sender } = message;

    await sqlite.executeQuery(
      'INSERT OR REPLACE INTO messages (id, chat_id, parent_id, sender) VALUES (?, ?, ?, ?)',
      [id, chatId, parentId, sender],
    );

    // Check if sibling already exists
    const existingSiblingsCount = (await sqlite.fetchOne(
      'SELECT COUNT(*) as count FROM message_siblings WHERE message_id = ?',
      [id],
    )) as any;

    await sqlite.executeQuery(
      'INSERT INTO message_siblings (id, message_id, content, sibling_index) VALUES (?, ?, ?, ?)',
      [
        `${id}-s${existingSiblingsCount.count}`,
        id,
        siblingContent,
        existingSiblingsCount.count,
      ],
    );

    return message;
  },

  addMessageSibling: async (messageId: string, content: string) => {
    const existingSiblingsCount = (await sqlite.fetchOne(
      'SELECT COUNT(*) as count FROM message_siblings WHERE message_id = ?',
      [messageId],
    )) as any;

    return sqlite.executeQuery(
      'INSERT INTO message_siblings (id, message_id, content, sibling_index) VALUES (?, ?, ?, ?)',
      [
        `${messageId}-s${existingSiblingsCount.count}`,
        messageId,
        content,
        existingSiblingsCount.count,
      ],
    );
  },
};
