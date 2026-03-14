import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from "chart.js";
import React from "react";
import { Bar } from "react-chartjs-2";

import { CHART_LAYOUT, COMMON_CHART_OPTIONS } from "@components/charts/chartConfig";
import DownloadButtons from "@components/charts/DownloadButtons";
import { CommentStats, DailySentReceivedPoint, PostStats, ReactionStats } from "@models/graphData";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface SocialEngagementTimelineChartProps {
  postStats?: PostStats;
  commentStats?: CommentStats;
  reactionStats?: ReactionStats;
}

function dateKey(p: DailySentReceivedPoint): string {
  return new Date(Date.UTC(p.year, p.month - 1, p.date)).toISOString().slice(0, 10);
}

function buildDateMap(points: DailySentReceivedPoint[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const p of points) {
    map.set(dateKey(p), p.sentCount);
  }
  return map;
}

const SocialEngagementTimelineChart: React.FC<SocialEngagementTimelineChartProps> = ({ postStats, commentStats, reactionStats }) => {
  const CHART_NAME = "social-engagement-timeline";
  const containerId = `chart-wrapper-${CHART_NAME}`;

  const postMap = buildDateMap(postStats?.postsOverTime ?? []);
  const commentMap = buildDateMap(commentStats?.commentsOverTime ?? []);
  const reactionMap = buildDateMap(reactionStats?.reactionsOverTime ?? []);

  const allDatesSet = new Set<string>([...postMap.keys(), ...commentMap.keys(), ...reactionMap.keys()]);
  const allDates = Array.from(allDatesSet).sort();

  const datasets = [];
  if (postStats) {
    datasets.push({
      label: "Posts",
      data: allDates.map(d => postMap.get(d) ?? 0),
      backgroundColor: "#4BC0C0",
      maxBarThickness: CHART_LAYOUT.maxBarThickness
    });
  }
  if (commentStats) {
    datasets.push({
      label: "Comments",
      data: allDates.map(d => commentMap.get(d) ?? 0),
      backgroundColor: "#36A2EB",
      maxBarThickness: CHART_LAYOUT.maxBarThickness
    });
  }
  if (reactionStats) {
    datasets.push({
      label: "Reactions",
      data: allDates.map(d => reactionMap.get(d) ?? 0),
      backgroundColor: "#FF6384",
      maxBarThickness: CHART_LAYOUT.maxBarThickness
    });
  }

  const chartData = { labels: allDates, datasets };

  const totalPosts = postStats?.totalPosts ?? 0;
  const totalComments = commentStats?.totalComments ?? 0;
  const totalReactions = reactionStats?.totalReactions ?? 0;
  const totalActivity = totalPosts + totalComments + totalReactions;

  return (
    <Box>
      <Stack direction="row" spacing={3} justifyContent="center" flexWrap="wrap" sx={{ mb: 2 }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" fontWeight="bold">
            {totalActivity}
          </Typography>
          <Typography variant="caption">Total Activity</Typography>
        </Box>
        {postStats && (
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h5" fontWeight="bold">
              {totalPosts}
            </Typography>
            <Typography variant="caption">Posts</Typography>
          </Box>
        )}
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" fontWeight="bold">
            {totalComments}
          </Typography>
          <Typography variant="caption">Comments</Typography>
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" fontWeight="bold">
            {totalReactions}
          </Typography>
          <Typography variant="caption">Reactions</Typography>
        </Box>
      </Stack>

      <Box id={containerId} position="relative" p={CHART_LAYOUT.paddingX}>
        <Box display="flex" justifyContent="right" alignItems="center" mb={1}>
          <DownloadButtons chartId={containerId} fileNamePrefix={CHART_NAME} />
        </Box>
        <Box sx={{ width: "100%", height: CHART_LAYOUT.responsiveChartHeight }}>
          <Bar
            data={chartData}
            options={{
              ...COMMON_CHART_OPTIONS,
              plugins: {
                legend: {
                  display: true,
                  position: "top" as const,
                  labels: { font: { size: 11 }, padding: 10, boxWidth: 14 }
                }
              },
              scales: {
                x: {
                  ...COMMON_CHART_OPTIONS.scales.x,
                  stacked: true,
                  title: { display: true, text: "Date" }
                },
                y: {
                  ...COMMON_CHART_OPTIONS.scales.y,
                  stacked: true,
                  title: { display: true, text: "Activity Count" },
                  beginAtZero: true
                }
              }
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default SocialEngagementTimelineChart;
