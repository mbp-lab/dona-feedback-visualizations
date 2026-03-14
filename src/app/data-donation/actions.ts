"use server";

import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { db } from "@/db/drizzle";
import {
  comments,
  conversationParticipants,
  conversations,
  donations,
  graphData,
  messages,
  messagesAudio,
  posts,
  reactions
} from "@/db/schema";
import { DbClient } from "@/db/types";
import { NewComment, NewConversation, NewMessage, NewMessageAudio, NewPost, NewReaction } from "@models/persisted";
import { Comment, Conversation, DonationStatus, Post, Reaction } from "@models/processed";
import { DonationStats } from "@services/donationStats";
import { DonationErrors, DonationProcessingError, SerializedDonationError } from "@services/errors";

const MAX_MESSAGES_PER_TX = 10000; // max messages (text + audio) per DB transaction
const BULK_CHUNK = 2000; // chunk size for large bulk inserts

interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: SerializedDonationError;
}

function generateExternalDonorId(): string {
  return Math.random().toString(36).substring(2, 8);
}

export async function startDonation(
  externalDonorId?: string,
  stats?: DonationStats,
  dbClient: DbClient = db
): Promise<ActionResult<{ donationId: string; donorId: string }>> {
  const donorId = uuidv4();
  const externalIdToUse = externalDonorId || generateExternalDonorId();
  console.log(`[DONATION][donorId=${donorId}] startDonation: externalDonorId=${externalIdToUse}`);
  if (stats) {
    console.log(`[DONATION][donorId=${donorId}] Stats: ${JSON.stringify(stats, null, 2)}`);
  }
  try {
    const inserted = await dbClient
      .insert(donations)
      .values({
        donorId,
        externalDonorId: externalIdToUse,
        status: DonationStatus.Pending
      })
      .returning({ id: donations.id });

    const donationId = inserted[0]?.id!;
    console.log(`[DONATION][donorId=${donorId}] ✅ startDonation: donationId=${donationId}`);
    return { success: true, data: { donationId, donorId } };
  } catch (err) {
    console.error(`[DONATION][donorId=${donorId}] ❌ startDonation:`, {
      error: err,
      stack: (err as any)?.stack
    });
    if ((err as any)?.constraint === "donations_external_donor_id_unique") {
      return {
        success: false,
        error: DonationProcessingError(DonationErrors.DuplicateDonorId, { originalError: err })
      };
    }
    return {
      success: false,
      error: DonationProcessingError(DonationErrors.TransactionFailed, { originalError: err })
    };
  }
}

