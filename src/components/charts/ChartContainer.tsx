import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import React from "react";

import AnimatedCountsPerChatBarChart from "@components/charts/AnimatedCountsPerChatBarChart";
import AnimatedIntensityPolarChart from "@components/charts/AnimatedIntensityPolarChart";
import AudioLengthsBarChart from "@components/charts/AudioLengthsBarChart";
import CommentActivityChart from "@components/charts/CommentActivityChart";
import CountsOverallBarChart from "@components/charts/CountsOverallBarChart";
import DayPartsActivityOverallChart from "@components/charts/DayPartsActivityOverallChart";
import EmojiBarChart from "@components/charts/EmojiBarChart";
import EngagementStyleChart from "@components/charts/EngagementStyleChart";
import PostActivityChart from "@components/charts/PostActivityChart";
import ReactionBreakdownChart from "@components/charts/ReactionBreakdownChart";
import SocialEngagementTimelineChart from "@components/charts/SocialEngagementTimelineChart";
import SentReceivedSlidingWindowChart from "@components/charts/SentReceivedSlidingWindowChart";
import { GraphData } from "@models/graphData";
import pick from "@services/basicHelpers";

export enum ChartType {
  AudioLengthsBarChart = "audioLengthsBarChart",
  EmojiBarChart = "emojiBarChart",
  AnimatedIntensityPolarChart = "animatedIntensityPolarChart",
  AnimatedWordsPerChatBarChart = "animatedWordsPerChatBarChart",
  AnimatedSecondsPerChatBarChart = "animatedSecondsPerChatBarChart",
  WordCountOverallBarChart = "wordCountOverallBarChart",
  SecondCountOverallBarChart = "secondCountOverallBarChart",
  WordCountSlidingWindowMean = "wordCountSlidingWindowMean",
  SecondCountSlidingWindowMean = "secondCountSlidingWindowMean",
  DayPartsActivityOverallChart = "dayPartsActivityOverallChart",
  PostActivityChart = "postActivityChart",
  CommentActivityChart = "commentActivityChart",
  ReactionBreakdownChart = "reactionBreakdownChart",
  SocialEngagementTimelineChart = "socialEngagementTimelineChart",
  EngagementStyleChart = "engagementStyleChart"
}

interface ChartContainerProps {
  type: ChartType;
  data: GraphData;
  dataSourceValue?: string;
  /** Tighter day-parts chart padding/height for carousel slides (labels stay visible). */
  compact?: boolean;
}

export default function ChartContainer({ type, data, compact = false }: ChartContainerProps) {
  // For charts that show data per conversation, keep only the ones selected by the user
  const selectedChatsWordsData = pick(data.monthlyWordsPerConversation, data.focusConversations);
  const selectedChatsSecondsData = pick(data.monthlySecondsPerConversation, data.focusConversations);

  const renderChart = () => {
    switch (type) {
      // Focus conversations only
      case ChartType.AnimatedIntensityPolarChart:
        return <AnimatedIntensityPolarChart dataMonthlyPerConversation={selectedChatsWordsData} />;
      case ChartType.AnimatedWordsPerChatBarChart:
        return <AnimatedCountsPerChatBarChart dataMonthlyPerConversation={selectedChatsWordsData} mode="text" />;
      case ChartType.AnimatedSecondsPerChatBarChart:
        return <AnimatedCountsPerChatBarChart dataMonthlyPerConversation={selectedChatsSecondsData} mode="audio" />;

      // Message composition
      case ChartType.AudioLengthsBarChart:
        return <AudioLengthsBarChart audioLengthDistribution={data.audioLengthDistribution} />;
      case ChartType.EmojiBarChart:
        return data.emojiDistribution ? <EmojiBarChart emojiDistribution={data.emojiDistribution} /> : null;

      // Aggregated data only
      case ChartType.WordCountOverallBarChart:
        return (
          <CountsOverallBarChart
            sentWordsTotal={data.basicStatistics.wordsTotal.sent}
            receivedWordsTotal={data.basicStatistics.wordsTotal.received}
            mode="text"
          />
        );
      case ChartType.SecondCountOverallBarChart:
        return (
          <CountsOverallBarChart
            sentWordsTotal={data.basicStatistics.secondsTotal.sent}
            receivedWordsTotal={data.basicStatistics.secondsTotal.received}
            mode="audio"
          />
        );
      case ChartType.WordCountSlidingWindowMean:
        return <SentReceivedSlidingWindowChart slidingWindowMeanDailyWords={data.slidingWindowMeanDailyWords} mode="text" />;
      case ChartType.SecondCountSlidingWindowMean:
        return <SentReceivedSlidingWindowChart slidingWindowMeanDailyWords={data.slidingWindowMeanDailySeconds} mode="audio" />;

      // Day parts
      case ChartType.DayPartsActivityOverallChart:
        return (
          <DayPartsActivityOverallChart
            dailySentHours={data.dailySentHours}
            dailyReceivedHours={data.dailyReceivedHours}
            compact={compact}
          />
        );

      // Social content
      case ChartType.PostActivityChart:
        return data.postStats ? <PostActivityChart postStats={data.postStats} /> : null;
      case ChartType.CommentActivityChart:
        return data.commentStats ? <CommentActivityChart commentStats={data.commentStats} /> : null;
      case ChartType.ReactionBreakdownChart:
        return data.reactionStats ? <ReactionBreakdownChart reactionStats={data.reactionStats} /> : null;
      case ChartType.SocialEngagementTimelineChart:
        return data.postStats || data.commentStats || data.reactionStats ? (
          <SocialEngagementTimelineChart postStats={data.postStats} commentStats={data.commentStats} reactionStats={data.reactionStats} />
        ) : null;
      case ChartType.EngagementStyleChart:
        return data.postStats || data.commentStats || data.reactionStats ? (
          <EngagementStyleChart postStats={data.postStats} commentStats={data.commentStats} reactionStats={data.reactionStats} />
        ) : null;

      default:
        return (
          <Box
            sx={{
              width: "100%",
              border: "1px dashed grey",
              height: 150,
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <Typography variant="body2">Placeholder for {type} chart</Typography>
          </Box>
        );
    }
  };

  return renderChart();
}
