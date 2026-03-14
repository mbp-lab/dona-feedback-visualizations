export type CountOption = "words" | "seconds";

export interface SentReceivedPoint {
  year: number;
  month: number;
  sentCount: number;
  receivedCount: number;
}

export interface DailySentReceivedPoint {
  year: number;
  month: number;
  date: number;
  sentCount: number;
  receivedCount: number;
  epochSeconds: number;
}

export interface AnswerTimePoint {
  responseTimeMs: number;
  isFromDonor: boolean;
  timestampMs: number;
}

export interface DailyHourPoint {
  year: number;
  month: number;
  date: number;
  hour: number;
  minute: number;
  wordCount: number;
  epochSeconds: number;
}

export type SentReceived = {
  sent: number;
  received: number;
};

export type MessageCounts = {
  textMessages: SentReceived;
  audioMessages: SentReceived;
  allMessages: SentReceived;
};

export interface AudioLengthDistribution {
  sent: Record<string, number>;
  received: Record<string, number>;
}

export interface EmojiDistribution {
  sent: Record<string, number>;
  received: Record<string, number>;
}

export interface BasicStatistics {
  messagesTotal: MessageCounts;
  wordsTotal: SentReceived;
  secondsTotal: SentReceived;
  numberOfActiveMonths: number;
  numberOfActiveYears: number;
  messagesPerActiveMonth: MessageCounts;
  wordsPerActiveMonth: SentReceived;
  secondsPerActiveMonth: SentReceived;
  emojisTotal?: SentReceived;
}

export interface ChatSummary {
  chatName: string;
  donorSentMessages: number;
  donorSentWords: number;
  quickReplyPercentage: number;
  longestStreak: number;
}

export interface ActivityStats {
  activeDays: number;
  totalDays: number;
  activityPercentage: number;
}

export interface PeakDayStats {
  date: string;
  activeHours: number;
  totalMessagesExchanged: number;
  topChat: string;
}

export interface GeneralInfoStats {
  avgWordsPerSentMessage: number;
  activityStats: ActivityStats;
  peakDayStats: PeakDayStats;
}

export interface PodiumContact {
  name: string;
  messageCount: number;
  rank: number; // 1, 2 or 3
}
export interface ReplyTimeRacer {
  name: string;
  avgReplyTimeMinutes: number;
  formattedTime: string;
}

export interface PostStats {
  totalPosts: number;
  totalWords: number;
  totalMedia: number;
  avgWordsPerPost: number;
  avgMediaPerPost: number;
  postsOverTime: DailySentReceivedPoint[];
}

export interface CommentStats {
  totalComments: number;
  totalWords: number;
  avgWordsPerComment: number;
  commentsOverTime: DailySentReceivedPoint[];
}

export interface ReactionStats {
  totalReactions: number;
  reactionTypeBreakdown: Record<string, number>;
  reactionsOverTime: DailySentReceivedPoint[];
}

export interface GraphData {
  focusConversations: string[];
  monthlyWordsPerConversation: Record<string, SentReceivedPoint[]>;
  monthlySecondsPerConversation: Record<string, SentReceivedPoint[]>;
  dailyWordsPerConversation: DailySentReceivedPoint[][];
  participantsPerConversation: string[][];
  dailyWords: DailySentReceivedPoint[];
  slidingWindowMeanDailyWords: DailySentReceivedPoint[];
  slidingWindowMeanDailySeconds: DailySentReceivedPoint[];
  dailySentHours: DailyHourPoint[];
  // New: Sent hours per conversation for DailyActivityChart selection
  dailySentHoursPerConversation: DailyHourPoint[][];
  dailyReceivedHours: DailyHourPoint[];
  answerTimes: AnswerTimePoint[];
  audioLengthDistribution: AudioLengthDistribution;
  emojiDistribution?: EmojiDistribution;
  basicStatistics: BasicStatistics;
  // New added carousels and charts
  generalInfoStats: GeneralInfoStats;
  chatSummaries: ChatSummary[];
  topContactsPodium: PodiumContact[];
  replyTimeRace: ReplyTimeRacer[];
  postStats?: PostStats;
  commentStats?: CommentStats;
  reactionStats?: ReactionStats;
}
