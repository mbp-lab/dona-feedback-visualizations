import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { Chart as ChartJS, Legend, LineElement, PointElement, RadialLinearScale, Tooltip } from "chart.js";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { Radar } from "react-chartjs-2";

import DownloadButtons from "@components/charts/DownloadButtons";
import {
  FEEDBACK_SECTION_CHART_RECEIVED,
  FEEDBACK_SECTION_CHART_RECEIVED_HOVER,
  FEEDBACK_SECTION_CHART_SENT,
  FEEDBACK_SECTION_CHART_SENT_HOVER,
  FEEDBACK_SECTION_TEXT_MAIN as TEXT_MAIN,
  FEEDBACK_SECTION_TEXT_MUTED as TEXT_MUTED
} from "@components/charts/feedbackSectionTheme";
import { SentReceivedPoint } from "@models/graphData";
import { prepareCountsOverTimeData } from "@services/charts/animations";
import { calculateZScores } from "@services/charts/zScores";

import SliderWithButtons from "./SliderWithButtons";

ChartJS.register(RadialLinearScale, Tooltip, Legend, LineElement, PointElement);

const Z_SCORE_LIMIT = 1.96;

interface AnimatedIntensityPolarChartProps {
  dataMonthlyPerConversation: Record<string, SentReceivedPoint[]>;
}

const AnimatedIntensityPolarChart: React.FC<AnimatedIntensityPolarChartProps> = ({ dataMonthlyPerConversation }) => {
  const CHART_NAME = "intensity-interaction-polar";
  const container_name = `chart-wrapper-${CHART_NAME}`;

  const labelTexts = useTranslations("feedback.chartLabels");
  const chartTexts = useTranslations("feedback.interactionIntensity.animatedIntensityPolarChart");

  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [labels, setLabels] = useState<string[]>([]);
  const [frames, setFrames] = useState<Record<string, number[]>>({});
  const [counts, setCounts] = useState<Record<string, number[]>>({});

  const gridRingColor = alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.28);
  const hubValue = Z_SCORE_LIMIT + Z_SCORE_LIMIT * 0.5;

  useEffect(() => {
    const { counts: preparedCounts, sortedMonths } = prepareCountsOverTimeData(dataMonthlyPerConversation);
    const zScoreFrames = calculateZScores(preparedCounts, Z_SCORE_LIMIT) as Record<string, number[]>;
    setLabels(sortedMonths);
    setFrames(zScoreFrames);
    setCounts(preparedCounts);
  }, [dataMonthlyPerConversation]);

  const generateChartData = (frameIndex: number) => {
    const monthKey = labels[frameIndex];
    const conversationData = frames[monthKey] || [];

    return {
      labels: Object.keys(dataMonthlyPerConversation),
      datasets: [
        {
          label: chartTexts("legend.others"),
          data: conversationData,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: FEEDBACK_SECTION_CHART_RECEIVED,
          pointBorderWidth: 2,
          pointRadius: 9,
          pointHoverRadius: 11,
          pointHoverBackgroundColor: alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.12),
          pointHoverBorderColor: FEEDBACK_SECTION_CHART_RECEIVED_HOVER,
          borderWidth: 0
        },
        {
          label: chartTexts("legend.donor"),
          data: [hubValue],
          pointBackgroundColor: FEEDBACK_SECTION_CHART_SENT,
          pointBorderColor: "#ffffff",
          pointBorderWidth: 3,
          pointRadius: 16,
          pointHoverRadius: 18,
          pointHoverBackgroundColor: FEEDBACK_SECTION_CHART_SENT_HOVER,
          pointHoverBorderColor: "#ffffff",
          borderWidth: 0
        }
      ]
    };
  };

  return (
    <Box>
      <Box id={container_name} position="relative" px={{ xs: 1, sm: 2 }} py={1} mb={0.5}>
        <Box
          position="relative"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{ zIndex: 1, ml: 0.5, mb: -3, flexWrap: "wrap", gap: 1 }}
        >
          <Typography variant="body2" sx={{ color: TEXT_MAIN, fontWeight: 600 }}>
            <b>{labelTexts("currentMonth")}</b> {labels[currentFrame]}
          </Typography>
          <DownloadButtons
            chartId={container_name}
            fileNamePrefix={CHART_NAME}
            currentLabel={labels[currentFrame]}
            color={TEXT_MUTED}
            labelsBelow={true}
          />
        </Box>
        <Box
          position="relative"
          flex="1"
          px={{ xs: 1, sm: 2 }}
          pb={2}
          pt={4}
          sx={{
            zIndex: 0,
            width: "100%",
            height: { xs: 340, sm: 400 },
            borderRadius: 2,
            border: `1px solid ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.22)}`,
            bgcolor: alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.06),
            boxShadow: `inset 0 0 0 1px ${alpha("#ffffff", 0.5)}`
          }}
        >
          <Radar
            data={generateChartData(currentFrame)}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              animation: { duration: 400, easing: "easeOutCubic" },
              scales: {
                r: {
                  reverse: true,
                  beginAtZero: true,
                  min: -Z_SCORE_LIMIT * 0.8,
                  max: hubValue,
                  ticks: { count: 1, display: false },
                  angleLines: {
                    display: false
                  },
                  grid: {
                    circular: true,
                    color: gridRingColor,
                    lineWidth: 1
                  },
                  pointLabels: {
                    color: TEXT_MAIN,
                    font: { size: 12, weight: 600 },
                    padding: 10,
                    backdropColor: "transparent"
                  }
                }
              },
              plugins: {
                legend: {
                  position: "chartArea",
                  align: "start",
                  display: true,
                  labels: {
                    usePointStyle: true,
                    pointStyle: "circle",
                    padding: 16,
                    textAlign: "left",
                    color: TEXT_MAIN,
                    font: { size: 12, weight: 600 }
                  }
                },
                tooltip: {
                  backgroundColor: "rgba(15, 23, 42, 0.94)",
                  titleColor: "#f8fafc",
                  bodyColor: "#e2e8f0",
                  borderColor: "rgba(148, 163, 184, 0.35)",
                  borderWidth: 1,
                  cornerRadius: 10,
                  padding: 12,
                  displayColors: true,
                  callbacks: {
                    label: (context: any) => {
                      if (context.datasetIndex === 1) {
                        return `${context.dataset.label}`;
                      }
                      const di = context.dataIndex;
                      const monthKey = labels[currentFrame];
                      const value = counts[monthKey]?.[di] ?? 0;
                      return `${labelTexts("numberMessages")}: ${value}`;
                    }
                  }
                }
              }
            }}
          />
        </Box>
      </Box>

      <SliderWithButtons
        value={currentFrame}
        marks={labels.map((label, index) => ({ value: index, label }))}
        setCurrentFrame={setCurrentFrame}
        useFeedbackChartPalette
      />
    </Box>
  );
};

export default AnimatedIntensityPolarChart;
