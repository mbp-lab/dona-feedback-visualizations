import { conversations, messages, messagesAudio, posts, comments, reactions } from "@/db/schema";
import { Conversation, Message, DataSource, MessageAudio, Post, Comment, Reaction } from "@models/processed";

type NewConversation = typeof conversations.$inferInsert;
namespace NewConversation {
  export function create(donationId: string, convo: Conversation, dataSourceOptions: DataSource[]): NewConversation {
    const { isGroupConversation, dataSource, conversationPseudonym, focusInFeedback, conversationHash } = convo;
    return {
      donationId,
      dataSourceId: dataSourceOptions.find(({ name }) => name === dataSource)!.id,
      isGroupConversation: isGroupConversation || undefined,
      conversationPseudonym: conversationPseudonym,
      focusInFeedback: focusInFeedback ?? true,
      conversationHash: conversationHash || undefined
    };
  }
}

type NewMessage = typeof messages.$inferInsert;
namespace NewMessage {
  export function create(conversationId: string, message: Message): NewMessage {
    const { wordCount, emojiCounts, timestamp, sender } = message;
    return {
      wordCount,
      emojiCounts: emojiCounts || undefined,
      dateTime: new Date(timestamp),
      senderId: sender || undefined,
      conversationId: conversationId
    };
  }
}

type NewMessageAudio = typeof messagesAudio.$inferInsert;
namespace NewMessageAudio {
  export function create(conversationId: string, message: MessageAudio): NewMessageAudio {
    const { lengthSeconds, timestamp, sender } = message;
    return {
      lengthSeconds,
      dateTime: new Date(timestamp),
      senderId: sender || undefined,
      conversationId: conversationId
    };
  }
}

type NewPost = typeof posts.$inferInsert;
namespace NewPost {
  export function create(donationId: string, dataSourceId: number, post: Post): NewPost {
    return {
      donationId,
      dataSourceId,
      wordCount: post.wordCount,
      mediaCount: post.mediaCount,
      dateTime: new Date(post.timestampMs)
    };
  }
}

type NewComment = typeof comments.$inferInsert;
namespace NewComment {
  export function create(donationId: string, dataSourceId: number, comment: Comment): NewComment {
    return {
      donationId,
      dataSourceId,
      wordCount: comment.wordCount,
      dateTime: new Date(comment.timestampMs)
    };
  }
}

type NewReaction = typeof reactions.$inferInsert;
namespace NewReaction {
  export function create(donationId: string, dataSourceId: number, reaction: Reaction): NewReaction {
    return {
      donationId,
      dataSourceId,
      reactionType: reaction.reactionType,
      dateTime: new Date(reaction.timestampMs)
    };
  }
}

export { NewConversation, NewMessage, NewMessageAudio, NewPost, NewComment, NewReaction };
