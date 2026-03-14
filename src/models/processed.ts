type Participant = string;
export type ChatMapping = Map<string, string[]>;

export enum DataSourceValue {
  WhatsApp = "WhatsApp",
  Facebook = "Facebook",
  Instagram = "Instagram",
  IMessage = "IMessage"
}

export enum DonationStatus {
  Pending = "pending", //TODO: Post consent, pre donation
  Complete = "complete",
  Deleted = "deleted"
}

export interface DataSource {
  id: number;
  name: DataSourceValue;
}

export interface Message {
  id?: string;
  wordCount: number;
  emojiCounts?: Record<string, number>;
  timestamp: number;
  sender: string;
}

export interface MessageAudio {
  id?: string;
  lengthSeconds: number;
  timestamp: number;
  sender: string;
}

export interface Conversation {
  id?: string;
  isGroupConversation?: boolean;
  conversationId?: string;
  dataSource: string;
  messages: Array<Message>;
  messagesAudio: Array<MessageAudio>;
  participants: Array<Participant>;
  conversationPseudonym: string;
  focusInFeedback?: boolean;
  conversationHash?: string | null;
}

export interface Post {
  wordCount: number;
  mediaCount: number;
  timestampMs: number;
  dataSource: string;
}

export interface Comment {
  wordCount: number;
  timestampMs: number;
  dataSource: string;
}

export interface Reaction {
  reactionType: string;
  timestampMs: number;
  dataSource: string;
}

export interface AnonymizationResult {
  anonymizedConversations: Conversation[];
  posts: Post[];
  comments: Comment[];
  reactions: Reaction[];
  participantNamesToPseudonyms: Record<string, string>;
  chatMappingToShow: ChatMapping;
}
