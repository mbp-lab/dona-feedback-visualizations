import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useLocale, useTranslations } from "next-intl";
import React from "react";

import { BasicStatistics } from "@models/graphData";
import {
  FEEDBACK_SECTION_CHART_RECEIVED,
  FEEDBACK_SECTION_CHART_SENT,
  FEEDBACK_SECTION_TEXT_MAIN as TEXT_MAIN,
  FEEDBACK_SECTION_TEXT_MUTED as TEXT_MUTED,
  feedbackPlotPanelOnSurfaceSx
} from "@components/charts/feedbackSectionTheme";

const METERS_PER_POSTCARD = 0.0005;

const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return "0%";
  return `${((value / total) * 100).toFixed(0)}%`;
};

/** Decorative stacked postcards — matches feedback coral / teal palette. */
function PostcardStackIllustration({ ariaLabel }: { ariaLabel: string }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 160 120"
      role="img"
      aria-label={ariaLabel}
      sx={{
        width: { xs: 150, sm: 190 },
        height: "auto",
        flexShrink: 0,
        filter: `drop-shadow(0 10px 22px ${alpha(TEXT_MAIN, 0.12)})`
      }}
    >
      <rect
        x="12"
        y="22"
        width="118"
        height="78"
        rx="6"
        fill={alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.22)}
        stroke={alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.55)}
        strokeWidth="1.2"
        transform="rotate(-9 71 61)"
      />
      <rect
        x="22"
        y="26"
        width="118"
        height="78"
        rx="6"
        fill={alpha(FEEDBACK_SECTION_CHART_SENT, 0.14)}
        stroke={alpha(FEEDBACK_SECTION_CHART_SENT, 0.45)}
        strokeWidth="1.2"
        transform="rotate(7 81 65)"
      />
      <rect
        x="26"
        y="20"
        width="118"
        height="78"
        rx="6"
        fill="#fffbf7"
        stroke={alpha(TEXT_MAIN, 0.15)}
        strokeWidth="1.35"
        transform="rotate(-2.5 85 59)"
      />
      <rect x="108" y="26" width="24" height="28" rx="2.5" fill={alpha(FEEDBACK_SECTION_CHART_SENT, 0.5)} transform="rotate(-2.5 85 59)" />
      <line
        x1="38"
        y1="52"
        x2="98"
        y2="52"
        stroke={alpha(TEXT_MAIN, 0.08)}
        strokeWidth="2"
        strokeLinecap="round"
        transform="rotate(-2.5 85 59)"
      />
      <line
        x1="38"
        y1="64"
        x2="88"
        y2="64"
        stroke={alpha(TEXT_MAIN, 0.06)}
        strokeWidth="2"
        strokeLinecap="round"
        transform="rotate(-2.5 85 59)"
      />
    </Box>
  );
}