export async function appendConversationBatch(
  donationId: string,
  donorId: string,
  batch: Conversation[],
  donorAlias: string,
  dbClient: DbClient = db
): Promise<ActionResult<{ inserted: number }>> {
  console.log(`[DONATION][donorId=${donorId}][donationId=${donationId}] appendConversationBatch: batchSize=${batch.length}`);

  try {
    const dataSources = (await dbClient.query.dataSources.findMany()) as any;

    // Build sub-batches so total (text + audio) messages per sub-batch <= MAX_MESSAGES_PER_TX
    const subBatches: Conversation[][] = [];
    let current: Conversation[] = [];
    let currentMsgCount = 0;
    for (const convo of batch) {
      const textCount = convo.messages?.length ?? 0;
      const audioCount = convo.messagesAudio?.length ?? 0;
      const convoTotal = textCount + audioCount;
      if (current.length > 0 && currentMsgCount + convoTotal > MAX_MESSAGES_PER_TX) {
        subBatches.push(current);
        current = [];
        currentMsgCount = 0;
      }
      current.push(convo);
      currentMsgCount += convoTotal;
    }
    if (current.length > 0) subBatches.push(current);

    for (let sIdx = 0; sIdx < subBatches.length; sIdx++) {
      const sub = subBatches[sIdx];
      const subIndex = sIdx + 1;
      const totalSubBatches = subBatches.length;
      const convoCount = sub.length;
      const textCount = sub.reduce((acc, c) => acc + (c.messages?.length ?? 0), 0);
      const audioCount = sub.reduce((acc, c) => acc + (c.messagesAudio?.length ?? 0), 0);

      // 1) Insert conversations in one transaction and get IDs (so messages can be inserted in later txs)
      const insertedConvos = await dbClient.transaction(async tx => {
        const newConvos = sub.map(convo => NewConversation.create(donationId, convo, dataSources));
        return tx.insert(conversations).values(newConvos).returning({ id: conversations.id });
      });
      const conversationIds = insertedConvos.map(r => r.id);

      // 2) Build messages, audio messages and participants lists (use same participantId mapping per conversation)
      const messagesToInsert: any[] = [];
      const audioToInsert: any[] = [];
      const participantsToInsert: any[] = [];

      for (let idx = 0; idx < sub.length; idx++) {
        const convo = sub[idx];
        const conversationId = conversationIds[idx];

        const participantIdMap: Record<string, string> = {};
        const resolveParticipantId = (participant: string): string => {
          if (participant === donorAlias) return donorId;
          if (!participantIdMap[participant]) participantIdMap[participant] = uuidv4();
          return participantIdMap[participant];
        };

        // Text messages
        for (const message of convo.messages || []) {
          const senderId = resolveParticipantId(message.sender);
          const newMessage = NewMessage.create(conversationId, {
            ...message,
            sender: senderId
          });
          messagesToInsert.push(newMessage);
        }

        // Audio messages
        for (const audio of convo.messagesAudio || []) {
          const senderId = resolveParticipantId(audio.sender);
          const newAudio = NewMessageAudio.create(conversationId, {
            ...audio,
            sender: senderId
          });
          audioToInsert.push(newAudio);
        }

        // Participants
        for (const participant of convo.participants || []) {
          const participantId = resolveParticipantId(participant);
          participantsToInsert.push({
            participantId,
            conversationId,
            participantPseudonym: participant
          });
        }
      }

      // 3) Insert text messages in windows so each transaction handles <= MAX_MESSAGES_PER_TX
      let insertedText = 0;
      if (messagesToInsert.length > 0) {
        for (let start = 0; start < messagesToInsert.length; start += MAX_MESSAGES_PER_TX) {
          const window = messagesToInsert.slice(start, start + MAX_MESSAGES_PER_TX);
          await dbClient.transaction(async tx => {
            for (let j = 0; j < window.length; j += BULK_CHUNK) {
              await tx.insert(messages).values(window.slice(j, j + BULK_CHUNK));
            }
          });
          insertedText += window.length;
        }
      }

      // 4) Insert audio messages similarly
      let insertedAudio = 0;
      if (audioToInsert.length > 0) {
        for (let start = 0; start < audioToInsert.length; start += MAX_MESSAGES_PER_TX) {
          const window = audioToInsert.slice(start, start + MAX_MESSAGES_PER_TX);
          await dbClient.transaction(async tx => {
            for (let j = 0; j < window.length; j += BULK_CHUNK) {
              await tx.insert(messagesAudio).values(window.slice(j, j + BULK_CHUNK));
            }
          });
          insertedAudio += window.length;
        }
      }

      // 5) Insert participants (once)
      let insertedParticipants = 0;
      if (participantsToInsert.length > 0) {
        for (let i = 0; i < participantsToInsert.length; i += BULK_CHUNK) {
          const chunk = participantsToInsert.slice(i, i + BULK_CHUNK);
          await dbClient.insert(conversationParticipants).values(chunk);
          insertedParticipants += chunk.length;
        }
      }

      console.log(
        `[DONATION][donorId=${donorId}][donationId=${donationId}] ` +
          `Sub-batch ${subIndex}/${totalSubBatches}: ${convoCount} conversations, ${textCount} messages, ${audioCount} audio messages`
      );
    }

    console.log(
      `[DONATION][donorId=${donorId}][donationId=${donationId}] ✅ appendConversationBatch: inserted ${batch.length} conversations`
    );
    return { success: true };
  } catch (err) {
    console.error(`[DONATION][donorId=${donorId}][donationId=${donationId}] ❌ appendConversationBatch:`, {
      error: err,
      stack: (err as any)?.stack
    });
    return {
      success: false,
      error: DonationProcessingError(DonationErrors.TransactionFailed, { originalError: err })
    };
  }
}

