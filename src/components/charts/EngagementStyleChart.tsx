import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import React from "react";
import { Doughnut } from "react-chartjs-2";

import { CHART_LAYOUT } from "@components/charts/chartConfig";
import DownloadButtons from "@components/charts/DownloadButtons";
import { CommentStats, PostStats, ReactionStats } from "@models/graphData";

ChartJS.register(ArcElement, Tooltip, Legend);

interface EngagementStyleChartProps {
  postStats?: PostStats;
  commentStats?: CommentStats;
  reactionStats?: ReactionStats;
}

const SEGMENT_COLORS = {
  posts: "#4BC0C0",
  comments: "#36A2EB",
  reactions: "#FF6384"
};

function getEngagementLabel(posts: number, comments: number, reactions: number): { label: string; description: string } {
  const total = posts + comments + reactions;
  if (total === 0) return { label: "", description: "" };

  const postPct = posts / total;
  const commentPct = comments / total;
  const reactionPct = reactions / total;

  if (postPct >= 0.5) {
    return {
      label: "Creator",
      description: "Most of your activity comes from creating original posts."
    };
  }
  if (reactionPct >= 0.6) {
    return {
      label: "Observer",
      description: "You engage primarily through reactions -- quick, lightweight interactions."
    };
  }
  if (commentPct >= 0.4) {
    return {
      label: "Conversationalist",
      description: "You prefer engaging through comments and conversations with others."
    };
  }
  if (commentPct + reactionPct >= 0.8) {
    return {
      label: "Consumer",
      description: "Most of your activity comes from reacting to and commenting on others' content."
    };
  }
  return {
    label: "Balanced",
    description: "You have a well-rounded engagement style across creating, commenting, and reacting."
  };
}

const EngagementStyleChart: React.FC<EngagementStyleChartProps> = ({ postStats, commentStats, reactionStats }) => {
  const CHART_NAME = "engagement-style-chart";
  const containerId = `chart-wrapper-${CHART_NAME}`;

  const totalPosts = postStats?.totalPosts ?? 0;
  const totalComments = commentStats?.totalComments ?? 0;
  const totalReactions = reactionStats?.totalReactions ?? 0;
  const total = totalPosts + totalComments + totalReactions;

  const segments: { label: string; value: number; color: string }[] = [];
  if (totalPosts > 0) segments.push({ label: "Posts", value: totalPosts, color: SEGMENT_COLORS.posts });
  if (totalComments > 0) segments.push({ label: "Comments", value: totalComments, color: SEGMENT_COLORS.comments });
  if (totalReactions > 0) segments.push({ label: "Reactions", value: totalReactions, color: SEGMENT_COLORS.reactions });

  const doughnutData = {
    labels: segments.map(s => s.label),
    datasets: [
      {
        data: segments.map(s => s.value),
        backgroundColor: segments.map(s => s.color),
        borderWidth: 1
      }
    ]
  };

  const { label: styleLabel, description: styleDescription } = getEngagementLabel(totalPosts, totalComments, totalReactions);

  const centerTextPlugin = {
    id: "centerText",
    beforeDraw(chart: any) {
      const { ctx, width, height } = chart;
      ctx.save();
      ctx.font = "bold 18px sans-serif";
      ctx.fillStyle = "#333";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(styleLabel, width / 2, height / 2);
      ctx.restore();
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={3} justifyContent="center" flexWrap="wrap" sx={{ mb: 2 }}>
        {segments.map(s => (
          <Box key={s.label} sx={{ textAlign: "center" }}>
            <Typography variant="h5" fontWeight="bold" sx={{ color: s.color }}>
              {total > 0 ? `${((s.value / total) * 100).toFixed(0)}%` : "0%"}
            </Typography>
            <Typography variant="caption">{s.label}</Typography>
          </Box>
        ))}
      </Stack>

      <Box id={containerId} position="relative" p={CHART_LAYOUT.paddingX}>
        <Box display="flex" justifyContent="right" alignItems="center" mb={1}>
          <DownloadButtons chartId={containerId} fileNamePrefix={CHART_NAME} />
        </Box>
        <Box sx={{ width: "100%", height: CHART_LAYOUT.responsiveChartHeight, maxWidth: 400, mx: "auto" }}>
          <Doughnut
            data={doughnutData}
            plugins={[centerTextPlugin]}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: "55%",
              plugins: {
                legend: {
                  display: true,
                  position: "right" as const,
                  labels: { font: { size: 11 }, padding: 8, boxWidth: 14 }
                },
                tooltip: {
                  callbacks: {
                    label: (context: any) => {
                      const pct = total > 0 ? ((context.raw / total) * 100).toFixed(1) : "0";
                      return `${context.label}: ${context.raw} (${pct}%)`;
                    }
                  }
                }
              }
            }}
          />
        </Box>
      </Box>

      {styleDescription && (
        <Typography variant="body2" sx={{ mt: 2, textAlign: "center", px: 2, fontStyle: "italic" }}>
          {styleDescription}
        </Typography>
      )}
    </Box>
  );
};

export default EngagementStyleChart;
