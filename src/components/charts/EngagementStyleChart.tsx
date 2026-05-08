import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { useTranslations } from "next-intl";
import React, { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";

import DownloadButtons from "@components/charts/DownloadButtons";
import {
  FEEDBACK_SECTION_ACCENT,
  FEEDBACK_SECTION_CHART_RECEIVED,
  FEEDBACK_SECTION_CHART_SENT,
  FEEDBACK_SECTION_TEXT_MAIN as TEXT_MAIN,
  FEEDBACK_SECTION_TEXT_MUTED as TEXT_MUTED
} from "@components/charts/feedbackSectionTheme";
import { CommentStats, PostStats, ReactionStats } from "@models/graphData";

ChartJS.register(ArcElement, Tooltip, Legend);

interface EngagementStyleChartProps {
  postStats?: PostStats;
  commentStats?: CommentStats;
  reactionStats?: ReactionStats;
}

type ArchetypeKey = "creator" | "observer" | "conversationalist" | "consumer" | "balanced";

function getEngagementArchetypeKey(posts: number, comments: number, reactions: number): ArchetypeKey {
  const total = posts + comments + reactions;
  if (total === 0) return "balanced";

  const postPct = posts / total;
  const commentPct = comments / total;
  const reactionPct = reactions / total;

  if (postPct >= 0.5) return "creator";
  if (reactionPct >= 0.6) return "observer";
  if (commentPct >= 0.4) return "conversationalist";
  if (commentPct + reactionPct >= 0.8) return "consumer";
  return "balanced";
}

const ARCHETYPE_LABEL: Record<ArchetypeKey, string> = {
  creator: "styleArchetypeCreator",
  observer: "styleArchetypeObserver",
  conversationalist: "styleArchetypeConversationalist",
  consumer: "styleArchetypeConsumer",
  balanced: "styleArchetypeBalanced"
};

const ARCHETYPE_DESC: Record<ArchetypeKey, string> = {
  creator: "styleArchetypeCreatorDesc",
  observer: "styleArchetypeObserverDesc",
  conversationalist: "styleArchetypeConversationalistDesc",
  consumer: "styleArchetypeConsumerDesc",
  balanced: "styleArchetypeBalancedDesc"
};

const EngagementStyleChart: React.FC<EngagementStyleChartProps> = ({ postStats, commentStats, reactionStats }) => {
  const t = useTranslations("feedback.socialContent");
  const CHART_NAME = "engagement-style-chart";
  const containerId = `chart-wrapper-${CHART_NAME}`;

  const totalPosts = postStats?.totalPosts ?? 0;
  const totalComments = commentStats?.totalComments ?? 0;
  const totalReactions = reactionStats?.totalReactions ?? 0;
  const total = totalPosts + totalComments + totalReactions;

  /** Always three slices: comments, reactions, posts (matches legend and platform copy). */
  const segmentMeta = useMemo(
    () =>
      [
        {
          label: t("styleDonutLegendComments"),
          value: totalComments,
          color: alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.92),
          border: alpha(FEEDBACK_SECTION_CHART_RECEIVED, 1)
        },
        {
          label: t("styleDonutLegendReactions"),
          value: totalReactions,
          color: alpha(FEEDBACK_SECTION_CHART_SENT, 0.9),
          border: alpha(FEEDBACK_SECTION_CHART_SENT, 1)
        },
        {
          label: t("styleDonutLegendPosts"),
          value: totalPosts,
          color: alpha(FEEDBACK_SECTION_ACCENT, 0.88),
          border: alpha(FEEDBACK_SECTION_ACCENT, 1)
        }
      ] as const,
    [t, totalComments, totalReactions, totalPosts]
  );

  const archetypeKey = getEngagementArchetypeKey(totalPosts, totalComments, totalReactions);
  const archetypeLabel = t(ARCHETYPE_LABEL[archetypeKey]);
  const archetypeDescription = t(ARCHETYPE_DESC[archetypeKey]);

  const doughnutData = useMemo(
    () => ({
      labels: segmentMeta.map(s => s.label),
      datasets: [
        {
          data: segmentMeta.map(s => s.value),
          backgroundColor: segmentMeta.map(s => s.color),
          borderColor: segmentMeta.map(s => s.border),
          borderWidth: 1.5,
          hoverOffset: 6
        }
      ]
    }),
    [segmentMeta]
  );

  const centerTextPlugin = useMemo(
    () => ({
      id: "centerText",
      beforeDraw(chart: any) {
        if (total === 0) return;
        const { ctx, width, height } = chart;
        ctx.save();
        ctx.font = "600 15px 'Inter', system-ui, sans-serif";
        ctx.fillStyle = TEXT_MAIN;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(archetypeLabel, width / 2, height / 2);
        ctx.restore();
      }
    }),
    [archetypeLabel, total]
  );

  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 1, sm: 3 }}
        justifyContent="center"
        alignItems="center"
        sx={{ mb: 2, flexWrap: "wrap" }}
      >
        <Typography variant="body2" sx={{ color: TEXT_MAIN, fontWeight: 700, fontSize: { xs: "0.9rem", sm: "0.95rem" } }}>
          {t("styleCountComments", { count: totalComments })}
        </Typography>
        <Typography variant="body2" sx={{ color: TEXT_MAIN, fontWeight: 700, fontSize: { xs: "0.9rem", sm: "0.95rem" } }}>
          {t("styleCountReactions", { count: totalReactions })}
        </Typography>
        <Typography variant="body2" sx={{ color: TEXT_MAIN, fontWeight: 700, fontSize: { xs: "0.9rem", sm: "0.95rem" } }}>
          {t("styleCountPosts", { count: totalPosts })}
        </Typography>
      </Stack>

      <Box id={containerId} sx={{ position: "relative", px: { xs: 0.5, sm: 1 } }}>
        <Box display="flex" justifyContent="flex-end" alignItems="center" sx={{ position: "absolute", top: 0, right: 0, zIndex: 1 }}>
          <DownloadButtons chartId={containerId} fileNamePrefix={CHART_NAME} />
        </Box>
        {total === 0 ? (
          <Typography variant="body2" sx={{ textAlign: "center", color: TEXT_MUTED, py: 4 }}>
            {t("styleDonutNoData")}
          </Typography>
        ) : (
          <Box sx={{ width: "100%", height: { xs: 260, sm: 300 }, maxWidth: 420, mx: "auto", pt: 1 }}>
            <Doughnut
              data={doughnutData}
              plugins={[centerTextPlugin]}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: "58%",
                plugins: {
                  legend: {
                    display: true,
                    position: "right",
                    labels: {
                      color: TEXT_MAIN,
                      font: { size: 12, weight: "600" },
                      padding: 12,
                      boxWidth: 14,
                      usePointStyle: true,
                      pointStyle: "rectRounded"
                    }
                  },
                  tooltip: {
                    backgroundColor: alpha(TEXT_MAIN, 0.92),
                    titleColor: "#f8fafc",
                    bodyColor: "#f8fafc",
                    borderColor: alpha("#ffffff", 0.12),
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                      label: (context: any) => {
                        const raw = context.raw as number;
                        const pct = total > 0 ? ((raw / total) * 100).toFixed(1) : "0";
                        return `${context.label}: ${raw} (${pct}%)`;
                      }
                    }
                  }
                }
              }}
            />
          </Box>
        )}
      </Box>

      {total > 0 && archetypeDescription && (
        <Typography variant="body2" sx={{ mt: 2, textAlign: "center", px: 1, color: TEXT_MUTED, lineHeight: 1.55 }}>
          {archetypeDescription}
        </Typography>
      )}
    </Box>
  );
};

export default EngagementStyleChart;