export async function appendContentData(
  donationId: string,
  postItems: Post[],
  commentItems: Comment[],
  reactionItems: Reaction[],
  dbClient: DbClient = db
): Promise<ActionResult> {
  console.log(
    `[DONATION][donationId=${donationId}] appendContentData: ${postItems.length} posts, ${commentItems.length} comments, ${reactionItems.length} reactions`
  );

  try {
    const dataSources = (await dbClient.query.dataSources.findMany()) as any;

    const resolveDataSourceId = (dataSource: string): number =>
      dataSources.find((ds: any) => ds.name === dataSource)?.id ?? dataSources[0].id;

    // Insert posts
    if (postItems.length > 0) {
      const postsToInsert = postItems.map(p => NewPost.create(donationId, resolveDataSourceId(p.dataSource), p));
      for (let i = 0; i < postsToInsert.length; i += BULK_CHUNK) {
        const chunk = postsToInsert.slice(i, i + BULK_CHUNK);
        await dbClient.insert(posts).values(chunk);
      }
    }

    // Insert comments
    if (commentItems.length > 0) {
      const commentsToInsert = commentItems.map(c => NewComment.create(donationId, resolveDataSourceId(c.dataSource), c));
      for (let i = 0; i < commentsToInsert.length; i += BULK_CHUNK) {
        const chunk = commentsToInsert.slice(i, i + BULK_CHUNK);
        await dbClient.insert(comments).values(chunk);
      }
    }

    // Insert reactions
    if (reactionItems.length > 0) {
      const reactionsToInsert = reactionItems.map(r => NewReaction.create(donationId, resolveDataSourceId(r.dataSource), r));
      for (let i = 0; i < reactionsToInsert.length; i += BULK_CHUNK) {
        const chunk = reactionsToInsert.slice(i, i + BULK_CHUNK);
        await dbClient.insert(reactions).values(chunk);
      }
    }

    console.log(`[DONATION][donationId=${donationId}] ✅ appendContentData`);
    return { success: true };
  } catch (err) {
    console.error(`[DONATION][donationId=${donationId}] ❌ appendContentData:`, {
      error: err,
      stack: (err as any)?.stack
    });
    return {
      success: false,
      error: DonationProcessingError(DonationErrors.TransactionFailed, { originalError: err })
    };
  }
}

export async function finalizeDonation(
  donationId: string,
  graphDataRecord: Record<string, any>,
  dbClient: DbClient = db
): Promise<ActionResult<{ donationId: string }>> {
  console.log(`[DONATION][donationId=${donationId}] finalizeDonation`);
  try {
    await dbClient.transaction(async tx => {
      await tx.insert(graphData).values({ donationId, data: graphDataRecord });
      await tx.update(donations).set({ status: DonationStatus.Complete }).where(eq(donations.id, donationId));
    });
    console.log(`[DONATION][donationId=${donationId}] ✅ finalizeDonation`);
    return { success: true, data: { donationId } };
  } catch (err) {
    console.error(`[DONATION][donationId=${donationId}] ❌ finalizeDonation:`, {
      error: err,
      stack: (err as any)?.stack
    });
    return {
      success: false,
      error: DonationProcessingError(DonationErrors.TransactionFailed, { originalError: err })
    };
  }
}

/**
 * Checks if any of the provided conversation hashes already exist in the database.
 * This is used to detect duplicate donations before uploading.
 *
 * @param hashes - Array of conversation hashes to check
 * @param dbClient - Database client (defaults to db)
 * @returns ActionResult with success=false if duplicates found, success=true otherwise
 */
export async function checkForDuplicateConversations(
  hashes: string[],
  dbClient: DbClient = db
): Promise<ActionResult<{ hasDuplicates: boolean }>> {
  console.log(`[DONATION] checkForDuplicateConversations: checking ${hashes.length} hashes`);

  try {
    // Filter out null/empty hashes
    const validHashes = hashes.filter(h => h && h.length > 0);

    if (validHashes.length === 0) {
      console.log(`[DONATION] ✅ checkForDuplicateConversations: no valid hashes to check`);
      return { success: true, data: { hasDuplicates: false } };
    }

    // Query database for existing conversations with these hashes
    const existingConversations = await dbClient.query.conversations.findMany({
      where: (conversations: any, { inArray }: { inArray: any }) => inArray(conversations.conversationHash, validHashes),
      columns: {
        conversationHash: true
      }
    });

    const hasDuplicates = existingConversations.length > 0;

    if (hasDuplicates) {
      console.log(`[DONATION] ❌ checkForDuplicateConversations: found ${existingConversations.length} duplicate(s)`);
      return {
        success: false,
        error: DonationProcessingError(DonationErrors.DuplicateConversation, {
          duplicateCount: existingConversations.length
        })
      };
    }

    console.log(`[DONATION] ✅ checkForDuplicateConversations: no duplicates found`);
    return { success: true, data: { hasDuplicates: false } };
  } catch (err) {
    console.error(`[DONATION] ❌ checkForDuplicateConversations:`, {
      error: err,
      stack: (err as any)?.stack
    });
    return {
      success: false,
      error: DonationProcessingError(DonationErrors.TransactionFailed, { originalError: err })
    };
  }
}

/**
 * Logs client-side errors to the server for debugging purposes.
 * @param error - The error object to log
 * @param context - Optional context string to identify where the error occurred
 */
export async function logClientError(error: any, context?: string): Promise<void> {
  const errorMessage = error?.message || String(error);
  const errorStack = error?.stack || "No stack trace available";

  console.error(`[CLIENT ERROR]${context ? `[${context}]` : ""} ${errorMessage}`, {
    stack: errorStack
  });
}
