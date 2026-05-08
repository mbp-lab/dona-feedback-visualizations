export const CHART_COLORS = {
  primary: "#1f77b4", // Blue
  primaryLight: "#66b1e5",
  primaryTransparent: "rgba(31, 119, 180, 0.2)",
  secondary: "#ff7f0e", // Orange
  secondaryLight: "#ffb26e",
  secondaryTransparent: "rgba(255, 127, 14, 0.2)",
  background: "#f5f5f5"
};

const MOBILE_HEIGHT = 250;
const DESKTOP_HEIGHT = 400;
const X_TICKS = { font: { size: 12 }, padding: 5 };
const Y_TICKS = { font: { size: 12 }, padding: 0, offset: false };

export const CHART_BOX_PROPS = {
  main: { width: "100%", maxWidth: "900px", mx: "auto" },
  drawingArea: {}
};

export const CHART_LAYOUT = {
  maxBarThickness: 80,
  hBarThickness: 20,
  maxHBarThickness: 40,
  barPercentageNarrow: 0.6,
  barPercentageNarrower: 0.5,
  barPercentageWide: 1,
  maxWidth: "900px",
  mobileChartHeight: MOBILE_HEIGHT,
  desktopChartHeight: DESKTOP_HEIGHT,
  responsiveChartHeight: { xs: MOBILE_HEIGHT, sm: DESKTOP_HEIGHT },
  paddingX: { xs: 1, sm: 2 },
  paddingY: 2,
  labelFontSize: { xs: "0.8rem", sm: "1rem" }
};

export const PCT_TOOLTIP = {
  callbacks: { label: (context: any) => `${context.raw?.toFixed(2)}%` }
};

export const TOP_LEGEND = {
  position: "top" as const,
  labels: {
    font: { size: 11 },
    padding: 10,
    boxWidth: 14
  }
};

export const COMMON_CHART_OPTIONS = {
  animation: { duration: 900 },
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: X_TICKS, beginAtZero: true },
    y: { ticks: Y_TICKS }
  }
};

export const BARCHART_OPTIONS = {
  animation: { duration: 900 },
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true },
    tooltip: PCT_TOOLTIP
  },
  scales: {
    x: {
      ticks: X_TICKS,
      grid: { drawOnChartArea: false }
    },
    y: {
      ticks: {
        ...Y_TICKS,
        callback: (value: number | string) => `${value}%`
      },
      beginAtZero: true,
      max: 100
    },
    y_no_pct: {
      ticks: {
        ...Y_TICKS,
        callback: (value: number | string) => value // Display actual numbers, not percentages
      }
    }
  }
};
