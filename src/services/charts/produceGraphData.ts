import { Comment, Conversation, DataSourceValue, Post, Reaction } from "@models/processed";
import { DailySentReceivedPoint, GraphData } from "@models/graphData";
import { producePostStats, produceCommentStats, produceReactionStats } from "@services/charts/produceContentStats";
import {
  aggregateDailyCounts,
  monthlyCountsPerConversation,
  produceAllDays,
  produceAnswerTimesPerConversation,
  produceDailyCountsPerConversation,
  produceMessagesSentReceivedPerType,
  produceSlidingWindowMean,
  produceWordCountDailyHours
} from "@services/charts/timeAggregates";
import produceBasicStatistics from "@services/charts/produceBasicStatistics";
import { calculateMinMaxDates } from "@services/rangeFiltering";
import { produceActivityStats, producePeakDayStats } from "@services/charts/produceGeneralInfoStats";
import { produceChatSummaries } from "@services/charts/produceChatSummaryStats";
import { producePodiumStats } from "@services/charts/producePodiumStats";
import { produceReplyTimeRace } from "@services/charts/produceReplyTimeRace";

export default function produceGraphData(
  donorId: string,
  allConversations: Conversation[],
  allPosts: Post[] = [],
  allComments: Comment[] = [],
  allReactions: Reaction[] = []
): Record<string, GraphData> {
  return Object.fromEntries(
    Array.from(Map.groupBy(allConversations, ({ dataSource }) => dataSource).entries()).map(([dataSourceValue, conversations]) => {
      // extract focus conversations
      const focusConversations = conversations
        .filter(conversation => conversation.focusInFeedback)
        .map(conversation => conversation.conversationPseudonym);

      // per conversation data
      const dailyWordsPerConversation = conversations.map(conversation =>
        produceDailyCountsPerConversation(donorId, conversation, "words")
      );
      const chatSummaries = produceChatSummaries(donorId, conversations);
      const topContactsPodium = producePodiumStats(donorId, conversations);
      const replyTimeRace = produceReplyTimeRace(donorId, conversations);

      const dailySecondsPerConversation = conversations.map(conversation =>
        produceDailyCountsPerConversation(donorId, conversation, "seconds")
      );
      const participantsPerConversation = conversations.map(conversation =>
        conversation.participants.filter(participant => participant !== donorId)
      );
      const monthlyWordsPerConversation = monthlyCountsPerConversation(donorId, conversations, "words");
      const monthlySecondsPerConversation = monthlyCountsPerConversation(donorId, conversations, "seconds");

      // aggregated conversations data
      const dailySentHoursPerConversation = conversations.map(c => produceWordCountDailyHours(donorId, [c], true));
      const dailyWords = aggregateDailyCounts(dailyWordsPerConversation);
      const dailySeconds = aggregateDailyCounts(dailySecondsPerConversation);

      // determine the global date range using calculateMinMaxDates
      const { minDate, maxDate } = calculateMinMaxDates(conversations, true);
      let slidingWindowMeanDailyWords: DailySentReceivedPoint[] = [];
      let slidingWindowMeanDailySeconds: DailySentReceivedPoint[] = [];
      if (minDate && maxDate) {
        // generate the complete list of all days within the global date range
        const completeDaysList = produceAllDays(minDate, maxDate);
        // create sliding window mean using the complete days list
        slidingWindowMeanDailyWords = produceSlidingWindowMean(dailyWords, completeDaysList);
        slidingWindowMeanDailySeconds = produceSlidingWindowMean(dailySeconds, completeDaysList);
      }
      const dailySentHours = produceWordCountDailyHours(donorId, conversations, true);
      const dailyReceivedHours = produceWordCountDailyHours(donorId, conversations, false);

      const answerTimes = conversations.flatMap(conversation => produceAnswerTimesPerConversation(donorId, conversation));

      // general statistics
      const messageCounts = produceMessagesSentReceivedPerType(donorId, conversations);
      const wordCounts = Object.values(monthlyWordsPerConversation).flat();
      const secondCounts = Object.values(monthlySecondsPerConversation).flat();

      // initialize audio length distribution
      let audioLengthDistribution: { sent: Record<string, number>; received: Record<string, number> } = {
        sent: {},
        received: {}
      };

      // only calculate if there are audio messages
      const hasAudioMessages = conversations.some(conversation => conversation.messagesAudio.length > 0);
      if (hasAudioMessages) {
        conversations.forEach(conversation => {
          conversation.messagesAudio.forEach(messageAudio => {
            if (messageAudio.lengthSeconds > 0) {
              // Round the length to the nearest second
              const roundedLength = Math.round(messageAudio.lengthSeconds).toString();

              if (messageAudio.sender === donorId) {
                audioLengthDistribution!.sent[roundedLength] = (audioLengthDistribution!.sent[roundedLength] || 0) + 1;
              } else {
                audioLengthDistribution!.received[roundedLength] = (audioLengthDistribution!.received[roundedLength] || 0) + 1;
              }
            }
          });
        });
      }

      const basicStatistics = produceBasicStatistics(messageCounts, wordCounts, secondCounts);

      const avgWordsPerSentMessage =
        basicStatistics.messagesTotal.allMessages.sent > 0
          ? Math.round(basicStatistics.wordsTotal.sent / basicStatistics.messagesTotal.allMessages.sent)
          : 0;

      const activityStats = produceActivityStats(dailyWords, dailySeconds, conversations);
      const peakDayStats = producePeakDayStats(donorId, conversations);

      const generalInfoStats = {
        avgWordsPerSentMessage,
        activityStats,
        peakDayStats
      };

      // Content stats (posts, comments, reactions) filtered by data source
      const sourcePosts = allPosts.filter(p => p.dataSource === dataSourceValue);
      const sourceComments = allComments.filter(c => c.dataSource === dataSourceValue);
      const sourceReactions = allReactions.filter(r => r.dataSource === dataSourceValue);
      const postStats = producePostStats(sourcePosts);
      const commentStats = produceCommentStats(sourceComments);
      const reactionStats = produceReactionStats(sourceReactions);

      const graphData: GraphData = {
        focusConversations,
        monthlyWordsPerConversation,
        monthlySecondsPerConversation,
        dailyWords,
        slidingWindowMeanDailyWords,
        slidingWindowMeanDailySeconds,
        dailyWordsPerConversation,
        dailySentHours,
        dailySentHoursPerConversation,
        dailyReceivedHours,
        answerTimes,
        basicStatistics,
        participantsPerConversation,
        audioLengthDistribution,
        generalInfoStats,
        chatSummaries,
        topContactsPodium,
        replyTimeRace,
        postStats,
        commentStats,
        reactionStats
      };

      return [dataSourceValue, graphData];
    })
  ) as Record<DataSourceValue, GraphData>;
}
