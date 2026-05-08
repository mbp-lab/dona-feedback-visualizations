"use client";

import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useTranslations } from "next-intl";

import {
  FEEDBACK_SECTION_CHART_RECEIVED,
  FEEDBACK_SECTION_CHART_SENT,
  FEEDBACK_SECTION_TEXT_MAIN as TEXT_MAIN,
  FEEDBACK_SECTION_TEXT_MUTED as TEXT_MUTED,
  feedbackChartPaletteHeaderStripSx,
  feedbackChartPaletteIconBoxSx,
  feedbackChartPaletteOuterSx,
  feedbackSectionBodySx
} from "@components/charts/feedbackSectionTheme";
import ReplyTimeRace from "@components/charts/ReplyTimeRace";
import TopContactsPodium from "@components/charts/TopContactsPodium";
import { GraphData } from "@models/graphData";

interface ChatActivitySectionProps {
  graphData: GraphData;
}

/**
 * Top contacts podium + reply-time race, in the same chrome as chat summaries.
 */
export default function ChatActivitySection({ graphData }: ChatActivitySectionProps) {
  const t = useTranslations("feedback.chatActivity");

  const podium = graphData.topContactsPodium;
  const hasPodium = Array.isArray(podium) && podium.length > 0;
  const race = graphData.replyTimeRace;
  const hasRace = Array.isArray(race) && race.length > 0;
  const raceWinnerName = hasRace && race![0]?.name ? race![0].name : "";

  if (!hasPodium && !hasRace) {
    return null;
  }

  /** Soft “sub-card” on the section surface — separated but not stark white. */
  const plotPanelSx = {
    width: "100%",
    p: { xs: 2, sm: 2.75 },
    borderRadius: 2.5,
    bgcolor: alpha("#ffffff", 0.52),
    border: `1px solid ${alpha(TEXT_MAIN, 0.09)}`,
    boxShadow: `0 1px 2px ${alpha(TEXT_MAIN, 0.04)}, inset 0 1px 0 ${alpha("#ffffff", 0.7)}`
  };

  return (
    <Box sx={feedbackChartPaletteOuterSx}>
      <Box aria-hidden sx={{ display: "flex", height: 4, width: "100%" }}>
        <Box sx={{ flex: 1, bgcolor: FEEDBACK_SECTION_CHART_SENT }} />
        <Box sx={{ flex: 1, bgcolor: FEEDBACK_SECTION_CHART_RECEIVED }} />
      </Box>
      <Box sx={feedbackChartPaletteHeaderStripSx}>
        <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="center" sx={{ mb: 1 }}>
          <Box sx={feedbackChartPaletteIconBoxSx}>
            <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 26, color: FEEDBACK_SECTION_CHART_SENT }} />
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
            maxWidth: 420,
            mx: "auto",
            lineHeight: 1.55
          }}
        >
          {t("cardIntro")}
        </Typography>
      </Box>

      <Box sx={feedbackSectionBodySx}>
        <Stack
          spacing={3}
          divider={
            hasPodium && hasRace ? <Divider flexItem sx={{ borderColor: alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.22) }} /> : undefined
          }
          sx={{ width: "100%" }}
        >
          {hasPodium && (
            <Box
              sx={{
                ...plotPanelSx,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minHeight: 280
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, textAlign: "center", color: TEXT_MAIN }}>
                {t("topContactsTitle")}
              </Typography>
              <Box sx={{ width: "100%", maxWidth: 520, flex: 1 }}>
                <TopContactsPodium podiumData={podium} />
              </Box>
              <Typography variant="body2" sx={{ mt: 2, textAlign: "center", fontStyle: "italic", color: TEXT_MUTED }}>
                {t("topContactsFootnote")}
              </Typography>
            </Box>
          )}
          {hasRace && (
            <Box sx={{ ...plotPanelSx, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, textAlign: "center", color: TEXT_MAIN }}>
                {t("replyRaceTitle")}
              </Typography>
              {raceWinnerName ? (
                <Typography sx={{ textAlign: "center", mb: 1, color: TEXT_MUTED }}>
                  {t("replyRaceSubtitle", { winner: raceWinnerName })}
                </Typography>
              ) : null}
              <Box sx={{ width: "100%", maxWidth: 640 }}>
                <ReplyTimeRace raceData={race} />
              </Box>
            </Box>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
