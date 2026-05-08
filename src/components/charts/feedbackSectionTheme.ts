import { alpha } from "@mui/material/styles";

/** Shared palette for feedback “card” sections (accent `#2563eb`, surface `#f5f7fc`, slate text). */
export const FEEDBACK_SECTION_SURFACE = "#f5f7fc";
export const FEEDBACK_SECTION_ACCENT = "#2563eb";
/** Sent words — reddish-orange (shared donor chart palette). */
export const FEEDBACK_SECTION_CHART_SENT = "#E4512E";
/** Hover for {@link FEEDBACK_SECTION_CHART_SENT}. */
export const FEEDBACK_SECTION_CHART_SENT_HOVER = "#c73b22";
/** Received words — teal (shared donor chart palette). */
export const FEEDBACK_SECTION_CHART_RECEIVED = "#5BA19B";
/** Hover for {@link FEEDBACK_SECTION_CHART_RECEIVED}. */
export const FEEDBACK_SECTION_CHART_RECEIVED_HOVER = "#4a9089";
/** Deeper blue for stat highlights (pairs with ACCENT on the same surface). */
export const FEEDBACK_SECTION_SECONDARY = "#1e3a8a";
export const FEEDBACK_SECTION_TEXT_MAIN = "#0f172a";
export const FEEDBACK_SECTION_TEXT_MUTED = "#64748b";
/** Warm accent for secondary stats (e.g. estimated typing time). */
export const FEEDBACK_SECTION_TYPING_HINT = "#b45309";

const TM = FEEDBACK_SECTION_TEXT_MAIN;

export const feedbackSectionOuterSx = {
  maxWidth: 850,
  mx: "auto",
  position: "relative",
  borderRadius: 3,
  bgcolor: FEEDBACK_SECTION_SURFACE,
  border: `2px solid ${FEEDBACK_SECTION_ACCENT}`,
  boxShadow: `0 2px 4px -1px ${alpha(TM, 0.08)}, 0 12px 28px -8px ${alpha(TM, 0.1)}`,
  overflow: "hidden"
};

/** Outer shell for sections using the donor coral/teal chart palette (matches ComparisonCarousel). */
export const feedbackChartPaletteOuterSx = {
  maxWidth: 850,
  mx: "auto",
  position: "relative",
  borderRadius: 3,
  bgcolor: FEEDBACK_SECTION_SURFACE,
  border: `2px solid ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.55)}`,
  boxShadow: `0 0 0 1px ${alpha(FEEDBACK_SECTION_CHART_SENT, 0.12)}, 0 2px 4px -1px ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.18)}, 0 14px 32px -10px ${alpha(FEEDBACK_SECTION_CHART_SENT, 0.14)}`,
  overflow: "hidden"
};

/** Icon tile inside a chart-palette section header. */
export const feedbackChartPaletteIconBoxSx = {
  width: 44,
  height: 44,
  borderRadius: 2,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  bgcolor: alpha(FEEDBACK_SECTION_CHART_SENT, 0.14),
  border: `1px solid ${alpha(FEEDBACK_SECTION_CHART_SENT, 0.4)}`
};

export const feedbackSectionHeaderStripSx = {
  position: "relative",
  px: { xs: 2.5, sm: 4 },
  pt: 3,
  pb: 2.5,
  bgcolor: "#ffffff",
  borderBottom: `1px solid ${alpha(TM, 0.08)}`
};

/** Header strip when parent uses {@link feedbackChartPaletteOuterSx}. */
export const feedbackChartPaletteHeaderStripSx = {
  ...feedbackSectionHeaderStripSx,
  borderBottom: `1px solid ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.22)}`
};

export const feedbackSectionBodySx = {
  position: "relative",
  px: { xs: 2.5, sm: 4 },
  py: 3.5,
  bgcolor: FEEDBACK_SECTION_SURFACE
};

export const feedbackPlotPanelSx = {
  width: "100%",
  p: { xs: 2, sm: 2.75 },
  borderRadius: 2.5,
  bgcolor: alpha("#ffffff", 0.52),
  border: `1px solid ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.2)}`,
  boxShadow: `0 1px 2px ${alpha(TM, 0.04)}, inset 0 1px 0 ${alpha("#ffffff", 0.7)}`
};

/** Transparent plot shell on {@link FEEDBACK_SECTION_SURFACE} (e.g. General Information carousel slides). */
export const feedbackPlotPanelOnSurfaceSx = {
  width: "100%",
  borderRadius: 2.5,
  bgcolor: "transparent",
  border: `1px solid ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.22)}`,
  boxShadow: "none"
};

/** MUI Slider for month/year axis in Interaction Intensity (coral track, teal rail). */
export const feedbackChartSliderSx = {
  color: FEEDBACK_SECTION_CHART_SENT,
  height: 8,
  py: 1,
  "& .MuiSlider-rail": {
    opacity: 1,
    backgroundColor: alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.32),
    height: 8,
    borderRadius: 4
  },
  "& .MuiSlider-track": {
    border: "none",
    backgroundColor: FEEDBACK_SECTION_CHART_SENT,
    height: 8,
    borderRadius: 4
  },
  "& .MuiSlider-thumb": {
    width: 20,
    height: 20,
    backgroundColor: FEEDBACK_SECTION_CHART_SENT,
    border: "2px solid #ffffff",
    boxShadow: `0 1px 4px ${alpha(TM, 0.18)}`,
    "&:hover, &.Mui-focusVisible, &.Mui-active": {
      boxShadow: `0 0 0 6px ${alpha(FEEDBACK_SECTION_CHART_SENT, 0.22)}`
    }
  },
  "& .MuiSlider-mark": {
    backgroundColor: alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.55),
    width: 6,
    height: 6,
    borderRadius: "50%",
    "&.MuiSlider-markActive": {
      backgroundColor: FEEDBACK_SECTION_CHART_SENT
    }
  },
  "& .MuiSlider-markLabel": {
    color: FEEDBACK_SECTION_TEXT_MUTED,
    fontWeight: 600
  },
  "& .MuiSlider-valueLabel": {
    backgroundColor: FEEDBACK_SECTION_CHART_SENT,
    color: "#ffffff",
    fontWeight: 600
  }
} as const;

/** Outlined chart controls next to feedback sliders. */
export const feedbackChartControlOutlinedButtonSx = {
  borderColor: alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.65),
  color: FEEDBACK_SECTION_TEXT_MAIN,
  "&:hover": {
    borderColor: FEEDBACK_SECTION_CHART_SENT,
    color: FEEDBACK_SECTION_CHART_SENT,
    backgroundColor: alpha(FEEDBACK_SECTION_CHART_SENT, 0.06)
  }
} as const;
