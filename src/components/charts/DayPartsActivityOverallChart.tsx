import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import React from "react";
import { Bar } from "react-chartjs-2";

import { BARCHART_OPTIONS, CHART_LAYOUT, PCT_TOOLTIP, TOP_LEGEND } from "@components/charts/chartConfig";
import {
  FEEDBACK_SECTION_CHART_RECEIVED,
  FEEDBACK_SECTION_CHART_RECEIVED_HOVER,
  FEEDBACK_SECTION_CHART_SENT,
  FEEDBACK_SECTION_CHART_SENT_HOVER,
  FEEDBACK_SECTION_TEXT_MAIN as TEXT_MAIN,
  FEEDBACK_SECTION_TEXT_MUTED as TEXT_MUTED,
  feedbackPlotPanelOnSurfaceSx,
  feedbackPlotPanelSx
} from "@components/charts/feedbackSectionTheme";
import DownloadButtons from "@components/charts/DownloadButtons";
import { DailyHourPoint } from "@models/graphData";

const BUCKET_STORY_KEYS = ["bucketStoryNightOwl", "bucketStoryEarlyBird", "bucketStoryWorkingHour", "bucketStoryAfterWork"] as const;

interface DayPartsActivityOverallPlotProps {
  dailySentHours: DailyHourPoint[];
  dailyReceivedHours: DailyHourPoint[];
  /** Tighter padding and chart height for carousel slides; time/day-part labels are always shown. */
  compact?: boolean;
}

