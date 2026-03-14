import * as SQLite from "@journeyapps/wa-sqlite";
import SQLiteESMFactory from "@journeyapps/wa-sqlite/dist/wa-sqlite-async.mjs";

import { AnonymizationResult, Conversation, DataSourceValue, Message, MessageAudio } from "@/models/processed";
import { ChatPseudonyms, ContactPseudonyms } from "@/services/parsing/shared/pseudonyms";
import { DonationErrors, DonationValidationError } from "@services/errors";
import { getAliasConfig } from "@services/parsing/shared/aliasConfig";
import emojiCount from "@services/parsing/shared/emojiCount";

interface WaSQLiteDB {
  api: SQLiteAPI;
  db: number;
}

export default async function handleImessageDBFiles(files: File[]): Promise<AnonymizationResult> {
  if (files.length !== 1) {
    throw DonationValidationError(DonationErrors.NotSingleDBFile);
  }

  // Get data from database
  const db = await createDatabase(files[0]);
  const messages: any[] = await getMessages(db);
  const groupChats: Map<string, string> = await getGroupChats(db);
  await db.api.close(db.db);

  const aliasConfig = getAliasConfig();
  let donorName = "";
  const conversationsMap = new Map<string, Conversation>();
  const contactPseudonyms = new ContactPseudonyms(aliasConfig.contactAlias);
  const chatPseudonyms = new ChatPseudonyms(aliasConfig.donorAlias, aliasConfig.chatAlias, DataSourceValue.IMessage);
  const macEpochTime = new Date("2001-01-01T00:00:00Z").getTime();

  messages.forEach(row => {
    const timestampSinceMachEpoch = Number(row.date) / 1e6; // Convert nanoseconds to milliseconds
    const timestamp = macEpochTime + timestampSinceMachEpoch;

    const sender: string = row.handle_id?.toString() || "Unknown";

    // Set donor ID once found
    if (row.is_from_me && !donorName) {
      donorName = sender;
      chatPseudonyms.setDonorName(donorName);
      contactPseudonyms.setPseudonym(donorName, aliasConfig.donorAlias);
    }
    const conversationId = row.group_id?.toString() || "Unknown";
    const isGroupConversation = groupChats.has(conversationId);
    const isAudioMessage = Number(row.is_audio_message ?? 0) > 0;
    const isMedia = row.mime_type !== ""; // Flag for media presence, yet to be used

    const pseudonym = contactPseudonyms.getPseudonym(sender);

    // Create a new conversation if it doesn't exist
    if (!conversationsMap.has(conversationId)) {
      conversationsMap.set(conversationId, {
        id: conversationId,
        isGroupConversation,
        dataSource: DataSourceValue.IMessage,
        messages: [],
        messagesAudio: [],
        participants: [],
        conversationPseudonym: ""
      });
    }

    // Add message to the conversation
    const conversation = conversationsMap.get(conversationId);
    if (conversation) {
      if (!conversation.participants.includes(pseudonym)) {
        conversation.participants.push(pseudonym);
      }

      if (isAudioMessage) {
        conversation.messagesAudio.push({
          lengthSeconds: 0, // Not calculated for iMessage
          timestamp,
          sender: pseudonym
        } as MessageAudio);
      } else {
        const messageText = row.text as string;
        const emojis = emojiCount(messageText);
        conversation.messages.push({
          id: row.id?.toString(),
          wordCount: messageText.split(/\s+/).length,
          emojiCounts: Object.keys(emojis).length > 0 ? emojis : undefined,
          timestamp,
          sender: pseudonym
        } as Message);
      }
    }
  });

  // Generate conversation pseudonyms based on all participants
  conversationsMap.forEach(conversation => {
    const participants = contactPseudonyms.getOriginalNames(conversation.participants);
    const groupName = groupChats.get(conversation.id!);
    conversation.conversationPseudonym = chatPseudonyms.getPseudonym(groupName ? [groupName] : participants);
  });

  return {
    anonymizedConversations: Array.from(conversationsMap.values()),
    posts: [],
    comments: [],
    reactions: [],
    participantNamesToPseudonyms: contactPseudonyms.getPseudonymMap(),
    chatMappingToShow: chatPseudonyms.getPseudonymMap()
  };
}

