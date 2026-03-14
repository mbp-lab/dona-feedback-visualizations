import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, TimeScale, Tooltip } from "chart.js";
import "chartjs-adapter-date-fns";
import React from "react";
import { Bar } from "react-chartjs-2";

import { CHART_COLORS, CHART_LAYOUT, COMMON_CHART_OPTIONS } from "@components/charts/chartConfig";
import DownloadButtons from "@components/charts/DownloadButtons";
import { CommentStats } from "@models/graphData";

ChartJS.register(BarElement, CategoryScale, LinearScale, TimeScale, Tooltip, Legend);

interface CommentActivityChartProps {
  commentStats: CommentStats;
}

const CommentActivityChart: React.FC<CommentActivityChartProps> = ({ commentStats }) => {
  const CHART_NAME = "comment-activity-chart";
  const containerId = `chart-wrapper-${CHART_NAME}`;

  const chartData = {
    labels: commentStats.commentsOverTime.map(c => new Date(Date.UTC(c.year, c.month - 1, c.date)).toISOString().slice(0, 10)),
    datasets: [
      {
        label: "Comments",
        data: commentStats.commentsOverTime.map(c => c.sentCount),
        backgroundColor: CHART_COLORS.secondary,
        maxBarThickness: CHART_LAYOUT.maxBarThickness
      }
    ]
  };

  return (
    <Box>
      <Stack direction="row" spacing={3} justifyContent="center" sx={{ mb: 2 }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" fontWeight="bold">
            {commentStats.totalComments}
          </Typography>
          <Typography variant="caption">Total Comments</Typography>
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" fontWeight="bold">
            {commentStats.avgWordsPerComment}
          </Typography>
          <Typography variant="caption">Avg Words/Comment</Typography>
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" fontWeight="bold">
            {commentStats.totalWords}
          </Typography>
          <Typography variant="caption">Total Words</Typography>
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
                  title: { display: true, text: "Number of Comments" },
                  beginAtZero: true
                }
              },
              plugins: {
                ...COMMON_CHART_OPTIONS.plugins,
                tooltip: {
                  callbacks: {
                    label: (context: any) => `${context.raw} comment(s)`
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

export default CommentActivityChart;
