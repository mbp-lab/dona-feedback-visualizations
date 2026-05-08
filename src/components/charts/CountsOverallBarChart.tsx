import Box from "@mui/material/Box";
import { alpha } from "@mui/material/styles";
import { BarElement, CategoryScale, Chart as ChartJS, ChartDataset, Legend, LinearScale, Tooltip } from "chart.js";
import { useTranslations } from "next-intl";
import React from "react";
import { Bar } from "react-chartjs-2";

import useChartPattern from "@/hooks/useChartPattern";
import { CHART_LAYOUT, COMMON_CHART_OPTIONS } from "@components/charts/chartConfig";
import {
  FEEDBACK_SECTION_CHART_RECEIVED,
  FEEDBACK_SECTION_CHART_RECEIVED_HOVER,
  FEEDBACK_SECTION_CHART_SENT,
  FEEDBACK_SECTION_CHART_SENT_HOVER
} from "@components/charts/feedbackSectionTheme";
import DownloadButtons from "@components/charts/DownloadButtons";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface WordCountOverallBarChartProps {
  sentWordsTotal: number;
  receivedWordsTotal: number;
  mode: "text" | "audio";
}

const CountsOverallBarChart: React.FC<WordCountOverallBarChartProps> = ({ sentWordsTotal, receivedWordsTotal, mode }) => {
  const CHART_NAME = `count-overall-${mode}-barchart`;
  const container_name = `chart-wrapper-${CHART_NAME}`;

  const property = mode === "text" ? "word" : "second";
  const primaryPattern = useChartPattern(alpha(FEEDBACK_SECTION_CHART_SENT, 0.35), FEEDBACK_SECTION_CHART_SENT);
  const secondaryPattern = useChartPattern(alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.4), FEEDBACK_SECTION_CHART_RECEIVED_HOVER);
  const colors =
    mode === "text" ? [FEEDBACK_SECTION_CHART_SENT, alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.9)] : [primaryPattern, secondaryPattern];
  const chartTexts = useTranslations(`feedback.interactionIntensity.${property}CountOverallBarChart`);

  const generateChartData = () => {
    return {
      labels: [chartTexts("yAxis.sent"), chartTexts("yAxis.received")],
      datasets: [
        {
          data: [sentWordsTotal, receivedWordsTotal],
          backgroundColor: colors,
          maxBarThickness: CHART_LAYOUT.maxHBarThickness
        }
      ] as ChartDataset<"bar", number[]>[]
    };
  };

  return (
    <Box sx={{ width: "100%", maxWidth: CHART_LAYOUT.maxWidth, mx: "auto" }}>
      <Box id={container_name} position="relative" p={CHART_LAYOUT.paddingX}>
        <Box display="flex" justifyContent="right" alignItems="center" mb={-2}>
          <DownloadButtons chartId={container_name} fileNamePrefix={CHART_NAME} />
        </Box>
        <Box sx={{ width: "100%", minHeight: "250px" }}>
          <Bar
            data={generateChartData()}
            options={{
              ...COMMON_CHART_OPTIONS,
              indexAxis: "y",
              scales: {
                x: {
                  ...COMMON_CHART_OPTIONS.scales.x,
                  title: { display: true, text: chartTexts("xAxis") }
                },
                y: {
                  ...COMMON_CHART_OPTIONS.scales.y,
                  grid: { drawOnChartArea: false }
                }
              }
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default CountsOverallBarChart;