/** Merged “Total messages” panel: postcard hero + sent/received (+ type breakdown). For use inside {@link GeneralInfoCarousel}. */
export function StatisticsSummaryPanel({
  stats,
  isWhatsApp = false,
  fillHeight = false
}: {
  stats: BasicStatistics;
  isWhatsApp?: boolean;
  /** Expand vertically to fill carousel slide (flex); postcard band grows. */
  fillHeight?: boolean;
}) {
  const t = useTranslations("feedback.statisticsCard");
  const locale = useLocale();
  const thousandSeparator = t("thousandSeparator");

  const formatWithSeparator = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
  };

  const sentTotal = stats.messagesTotal.allMessages.sent;
  const sentFmt = sentTotal.toLocaleString(locale);
  const pileMeters = Math.floor(METERS_PER_POSTCARD * sentTotal);

  const renderStatBox = (value: number, label: string, caption: string, variant: "sent" | "received") => {
    const accent = variant === "sent" ? FEEDBACK_SECTION_CHART_SENT : FEEDBACK_SECTION_CHART_RECEIVED;
    return (
      <Box
        sx={{
          textAlign: "center",
          p: 2,
          borderRadius: 2,
          bgcolor: alpha(accent, 0.1),
          border: `1px solid ${alpha(accent, 0.28)}`
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, color: accent }}>
          {formatWithSeparator(value)}
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontWeight: 700, color: TEXT_MAIN, textTransform: "uppercase", letterSpacing: "0.04em", fontSize: "0.7rem" }}
        >
          {label}
        </Typography>
        <Typography variant="caption" sx={{ color: TEXT_MUTED, display: "block", mt: 0.5 }}>
          {caption}
        </Typography>
      </Box>
    );
  };

  const renderTypeBreakdownBox = (valueText: number, valueAudio: number, valueTotal: number, variant: "sent" | "received") => {
    const accent = variant === "sent" ? FEEDBACK_SECTION_CHART_SENT : FEEDBACK_SECTION_CHART_RECEIVED;
    return (
      <Box
        sx={{
          textAlign: "center",
          p: 2,
          borderRadius: 2,
          bgcolor: alpha(accent, 0.06),
          border: `1px solid ${alpha(accent, 0.22)}`
        }}
      >
        <Typography variant="body2" sx={{ color: TEXT_MAIN, fontWeight: 600, lineHeight: 1.5 }}>
          ✏️ {formatWithSeparator(valueText)} {t("text")} ({formatPercentage(valueText, valueTotal)})
        </Typography>
        <Typography variant="body2" sx={{ color: TEXT_MAIN, fontWeight: 600, lineHeight: 1.5, mt: 0.5 }}>
          🎙️ {formatWithSeparator(valueAudio)} {t("audio")} ({formatPercentage(valueAudio, valueTotal)})
        </Typography>
      </Box>
    );
  };

  const totalMessagesBoxes = [
    renderStatBox(stats.messagesTotal.allMessages.sent, t("messages"), t("sent"), "sent"),
    renderStatBox(stats.messagesTotal.allMessages.received, t("messages"), t("received"), "received"),
    ...(isWhatsApp
      ? []
      : [
          renderTypeBreakdownBox(
            stats.messagesTotal.textMessages.sent,
            stats.messagesTotal.audioMessages.sent,
            stats.messagesTotal.allMessages.sent,
            "sent"
          ),
          renderTypeBreakdownBox(
            stats.messagesTotal.textMessages.received,
            stats.messagesTotal.audioMessages.received,
            stats.messagesTotal.allMessages.received,
            "received"
          )
        ])
  ];

  return (
    <Box
      sx={{
        ...feedbackPlotPanelOnSurfaceSx,
        p: { xs: 1.5, sm: 2 },
        width: "100%",
        maxWidth: "100%",
        mx: "auto",
        ...(fillHeight && {
          height: "100%",
          minHeight: 0,
          maxHeight: "100%",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box"
        })
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 800,
          color: TEXT_MAIN,
          textAlign: "center",
          mb: 0.75,
          fontSize: "1rem",
          ...(fillHeight && { flexShrink: 0 })
        }}
      >
        {t("totalMessages")}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: TEXT_MUTED,
          textAlign: "center",
          lineHeight: 1.55,
          maxWidth: 560,
          mx: "auto",
          ...(fillHeight && { flexShrink: 0 })
        }}
      >
        {t("activeYearsExplanation_format", { years: stats.numberOfActiveYears })}
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: "center",
          justifyContent: "center",
          gap: { xs: 2, sm: 3 },
          py: fillHeight ? { xs: 1.5, sm: 2 } : { xs: 2.5, sm: 2.75 },
          mt: 1.5,
          mb: 0.5,
          borderTop: `1px solid ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.15)}`,
          borderBottom: `1px solid ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.15)}`,
          ...(fillHeight && {
            flex: "1 1 auto",
            minHeight: 0,
            height: 0
          })
        }}
      >
        <PostcardStackIllustration ariaLabel={t("postcardDecorAria")} />
        <Stack spacing={1.25} sx={{ textAlign: { xs: "center", sm: "left" }, maxWidth: 420 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: FEEDBACK_SECTION_CHART_SENT,
              fontSize: { xs: "1.2rem", sm: "1.35rem" },
              lineHeight: 1.35
            }}
          >
            {t("postcardSent_format", { count: sentFmt })}
          </Typography>
          <Typography variant="body1" sx={{ color: TEXT_MAIN, lineHeight: 1.6, fontWeight: 500 }}>
            {t("postcardStack_format", { count: sentFmt, meters: pileMeters })}
          </Typography>
        </Stack>
      </Box>

      <Grid container spacing={2} sx={{ mt: 2, ...(fillHeight && { flexShrink: 0 }) }}>
        {totalMessagesBoxes.map((box, index) => (
          <Grid key={index} size={{ xs: 6 }}>
            {box}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
