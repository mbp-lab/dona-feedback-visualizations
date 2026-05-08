import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Slider, useMediaQuery, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import { sparseMarks } from "@services/charts/sliderUtils";
import { useTranslations } from "next-intl";

import { ChartControlButton } from "@/styles/StyledButtons";
import { feedbackChartControlOutlinedButtonSx, feedbackChartSliderSx } from "@components/charts/feedbackSectionTheme";

const RotatedLabelsSlider = styled(Slider, {
  shouldForwardProp: prop => prop !== "maxValue"
})<{ maxValue: number }>(({ theme, maxValue }) => ({
  "& .MuiSlider-markLabel": {
    transform: "translateX(-60%) rotate(-30deg)",
    transformOrigin: "center center",
    marginTop: "1px",
    marginBottom: "100px",
    whiteSpace: "nowrap",
    fontSize: "0.75rem"
  },
  "& .MuiSlider-valueLabelOpen": {
    transform: "translate(-2px, 135%)",
    transformOrigin: "center center"
  },
  [`& input[aria-valuenow='0'] + .MuiSlider-valueLabelOpen, & input[aria-valuenow='${maxValue}'] + .MuiSlider-valueLabelOpen`]: {
    display: "none"
  },
  "& .MuiSlider-valueLabelOpen::before": {
    transform: "translate(-50%, -24px) rotate(45deg)"
  }
}));

interface SliderWithButtonsProps {
  value: number;
  marks: { value: number; label: string }[];
  setCurrentFrame: React.Dispatch<React.SetStateAction<number>>;
  alwaysShowValueLabel?: boolean; // if true, always show current selection label on the thumb
  /** Coral/teal donor palette (Interaction Intensity time slider + controls). */
  useFeedbackChartPalette?: boolean;
}

const SliderWithButtons: React.FC<SliderWithButtonsProps> = ({
  value,
  marks,
  setCurrentFrame,
  alwaysShowValueLabel = true,
  useFeedbackChartPalette = false
}) => {
  const labels = useTranslations("feedback.chartLabels");
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Measure the actual width of the slider container to adapt label density
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (typeof window === "undefined") return;
    const el = containerRef.current;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        setContainerWidth(cr.width);
      }
    });
    ro.observe(el);
    setContainerWidth(el.getBoundingClientRect().width); // Initial measurement
    return () => ro.disconnect();
  }, []);

  const maxLabels = useMemo(() => {
    // Fallback to heuristic when no measurement available
    if (!containerWidth) return isMobile ? 6 : 10;

    // Approximate pitch per label in px considering rotation and mark spacing
    const minPitch = isMobile ? 64 : 72;
    // Reserve some padding area inside the slider track
    const usable = Math.max(0, containerWidth - 24);
    // Always at least 2 (first/last); cap at 14 to avoid clutter even on huge screens
    return Math.min(14, Math.max(2, Math.floor(usable / minPitch)));
  }, [containerWidth, isMobile]);

  // Build full marks for all months, but only show labels for a sparse subset (always include first/last)
  const renderedMarks = useMemo(() => {
    const sparse = sparseMarks(marks, maxLabels);
    const labeledValues = new Set(sparse.map(m => m.value));
    return marks.map(m => ({
      value: m.value,
      label: labeledValues.has(m.value) ? m.label : ""
    }));
  }, [marks, maxLabels]);

  const handleStartAnimation = () => {
    if (animationRef.current) clearInterval(animationRef.current);
    setCurrentFrame(0);
    animationRef.current = setInterval(() => {
      setCurrentFrame(prevFrame => {
        if (prevFrame < marks.length - 1) {
          return prevFrame + 1;
        } else {
          if (animationRef.current) clearInterval(animationRef.current);
          return prevFrame;
        }
      });
    }, 500);
  };

  const handleReset = () => {
    if (animationRef.current) clearInterval(animationRef.current);
    setCurrentFrame(0);
  };

  return (
    <Box
      display="flex"
      flexDirection={{ xs: "column", sm: "row" }}
      alignItems="center"
      mx="auto"
      width="95%"
      gap={{ xs: 0, sm: 3 }}
      mt={-2}
      mb={{ xs: 2, sm: 0 }}
    >
      {/* Slider up to 60% width */}
      <Box ref={containerRef} flexGrow={1} width={{ xs: "100%", sm: "60%" }} minWidth="150px" px={2} mb={1}>
        <RotatedLabelsSlider
          value={value}
          onChange={(_, newValue) => setCurrentFrame(newValue as number)}
          maxValue={marks.length - 1}
          min={0}
          max={marks.length - 1}
          step={1}
          marks={renderedMarks}
          valueLabelDisplay={alwaysShowValueLabel ? "on" : "auto"}
          valueLabelFormat={v => marks[v]?.label ?? String(v)}
          sx={useFeedbackChartPalette ? feedbackChartSliderSx : undefined}
        />
      </Box>

      {/* Buttons, side by side */}
      <Box display="flex" gap={1} flexDirection="row" alignItems="center">
        <ChartControlButton
          variant="outlined"
          onClick={handleStartAnimation}
          sx={useFeedbackChartPalette ? feedbackChartControlOutlinedButtonSx : undefined}
        >
          {labels("start")}
        </ChartControlButton>
        <ChartControlButton
          variant="outlined"
          onClick={handleReset}
          sx={useFeedbackChartPalette ? feedbackChartControlOutlinedButtonSx : undefined}
        >
          {labels("resetView")}
        </ChartControlButton>
      </Box>
    </Box>
  );
};

export default SliderWithButtons;
