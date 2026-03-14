import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, TimeScale, Tooltip } from "chart.js";
import "chartjs-adapter-date-fns";
import React from "react";
import { Bar } from "react-chartjs-2";

import { CHART_COLORS, CHART_LAYOUT, COMMON_CHART_OPTIONS } from "@components/charts/chartConfig";
import DownloadButtons from "@components/charts/DownloadButtons";
import { PostStats } from "@models/graphData";

ChartJS.register(BarElement, CategoryScale, LinearScale, TimeScale, Tooltip, Legend);

interface PostActivityChartProps {
  postStats: PostStats;
}

const PostActivityChart: React.FC<PostActivityChartProps> = ({ postStats }) => {
  const CHART_NAME = "post-activity-chart";
  const containerId = `chart-wrapper-${CHART_NAME}`;

  const chartData = {
    labels: postStats.postsOverTime.map(p => new Date(Date.UTC(p.year, p.month - 1, p.date)).toISOString().slice(0, 10)),
    datasets: [
      {
        label: "Posts",
        data: postStats.postsOverTime.map(p => p.sentCount),
        backgroundColor: CHART_COLORS.primary,
        maxBarThickness: CHART_LAYOUT.maxBarThickness
      }
    ]
  };

  return (
    <Box>
      <Stack direction="row" spacing={3} justifyContent="center" sx={{ mb: 2 }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" fontWeight="bold">
            {postStats.totalPosts}
          </Typography>
          <Typography variant="caption">Total Posts</Typography>
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" fontWeight="bold">
            {postStats.avgWordsPerPost}
          </Typography>
          <Typography variant="caption">Avg Words/Post</Typography>
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" fontWeight="bold">
            {postStats.avgMediaPerPost}
          </Typography>
          <Typography variant="caption">Avg Media/Post</Typography>
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" fontWeight="bold">
            {postStats.totalMedia}
          </Typography>
          <Typography variant="caption">Total Media</Typography>
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
              scales: {
                x: {
                  ...COMMON_CHART_OPTIONS.scales.x,
                  title: { display: true, text: "Date" }
                },
                y: {
                  ...COMMON_CHART_OPTIONS.scales.y,
                  title: { display: true, text: "Number of Posts" },
                  beginAtZero: true
                }
              },
              plugins: {
                ...COMMON_CHART_OPTIONS.plugins,
                tooltip: {
                  callbacks: {
                    label: (context: any) => `${context.raw} post(s)`
                  }
                }
              }
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default PostActivityChart;
