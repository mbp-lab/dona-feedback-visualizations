import React, { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import SwipeableViews from "react-swipeable-views";
import { useLocale, useTranslations } from "next-intl";

import { GraphData } from "@models/graphData";
import ChartContainer, { ChartType } from "@components/charts/ChartContainer";
import WritingActivityHeatmapSlide from "@components/charts/WritingActivityHeatmapSlide";
import {
  FEEDBACK_SECTION_CHART_RECEIVED,
  FEEDBACK_SECTION_CHART_RECEIVED_HOVER,
  FEEDBACK_SECTION_CHART_SENT,
  FEEDBACK_SECTION_CHART_SENT_HOVER,
  FEEDBACK_SECTION_SURFACE as SURFACE,
  FEEDBACK_SECTION_TEXT_MAIN as TEXT_MAIN,
  FEEDBACK_SECTION_TEXT_MUTED as TEXT_MUTED,
  feedbackChartPaletteOuterSx
} from "@components/charts/feedbackSectionTheme";

interface ComparisonCarouselProps {
  data: GraphData;
}

export default function ComparisonCarousel({ data }: ComparisonCarouselProps) {
  const t = useTranslations("feedback.comparisonCarousel");
  const locale = useLocale();
  const [activeStep, setActiveStep] = useState(0);
  const maxSteps = 2;

  const handleNext = () => setActiveStep(prev => (prev + 1) % maxSteps);
  const handleBack = () => setActiveStep(prev => (prev - 1 + maxSteps) % maxSteps);
  const handleStepChange = (step: number) => setActiveStep(step);

  const slideHeight = 460;

  const dayPartsChartWrapperSx = {
    flexGrow: 1,
    flexShrink: 1,
    width: "100%",
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    overflow: "hidden"
  } as const;

  const slideShell = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: slideHeight,
    p: 3,
    textAlign: "center",
    color: TEXT_MAIN,
    borderLeft: `1px solid ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.22)}`,
    borderRight: `1px solid ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.22)}`,
    bgcolor: SURFACE
  };

  const chartSlideStyles = {
    ...slideShell,
    justifyContent: "flex-start",
    pt: 2
  };

  const stopPropagationHandlers = {
    onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
    onTouchStart: (e: React.TouchEvent) => e.stopPropagation()
  };

  const chartHeadingBlockSx = {
    textAlign: "center" as const,
    width: "100%",
    maxWidth: 520,
    mx: "auto",
    px: 1,
    mb: 1.25
  };

  const chartTitleSx = {
    fontWeight: 800,
    letterSpacing: "-0.03em",
    color: TEXT_MAIN,
    fontSize: { xs: "1.35rem", sm: "1.75rem" },
    lineHeight: 1.2
  };

  return (
    <Box sx={feedbackChartPaletteOuterSx}>
      <Box aria-hidden sx={{ display: "flex", height: 4, width: "100%" }}>
        <Box sx={{ flex: 1, bgcolor: FEEDBACK_SECTION_CHART_SENT }} />
        <Box sx={{ flex: 1, bgcolor: FEEDBACK_SECTION_CHART_RECEIVED }} />
      </Box>
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          pt: 2.5,
          pb: 2,
          textAlign: "center",
          bgcolor: SURFACE,
          color: TEXT_MAIN,
          borderLeft: `1px solid ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.22)}`,
          borderRight: `1px solid ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.22)}`,
          borderBottom: `1px solid ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.14)}`
        }}
      >
        <Typography
          variant="overline"
          sx={{
            display: "block",
            letterSpacing: "0.2em",
            fontWeight: 700,
            fontSize: "0.65rem",
            color: FEEDBACK_SECTION_CHART_SENT,
            mb: 0.75
          }}
        >
          {t("cardOverline")}
        </Typography>
        <Typography variant="h3" sx={{ ...chartTitleSx, mb: 0 }}>
          {t("dayPartsTitle")}
        </Typography>
      </Box>
      <SwipeableViews axis="x" index={activeStep} onChangeIndex={handleStepChange} enableMouseEvents>
        <Box key="day-parts" sx={{ ...chartSlideStyles, pt: 1.25, px: 2, pb: 2, alignItems: "stretch" }}>
          <Box sx={{ ...chartHeadingBlockSx, maxWidth: 520, mb: 0.65, alignSelf: "center" }}>
            <Typography
              variant="caption"
              sx={{
                color: TEXT_MUTED,
                lineHeight: 1.35,
                display: "block",
                maxWidth: 400,
                mx: "auto",
                fontSize: { xs: "0.68rem", sm: "0.72rem" }
              }}
            >
              {t("dayPartsSubtitle")}
            </Typography>
          </Box>
          <Box sx={{ ...dayPartsChartWrapperSx }} {...stopPropagationHandlers}>
            <Box sx={{ width: "100%", flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column" }}>
              <ChartContainer type={ChartType.DayPartsActivityOverallChart} data={data} compact />
            </Box>
          </Box>
        </Box>

        <Box
          key="writing-heatmap"
          sx={{
            ...chartSlideStyles,
            pt: { xs: 1.25, sm: 1.75 },
            px: { xs: 1, sm: 1.75 },
            pb: 2,
            alignItems: "stretch",
            overflow: "hidden",
            minHeight: 0
          }}
        >
          <Box
            sx={{
              flex: "1 1 auto",
              minHeight: 0,
              width: "100%",
              display: "flex",
              flexDirection: "column"
            }}
            {...stopPropagationHandlers}
          >
            <WritingActivityHeatmapSlide dailySentHours={data.dailySentHours ?? []} locale={locale} />
          </Box>
        </Box>
      </SwipeableViews>
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
          {t("back")}
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
          {t("next")}
        </Button>
      </Box>
    </Box>
  );
}
