"use client";

import React, { useEffect, useState } from "react";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Fade from "@mui/material/Fade";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import SwipeableViews from "react-swipeable-views";
import { useLocale, useTranslations } from "next-intl";

import {
  FEEDBACK_SECTION_CHART_RECEIVED,
  FEEDBACK_SECTION_CHART_RECEIVED_HOVER,
  FEEDBACK_SECTION_CHART_SENT,
  FEEDBACK_SECTION_CHART_SENT_HOVER,
  FEEDBACK_SECTION_SURFACE as SURFACE,
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

const SLIDE_MIN_HEIGHT = 460;

export default function ChatActivitySection({ graphData }: ChatActivitySectionProps) {
  const t = useTranslations("feedback.chatActivity");
  const carouselNav = useTranslations("feedback.comparisonCarousel");
  const locale = useLocale();
  const [activeStep, setActiveStep] = useState(0);
  const [summaryPickIndex, setSummaryPickIndex] = useState(0);

  const podium = graphData.topContactsPodium;
  const hasPodium = Array.isArray(podium) && podium.length > 0;
  const race = graphData.replyTimeRace;
  const hasRace = Array.isArray(race) && race.length > 0;
  const raceWinnerName = hasRace && race![0]?.name ? race![0].name : "";
  const chatSummaries = graphData.chatSummaries ?? [];
  const hasSummaries = chatSummaries.length > 0;

  const maxSteps = [hasPodium, hasRace, hasSummaries].filter(Boolean).length;

  useEffect(() => {
    if (maxSteps === 0) return;
    setActiveStep(s => Math.min(s, maxSteps - 1));
  }, [maxSteps]);

  useEffect(() => {
    if (chatSummaries.length === 0) return;
    setSummaryPickIndex(i => Math.min(i, chatSummaries.length - 1));
  }, [chatSummaries.length]);

  const slideShell = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    minHeight: SLIDE_MIN_HEIGHT,
    p: 3,
    textAlign: "center",
    color: TEXT_MAIN,
    borderLeft: `1px solid ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.22)}`,
    borderRight: `1px solid ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.22)}`,
    bgcolor: SURFACE
  } as const;

  const stopPropagationHandlers = {
    onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
    onTouchStart: (e: React.TouchEvent) => e.stopPropagation()
  };

  const statRow = (text: string, icon: React.ReactNode) => (
    <Paper
      elevation={0}
      sx={{
        p: 2.25,
        borderRadius: 2.5,
        bgcolor: "#ffffff",
        border: `1px solid ${alpha(TEXT_MAIN, 0.08)}`,
        display: "flex",
        gap: 2,
        alignItems: "flex-start",
        textAlign: "left",
        transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          borderColor: FEEDBACK_SECTION_CHART_SENT,
          boxShadow: `0 10px 28px -12px ${alpha(TEXT_MAIN, 0.12)}`,
          transform: "translateY(-1px)"
        }
      }}
    >
      <Box
        sx={{
          width: 44,
          minWidth: 44,
          height: 44,
          borderRadius: "14px",
          bgcolor: FEEDBACK_SECTION_CHART_SENT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {icon}
      </Box>
      <Typography variant="body1" sx={{ lineHeight: 1.55, color: TEXT_MAIN, pt: 0.35, fontWeight: 400 }}>
        {text}
      </Typography>
    </Paper>
  );

  const slides: React.ReactNode[] = [];
  if (hasPodium) {
    slides.push(
      <Box
        key="podium"
        sx={{
          ...slideShell,
          pt: 2.5,
          alignItems: "stretch",
          height: SLIDE_MIN_HEIGHT,
          boxSizing: "border-box"
        }}
        {...stopPropagationHandlers}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, textAlign: "center", color: TEXT_MAIN }}>
          {t("topContactsTitle")}
        </Typography>
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 560 }}>
            <TopContactsPodium podiumData={podium!} />
          </Box>
        </Box>
        <Typography variant="body2" sx={{ mt: 1.5, textAlign: "center", fontStyle: "italic", color: TEXT_MUTED }}>
          {t("topContactsFootnote")}
        </Typography>
      </Box>
    );
  }
  if (hasRace) {
    slides.push(
      <Box
        key="race"
        sx={{
          ...slideShell,
          pt: 2.5,
          alignItems: "stretch",
          height: SLIDE_MIN_HEIGHT,
          boxSizing: "border-box"
        }}
        {...stopPropagationHandlers}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, textAlign: "center", color: TEXT_MAIN }}>
          {t("replyRaceTitle")}
        </Typography>
        {raceWinnerName ? (
          <Typography sx={{ textAlign: "center", mb: 1, color: TEXT_MUTED }}>
            {t("replyRaceSubtitle", { winner: raceWinnerName })}
          </Typography>
        ) : null}
        <Box sx={{ flex: 1, minHeight: 0, width: "100%", display: "flex", flexDirection: "column" }}>
          <ReplyTimeRace raceData={race!} />
        </Box>
      </Box>
    );
  }
  if (hasSummaries) {
    const safeIndex = Math.min(summaryPickIndex, Math.max(0, chatSummaries.length - 1));
    const summary = chatSummaries[safeIndex]!;
    slides.push(
      <Box key="summaries" sx={{ ...slideShell, pt: 2, px: { xs: 1.5, sm: 3 }, pb: 3 }} {...stopPropagationHandlers}>
        <Box sx={{ width: "100%", maxWidth: 560, mb: 2, display: "flex", justifyContent: "flex-start", alignSelf: "stretch" }}>
          <TextField
            select
            size="small"
            label={t("summariesConversationLabel")}
            value={safeIndex}
            onChange={e => setSummaryPickIndex(Number(e.target.value))}
            SelectProps={{ autoWidth: true }}
            sx={{
              width: "fit-content",
              maxWidth: "100%",
              "& .MuiOutlinedInput-root": {
                width: "fit-content",
                maxWidth: "100%",
                borderRadius: 2,
                color: TEXT_MAIN,
                bgcolor: "#ffffff",
                transition: "box-shadow 0.2s ease, background-color 0.2s ease",
                "& fieldset": { borderColor: alpha(TEXT_MAIN, 0.12) },
                "&:hover fieldset": { borderColor: alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.35) },
                "&.Mui-focused fieldset": { borderColor: FEEDBACK_SECTION_CHART_SENT, borderWidth: "1px" },
                "&.Mui-focused": {
                  bgcolor: "#ffffff",
                  boxShadow: `0 0 0 3px ${alpha(FEEDBACK_SECTION_CHART_SENT, 0.22)}`
                }
              },
              "& .MuiSvgIcon-root": { color: TEXT_MUTED },
              "& .MuiInputLabel-root": { color: TEXT_MUTED, fontSize: "0.875rem" },
              "& .MuiInputLabel-root.Mui-focused": { color: FEEDBACK_SECTION_CHART_SENT },
              "& .MuiSelect-select": {
                minWidth: 0,
                whiteSpace: "nowrap",
                overflow: "visible",
                textOverflow: "clip",
                width: "auto"
              }
            }}
          >
            {chatSummaries.map((s, i) => (
              <MenuItem key={i} value={i} sx={{ py: 1, whiteSpace: "nowrap" }}>
                {s.chatName}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, color: TEXT_MAIN }}>
          {t("summariesSlideTitle")}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, color: TEXT_MUTED, maxWidth: 420, lineHeight: 1.55 }}>
          {t("summariesSlideIntro")}
        </Typography>
        <Fade in timeout={220} key={`${safeIndex}-${activeStep}`}>
          <Box sx={{ width: "100%", maxWidth: 560 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                textAlign: "center",
                color: TEXT_MAIN,
                mb: 2.5,
                px: 1,
                lineHeight: 1.35,
                fontSize: { xs: "1.1rem", sm: "1.3rem" }
              }}
            >
              {summary.chatName}
            </Typography>
            <Stack spacing={2} sx={{ width: "100%" }}>
              {statRow(
                t("summariesStatMessagesWords", {
                  messages: summary.donorSentMessages.toLocaleString(locale),
                  words: summary.donorSentWords.toLocaleString(locale)
                }),
                <ForumOutlinedIcon sx={{ color: "#ffffff", fontSize: 24 }} />
              )}
              {statRow(
                t("summariesStatQuickReply", { percent: String(summary.quickReplyPercentage) }),
                <BoltOutlinedIcon sx={{ color: "#ffffff", fontSize: 24 }} />
              )}
              {statRow(
                t("summariesStatStreak", { days: String(summary.longestStreak) }),
                <LocalFireDepartmentOutlinedIcon sx={{ color: "#ffffff", fontSize: 24 }} />
              )}
            </Stack>
          </Box>
        </Fade>
      </Box>
    );
  }

  if (maxSteps === 0) {
    return null;
  }

  const handleNext = () => setActiveStep(prev => (prev + 1) % maxSteps);
  const handleBack = () => setActiveStep(prev => (prev - 1 + maxSteps) % maxSteps);
  const handleStepChange = (step: number) => setActiveStep(step);

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
      </Box>

      <Box sx={{ ...feedbackSectionBodySx, py: 0, px: 0 }}>
        <SwipeableViews axis="x" index={activeStep} onChangeIndex={handleStepChange} enableMouseEvents>
          {slides}
        </SwipeableViews>
        {maxSteps > 1 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 2,
              bgcolor: alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.06),
              borderTop: `1px solid ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.22)}`
            }}
          >
            <Button
              onClick={handleBack}
              variant="contained"
              sx={{
                bgcolor: FEEDBACK_SECTION_CHART_RECEIVED,
                "&:hover": { bgcolor: FEEDBACK_SECTION_CHART_RECEIVED_HOVER }
              }}
            >
              {carouselNav("back")}
            </Button>
            <Box sx={{ display: "flex", gap: 1 }}>
              {[...Array(maxSteps)].map((_, index) => (
                <Box
                  key={index}
                  onClick={() => handleStepChange(index)}
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: activeStep === index ? FEEDBACK_SECTION_CHART_SENT : alpha(TEXT_MAIN, 0.14),
                    cursor: "pointer",
                    transition: "background-color 0.3s, transform 0.2s",
                    transform: activeStep === index ? "scale(1.12)" : "scale(1)",
                    boxShadow: activeStep === index ? `0 0 0 2px ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.4)}` : "none"
                  }}
                />
              ))}
            </Box>
            <Button
              onClick={handleNext}
              variant="contained"
              sx={{
                bgcolor: FEEDBACK_SECTION_CHART_SENT,
                "&:hover": { bgcolor: FEEDBACK_SECTION_CHART_SENT_HOVER }
              }}
            >
              {carouselNav("next")}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
