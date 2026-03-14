import { AnonymizationResult, Comment, Conversation, DataSourceValue, Message, MessageAudio, Post, Reaction } from "@models/processed";
import { isTextMessage, isVoiceMessage } from "@services/parsing/meta/messageChecks";
import { ParsedConversation } from "@services/parsing/meta/metaHandlers";
import { getAliasConfig } from "@services/parsing/shared/aliasConfig";
import calculateAudioLength from "@services/parsing/shared/audioLength";
import emojiCount from "@services/parsing/shared/emojiCount";
import { ChatPseudonyms, ContactPseudonyms } from "@services/parsing/shared/pseudonyms";
import wordCount from "@services/parsing/shared/wordCount";
import { ValidEntry } from "@services/parsing/shared/zipExtraction";

export default async function deIdentify(
  parsedConversations: ParsedConversation[],
  audioEntries: ValidEntry[],
  donorName: string,
  dataSourceValue: DataSourceValue,
  rawPosts: string[] = [],
  rawComments: string[] = [],
  rawReactions: string[] = []
): Promise<AnonymizationResult> {
  const aliasConfig = getAliasConfig();
  const contactPseudonyms = new ContactPseudonyms(aliasConfig.contactAlias);
  const chatPseudonyms = new ChatPseudonyms(aliasConfig.donorAlias, aliasConfig.chatAlias, dataSourceValue);
  chatPseudonyms.setDonorName(donorName);
  contactPseudonyms.setPseudonym(donorName, aliasConfig.donorAlias);

  const deIdentifiedConversations: Conversation[] = await Promise.all(
    parsedConversations.map(async (jsonContent): Promise<Conversation | null> => {
      const textMessages: Message[] = [];
      const audioMessages: MessageAudio[] = [];

      // Generate participant pseudonyms first (using participants array, not messages)
      const participantPseudonyms = new Set<string>();
      jsonContent.participants.forEach(participant => {
        const participantName = contactPseudonyms.getPseudonym(participant.name);
        participantPseudonyms.add(participantName);
      });

      await Promise.all(
        jsonContent.messages.map(async messageData => {
          const timestamp = messageData.timestamp_ms;
          const senderName = contactPseudonyms.getPseudonym(messageData.sender_name);

          if (isVoiceMessage(messageData)) {
            const audioUri = messageData.audio_files?.[0]?.uri;
            const audioFile = !audioUri ? undefined : audioEntries.find(entry => entry.filename.endsWith(audioUri));
            audioMessages.push({
              lengthSeconds: await calculateAudioLength(audioFile),
              timestamp,
              sender: senderName
            } as MessageAudio);
          } else if (isTextMessage(messageData)) {
            const messageContent = messageData.content || "";
            const emojis = emojiCount(messageContent);
            textMessages.push({
              wordCount: wordCount(messageContent),
              emojiCounts: Object.keys(emojis).length > 0 ? emojis : undefined,
              timestamp,
              sender: senderName
            } as Message);
          }
        })
      );
      if (textMessages.length === 0 && audioMessages.length === 0) {
        return null;
      }

      const participants = Array.from(participantPseudonyms);
      const isGroupConversation = participants.length > 2;

      // Add to chats to show
      contactPseudonyms.setPseudonym(donorName, aliasConfig.donorAlias);
      const conversationPseudonym = chatPseudonyms.getPseudonym(contactPseudonyms.getOriginalNames(participants));

      return {
        isGroupConversation,
        dataSource: dataSourceValue,
        messages: textMessages,
        messagesAudio: audioMessages,
        participants,
        conversationPseudonym
      } as Conversation;
    })
  ).then(results => results.filter(Boolean) as Conversation[]);

  // TODO: Filtering and chat selection logic

  const posts = processPosts(rawPosts, dataSourceValue);
  const processedComments = processComments(rawComments, dataSourceValue);
  const processedReactions = processReactions(rawReactions, dataSourceValue);

  return {
    anonymizedConversations: deIdentifiedConversations,
    posts,
    comments: processedComments,
    reactions: processedReactions,
    participantNamesToPseudonyms: contactPseudonyms.getPseudonymMap(),
    chatMappingToShow: chatPseudonyms.getPseudonymMap()
  };
}