const DayPartsActivityOverallChart: React.FC<DayPartsActivityOverallPlotProps> = ({
  dailySentHours,
  dailyReceivedHours,
  compact = false
}) => {
  const CHART_NAME = "dayparts-activity-overall-barchart";
  const container_name = `chart-wrapper-${CHART_NAME}`;

  const chartTexts = useTranslations("feedback.dailyActivityTimes.dayPartsOverall");

  const buckets = ["00:00-05:59", "06:00-11:59", "12:00-17:59", "18:00-23:59"];
  const sentCounts = [0, 0, 0, 0];
  const receivedCounts = [0, 0, 0, 0];

  dailySentHours.forEach(point => {
    const bucketIndex = point.hour < 6 ? 0 : point.hour < 12 ? 1 : point.hour < 18 ? 2 : 3;
    sentCounts[bucketIndex] += point.wordCount;
  });

  dailyReceivedHours.forEach(point => {
    const bucketIndex = point.hour < 6 ? 0 : point.hour < 12 ? 1 : point.hour < 18 ? 2 : 3;
    receivedCounts[bucketIndex] += point.wordCount;
  });

  const totalSent = sentCounts.reduce((sum, count) => sum + count, 0);
  const totalReceived = receivedCounts.reduce((sum, count) => sum + count, 0);

  const barPercentage = compact ? 0.55 : 0.62;
  const maxBarThickness = compact ? 52 : CHART_LAYOUT.maxBarThickness;

  const chartData = {
    labels: buckets,
    datasets: [
      {
        label: chartTexts("legend.received"),
        data: receivedCounts.map(count => (totalReceived > 0 ? (count / totalReceived) * 100 : 0)),
        backgroundColor: alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.9),
        hoverBackgroundColor: FEEDBACK_SECTION_CHART_RECEIVED_HOVER,
        barPercentage,
        maxBarThickness,
        borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 6, bottomRight: 6 },
        borderSkipped: false
      },
      {
        label: chartTexts("legend.sent"),
        data: sentCounts.map(count => (totalSent > 0 ? (count / totalSent) * 100 : 0)),
        backgroundColor: FEEDBACK_SECTION_CHART_SENT,
        hoverBackgroundColor: FEEDBACK_SECTION_CHART_SENT_HOVER,
        barPercentage,
        maxBarThickness,
        borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
        borderSkipped: false
      }
    ]
  };

  const options = {
    ...BARCHART_OPTIONS,
    layout: {
      padding: compact ? { left: 4, right: 4, top: 2, bottom: 0 } : { left: 8, right: 8, top: 8, bottom: 2 }
    },
    plugins: {
      legend: {
        ...TOP_LEGEND,
        labels: {
          ...TOP_LEGEND.labels,
          boxWidth: compact ? 10 : 14,
          padding: compact ? 6 : 10,
          color: TEXT_MAIN,
          font: { size: compact ? 9 : 11, weight: "600" },
          usePointStyle: true,
          pointStyle: "rectRounded"
        }
      },
      tooltip: {
        ...PCT_TOOLTIP,
        backgroundColor: alpha(TEXT_MAIN, 0.92),
        titleColor: "#f8fafc",
        bodyColor: "#f8fafc",
        borderColor: alpha("#ffffff", 0.12),
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        boxPadding: 6
      }
    },
    scales: {
      x: {
        ...BARCHART_OPTIONS.scales.x,
        stacked: true,
        ticks: {
          ...BARCHART_OPTIONS.scales.x.ticks,
          display: false,
          color: TEXT_MUTED
        },
        grid: {
          display: false,
          drawOnChartArea: false,
          drawBorder: false
        },
        border: { display: false },
        title: { display: false }
      },
      y: {
        ...BARCHART_OPTIONS.scales.y,
        stacked: true,
        title: {
          display: true,
          text: chartTexts("yAxis"),
          color: TEXT_MUTED,
          font: { size: compact ? 9 : 11, weight: "600" }
        },
        ticks: {
          ...BARCHART_OPTIONS.scales.y.ticks,
          color: TEXT_MUTED,
          font: { size: compact ? 9 : 11 }
        },
        grid: {
          color: alpha(TEXT_MAIN, 0.06),
          drawBorder: false
        },
        border: { display: false }
      }
    }
  };

  const chartPlotHeight = compact ? undefined : CHART_LAYOUT.responsiveChartHeight;

  return (
    <Box
      id={container_name}
      sx={{
        ...(compact ? feedbackPlotPanelOnSurfaceSx : feedbackPlotPanelSx),
        position: "relative",
        p: compact ? { xs: 0.75, sm: 1 } : { xs: 1.5, sm: 2.25 },
        ...(compact && {
          pt: 1.75,
          height: "100%",
          minHeight: 0,
          maxHeight: "100%",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box"
        })
      }}
    >
      <Box
        display="flex"
        justifyContent="flex-end"
        alignItems="center"
        sx={compact ? { position: "absolute", top: 6, right: 6, zIndex: 1, mb: 0 } : { mb: 0.5 }}
      >
        <DownloadButtons chartId={container_name} fileNamePrefix={CHART_NAME} />
      </Box>
      <Typography
        variant="overline"
        sx={{
          display: "block",
          textAlign: "center",
          color: FEEDBACK_SECTION_CHART_SENT,
          fontWeight: 700,
          letterSpacing: compact ? "0.14em" : "0.2em",
          fontSize: compact ? "0.55rem" : "0.65rem",
          mb: compact ? { xs: 0.35, sm: 0.5 } : { xs: 1, sm: 1.25 },
          px: compact ? 3 : 0,
          ...(compact && { flexShrink: 0 })
        }}
      >
        {chartTexts("xAxis")}
      </Typography>
      <Box
        sx={{
          width: "100%",
          position: "relative",
          ...(compact
            ? {
                flex: "1 1 auto",
                minHeight: { xs: 155, sm: 175 },
                height: 0
              }
            : { height: chartPlotHeight })
        }}
      >
        <Bar data={chartData} options={options} />
      </Box>

      <Box
        sx={{
          mt: compact ? { xs: 0, sm: 0.125 } : { xs: 0.5, sm: 0.75 },
          pt: compact ? { xs: 0.5, sm: 0.65 } : { xs: 1.25, sm: 1.5 },
          px: compact ? 0 : { xs: 0, sm: 0.25 },
          borderTop: `1px solid ${alpha(TEXT_MAIN, 0.08)}`,
          ...(compact && { flexShrink: 0 })
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            columnGap: compact ? { xs: 0.35, sm: 0.5 } : { xs: 0.75, sm: 1.25 },
            rowGap: compact ? { xs: 0.35, sm: 0.45 } : { xs: 1, sm: 1.25 },
            alignItems: "start"
          }}
        >
          {BUCKET_STORY_KEYS.map((key, i) => (
            <Box
              key={key}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: compact ? { xs: 0.2, sm: 0.25 } : { xs: 0.5, sm: 0.65 },
                minWidth: 0
              }}
            >
              <Typography
                component="span"
                variant="body2"
                sx={{
                  color: TEXT_MAIN,
                  fontWeight: 700,
                  fontSize: compact ? { xs: "0.58rem", sm: "0.62rem" } : { xs: "0.72rem", sm: "0.8rem" },
                  lineHeight: compact ? 1.25 : 1.35,
                  letterSpacing: "-0.01em",
                  fontFeatureSettings: '"tnum"'
                }}
              >
                {buckets[i].replace(/-/g, "–")}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  width: "100%",
                  maxWidth: { xs: "100%", sm: compact ? 88 : 120 },
                  color: TEXT_MUTED,
                  fontWeight: 500,
                  lineHeight: compact ? 1.28 : 1.45,
                  fontSize: compact ? { xs: "0.52rem", sm: "0.56rem" } : { xs: "0.65rem", sm: "0.72rem" },
                  wordBreak: "break-word",
                  display: "block"
                }}
              >
                {chartTexts(key)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default DayPartsActivityOverallChart;
