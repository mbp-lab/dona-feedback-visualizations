"use client";

import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";

import EventComparisonChart from "@components/charts/EventComparisonChart";
import SentReceivedSlidingWindowChart from "@components/charts/SentReceivedSlidingWindowChart";
import {
  FEEDBACK_SECTION_CHART_RECEIVED,
  FEEDBACK_SECTION_CHART_SENT,
  FEEDBACK_SECTION_TEXT_MAIN as TEXT_MAIN,
  FEEDBACK_SECTION_TEXT_MUTED as TEXT_MUTED,
  feedbackChartPaletteHeaderStripSx,
  feedbackChartPaletteIconBoxSx,
  feedbackChartPaletteOuterSx,
  feedbackSectionBodySx,
  feedbackPlotPanelSx
} from "@components/charts/feedbackSectionTheme";
import { DailyHourPoint, GraphData } from "@models/graphData";

const toMessageData = (points: DailyHourPoint[]) =>
  points.map(p => ({
    dateTime: new Date(p.year, p.month - 1, p.date, p.hour, p.minute),
    wordCount: p.wordCount
  }));

interface LifeEventActivitySectionProps {
  graphData: GraphData;
}

/**
 * Life-event analysis: date controls, word trend, metrics, and timeline.
 */
export default function LifeEventActivitySection({ graphData }: LifeEventActivitySectionProps) {
  const t = useTranslations("feedback.lifeEventActivity");
  const ii = useTranslations("feedback.interactionIntensity");

  return (
    <Box sx={{ ...feedbackChartPaletteOuterSx, mt: 2 }}>
      <Box aria-hidden sx={{ display: "flex", height: 4, width: "100%" }}>
        <Box sx={{ flex: 1, bgcolor: FEEDBACK_SECTION_CHART_SENT }} />
        <Box sx={{ flex: 1, bgcolor: FEEDBACK_SECTION_CHART_RECEIVED }} />
      </Box>
      <Box sx={feedbackChartPaletteHeaderStripSx}>
        <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="center" sx={{ mb: 1 }}>
          <Box sx={feedbackChartPaletteIconBoxSx}>
            <EventNoteOutlinedIcon sx={{ fontSize: 26, color: FEEDBACK_SECTION_CHART_SENT }} />
          </Box>
          <Box sx={{ textAlign: "left" }}>
            <Typography
              variant="overline"
              sx={{
                display: "block",
                letterSpacing: "0.2em",
                fontWeight: 700,
                fontSize: "0.65rem",
                color: FEEDBACK_SECTION_CHART_SENT
              }}
            >
              {t("cardOverline")}
            </Typography>
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: TEXT_MAIN,
                fontSize: { xs: "1.45rem", sm: "1.85rem" },
                lineHeight: 1.2
              }}
            >
              {t("title")}
            </Typography>
          </Box>
        </Stack>
        <Typography
          variant="body2"
          sx={{
            textAlign: "center",
            color: TEXT_MUTED,
            maxWidth: 720,
            mx: "auto",
            lineHeight: 1.65,
            px: 0.5
          }}
        >
          {t("intro")}
        </Typography>
      </Box>
      <Box sx={feedbackSectionBodySx}>
        <Box sx={{ ...feedbackPlotPanelSx, p: { xs: 1.5, sm: 2 } }}>
          <EventComparisonChart
            hideSectionIntro
            chartSlotLeftTitle={ii("wordCountSlidingWindowMean.title")}
            chartSlotLeft={
              <SentReceivedSlidingWindowChart
                slidingWindowMeanDailyWords={graphData.slidingWindowMeanDailyWords}
                mode="text"
                expandToContainer
              />
            }
            sentMessages={toMessageData(graphData.dailySentHours)}
            receivedMessages={toMessageData(graphData.dailyReceivedHours)}
            perChatSentMessages={graphData.dailySentHoursPerConversation.map((points, i) => ({
              chatName: graphData.focusConversations[i] ?? `Chat ${i + 1}`,
              messages: toMessageData(points)
            }))}
            defaultWindowDays={30}
          />
        </Box>
      </Box>
    </Box>
  );
}