function processPosts(rawPosts: string[], dataSource: DataSourceValue): Post[] {
  const result: Post[] = [];

  for (const raw of rawPosts) {
    try {
      let jsonContent = JSON.parse(raw);

      // Handle wrapper objects with a single key containing the array
      if (jsonContent !== null && typeof jsonContent === "object" && !Array.isArray(jsonContent)) {
        const keys = Object.keys(jsonContent);
        if (keys.length === 1) {
          jsonContent = jsonContent[keys[0]];
        }
      }

      if (!Array.isArray(jsonContent)) continue;

      for (const post of jsonContent) {
        if (dataSource === DataSourceValue.Facebook) {
          const wc = post.data?.[0]?.post ? wordCount(post.data[0].post) : 0;
          const mediaCount = post.attachments?.length ?? 0;
          const timestamp = post.timestamp;
          if (timestamp) {
            result.push({ wordCount: wc, mediaCount, timestampMs: timestamp * 1000, dataSource });
          }
        } else if (dataSource === DataSourceValue.Instagram) {
          let wc = 0;
          if (post.title) {
            wc = wordCount(post.title);
          } else if (post.media?.length > 0 && post.media[0].title) {
            wc = wordCount(post.media[0].title);
          }

          const mediaCount = post.media?.length ?? 0;

          let timestamp: number;
          if (post.creation_timestamp) {
            timestamp = post.creation_timestamp;
          } else if (post.media?.length > 0 && post.media[0].creation_timestamp) {
            timestamp = post.media[0].creation_timestamp;
          } else {
            timestamp = -1;
          }

          if (timestamp > 0) {
            result.push({ wordCount: wc, mediaCount, timestampMs: timestamp * 1000, dataSource });
          }
        }
      }
    } catch (error) {
      console.error("Error processing post entry:", error);
    }
  }

  return result;
}

function processComments(rawComments: string[], dataSource: DataSourceValue): Comment[] {
  const result: Comment[] = [];

  for (const raw of rawComments) {
    try {
      const jsonContent = JSON.parse(raw);

      if (dataSource === DataSourceValue.Facebook) {
        const availableKeys = Object.keys(jsonContent);
        const relevantKeys = availableKeys.filter(key => key.includes("comment"));

        for (const key of relevantKeys) {
          if (!Array.isArray(jsonContent[key])) continue;
          for (const comment of jsonContent[key]) {
            const wc = comment.data?.[0]?.comment?.comment ? wordCount(comment.data[0].comment.comment) : 0;
            const timestamp = comment.timestamp;
            if (timestamp) {
              result.push({ wordCount: wc, timestampMs: timestamp * 1000, dataSource });
            }
          }
        }
      } else if (dataSource === DataSourceValue.Instagram) {
        const items = Array.isArray(jsonContent) ? jsonContent : [];
        for (const comment of items) {
          const wc = comment.string_map_data?.Comment?.value ? wordCount(comment.string_map_data.Comment.value) : 0;
          const timestamp = comment.string_map_data?.Time?.timestamp ?? -1;
          if (timestamp > 0) {
            result.push({ wordCount: wc, timestampMs: timestamp * 1000, dataSource });
          }
        }
      }
    } catch (error) {
      console.error("Error processing comment entry:", error);
    }
  }

  return result;
}

function processReactions(rawReactions: string[], dataSource: DataSourceValue): Reaction[] {
  const result: Reaction[] = [];

  for (const raw of rawReactions) {
    try {
      const jsonContent = JSON.parse(raw);

      if (dataSource === DataSourceValue.Facebook) {
        const items = Array.isArray(jsonContent) ? jsonContent : [];
        for (const reaction of items) {
          const reactionType = reaction.data?.[0]?.reaction?.reaction ?? "unknown";
          const timestamp = reaction.timestamp;
          if (timestamp) {
            result.push({ reactionType, timestampMs: timestamp * 1000, dataSource });
          }
        }
      } else if (dataSource === DataSourceValue.Instagram) {
        const availableKeys = Object.keys(jsonContent);
        const relevantKeys = availableKeys.filter(key => key.includes("likes"));

        for (const key of relevantKeys) {
          if (!Array.isArray(jsonContent[key])) continue;
          for (const reaction of jsonContent[key]) {
            const reactionType = reaction.string_list_data?.[0]?.value ?? "unknown";
            const timestamp = reaction.string_list_data?.[0]?.timestamp ?? -1;
            if (timestamp > 0) {
              result.push({ reactionType, timestampMs: timestamp * 1000, dataSource });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error processing reaction entry:", error);
    }
  }

  return result;
}
