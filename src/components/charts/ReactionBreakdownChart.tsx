import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from "chart.js";
import React from "react";
import { Bar, Doughnut } from "react-chartjs-2";

import { CHART_COLORS, CHART_LAYOUT, COMMON_CHART_OPTIONS } from "@components/charts/chartConfig";
import DownloadButtons from "@components/charts/DownloadButtons";
import { ReactionStats } from "@models/graphData";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const REACTION_COLORS = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40", "#C9CBCF", "#7BC8A4", "#E7E9ED", "#F7464A"];

interface ReactionBreakdownChartProps {
  reactionStats: ReactionStats;
}

const ReactionBreakdownChart: React.FC<ReactionBreakdownChartProps> = ({ reactionStats }) => {
  const CHART_NAME = "reaction-breakdown-chart";
  const containerId = `chart-wrapper-${CHART_NAME}`;
  const timelineContainerId = `chart-wrapper-${CHART_NAME}-timeline`;

  const sortedReactions = Object.entries(reactionStats.reactionTypeBreakdown).sort((a, b) => b[1] - a[1]);

  const topReactions = sortedReactions.slice(0, 10);

  const doughnutData = {
    labels: topReactions.map(([type]) => type),
    datasets: [
      {
        data: topReactions.map(([, count]) => count),
        backgroundColor: REACTION_COLORS.slice(0, topReactions.length),
        borderWidth: 1
      }
    ]
  };

  const timelineData = {
    labels: reactionStats.reactionsOverTime.map(r => new Date(Date.UTC(r.year, r.month - 1, r.date)).toISOString().slice(0, 10)),
    datasets: [
      {
        label: "Reactions",
        data: reactionStats.reactionsOverTime.map(r => r.sentCount),
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
            {reactionStats.totalReactions}
          </Typography>
          <Typography variant="caption">Total Reactions</Typography>
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" fontWeight="bold">
            {sortedReactions.length}
          </Typography>
          <Typography variant="caption">Reaction Types</Typography>
        </Box>
        {sortedReactions.length > 0 && (
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h5" fontWeight="bold">
              {sortedReactions[0][0]}
            </Typography>
            <Typography variant="caption">Most Used ({sortedReactions[0][1]}x)</Typography>
          </Box>
        )}
      </Stack>

      {/* Reaction type breakdown doughnut */}
      <Box id={containerId} position="relative" p={CHART_LAYOUT.paddingX}>
        <Box display="flex" justifyContent="right" alignItems="center" mb={1}>
          <DownloadButtons chartId={containerId} fileNamePrefix={`${CHART_NAME}-breakdown`} />
        </Box>
        <Box sx={{ width: "100%", height: CHART_LAYOUT.responsiveChartHeight, maxWidth: 400, mx: "auto" }}>
          <Doughnut
            data={doughnutData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                  position: "right" as const,
                  labels: { font: { size: 11 }, padding: 8, boxWidth: 14 }
                },
                tooltip: {
                  callbacks: {
                    label: (context: any) => {
                      const pct = ((context.raw / reactionStats.totalReactions) * 100).toFixed(1);
                      return `${context.label}: ${context.raw} (${pct}%)`;
                    }
                  }
                }
              }
            }}
          />
        </Box>
      </Box>

      {/* Reactions over time */}
      <Box id={timelineContainerId} position="relative" p={CHART_LAYOUT.paddingX} sx={{ mt: 3 }}>
        <Typography variant="body1" fontWeight="bold" sx={{ mb: 1, textAlign: "center" }}>
          Reactions Over Time
        </Typography>
        <Box display="flex" justifyContent="right" alignItems="center" mb={1}>
          <DownloadButtons chartId={timelineContainerId} fileNamePrefix={`${CHART_NAME}-timeline`} />
        </Box>
        <Box sx={{ width: "100%", height: CHART_LAYOUT.responsiveChartHeight }}>
          <Bar
            data={timelineData}
            options={{
              ...COMMON_CHART_OPTIONS,
              scales: {
                x: {
                  ...COMMON_CHART_OPTIONS.scales.x,
                  title: { display: true, text: "Date" }
                },
                y: {
                  ...COMMON_CHART_OPTIONS.scales.y,
                  title: { display: true, text: "Number of Reactions" },
                  beginAtZero: true
                }
              },
              plugins: {
                ...COMMON_CHART_OPTIONS.plugins,
                tooltip: {
                  callbacks: {
                    label: (context: any) => `${context.raw} reaction(s)`
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

export default ReactionBreakdownChart;