async function createDatabase(file: File): Promise<WaSQLiteDB> {
  // Initialize wa-sqlite
  const module = await SQLiteESMFactory();
  const sqlite3 = SQLite.Factory(module);
  const api = sqlite3;

  // Read the file data
  const fileBuffer = await file.arrayBuffer();

  // Create and register a custom VFS that has the file pre-loaded
  const vfs = await createVFSWithFile(module, "imessage.db", fileBuffer);
  api.vfs_register(vfs, true);

  // Open the database (it will now read from our pre-populated VFS)
  const db = await api.open_v2("imessage.db");

  return { api, db };
}

// Create a simple in-memory VFS with a pre-loaded database file
async function createVFSWithFile(module: any, filename: string, data: ArrayBuffer) {
  // Import MemoryAsyncVFS
  const { MemoryAsyncVFS } = await import("@journeyapps/wa-sqlite/src/examples/MemoryAsyncVFS.js");

  // Create the VFS using the static create method
  const vfs: any = await (MemoryAsyncVFS as any).create("imessage-vfs", module);

  // Pre-populate the file in the VFS
  // We do this by accessing the internal map directly
  const url = new URL(filename, "file://");
  const pathname = url.pathname;

  vfs.mapNameToFile.set(pathname, {
    pathname,
    flags: 0,
    size: data.byteLength,
    data: data
  });

  return vfs;
}

// Helper function to get messages from the database
async function getMessages(dbObj: WaSQLiteDB): Promise<any[]> {
  const { api, db } = dbObj;
  const messages: any[] = [];

  const sql = `
    SELECT COALESCE(m.text, '') AS text,
           m.date,
           COALESCE(m.handle_id, 0) AS handle_id,
           COALESCE(c.group_id, '') AS group_id,
           COALESCE(c.room_name, '') AS room_name,
           COALESCE(m.is_from_me, 0) AS is_from_me,
           COALESCE(m.is_audio_message, 0) AS is_audio_message,
           COALESCE(m.error, 0) AS error,
           COALESCE(a.mime_type, '') AS mime_type
    FROM message m
             LEFT JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
             LEFT JOIN chat c ON cmj.chat_id = c.ROWID
             LEFT JOIN message_attachment_join maj ON maj.message_id = m.ROWID
             LEFT JOIN attachment a ON maj.attachment_id = a.ROWID
    WHERE m.error = 0 AND c.group_id IS NOT NULL;
  `;

  // Use the statements iterator API
  for await (const stmt of api.statements(db, sql)) {
    const cols = api.column_names(stmt);

    while ((await api.step(stmt)) === SQLite.SQLITE_ROW) {
      const row: any = {};
      for (let i = 0; i < cols.length; i++) {
        row[cols[i]] = api.column(stmt, i);
      }
      messages.push(row);
    }
  }

  return messages;
}

// Helper function to get chat information from the database
async function getGroupChats(dbObj: WaSQLiteDB): Promise<Map<string, string>> {
  const { api, db } = dbObj;
  const groupChats = new Map<string, string>();

  const sql = `
    SELECT group_id, display_name
    FROM chat
    WHERE group_id IS NOT NULL;
  `;

  // Use the statements iterator API
  for await (const stmt of api.statements(db, sql)) {
    while ((await api.step(stmt)) === SQLite.SQLITE_ROW) {
      const group_id = String(api.column(stmt, 0) ?? "");
      const display_name = String(api.column(stmt, 1) ?? "");
      groupChats.set(group_id, display_name);
    }
  }

  return groupChats;
}
