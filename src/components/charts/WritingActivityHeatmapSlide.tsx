import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useTranslations } from "next-intl";

import {
  FEEDBACK_SECTION_CHART_RECEIVED,
  FEEDBACK_SECTION_CHART_SENT,
  FEEDBACK_SECTION_SURFACE,
  FEEDBACK_SECTION_TEXT_MAIN as TEXT_MAIN,
  FEEDBACK_SECTION_TEXT_MUTED as TEXT_MUTED,
  feedbackPlotPanelOnSurfaceSx
} from "@components/charts/feedbackSectionTheme";
import { DailyHourPoint } from "@models/graphData";

const NUM_BANDS = 5;
const NUM_DAYS = 7;

const BAND_KEYS = [
  "heatmapBandEarlyMorn",
  "heatmapBandMorning",
  "heatmapBandAfternoon",
  "heatmapBandEvening",
  "heatmapBandLateNight"
] as const;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Monday = 0 … Sunday = 6 (JS getDay: Sun = 0). */
function mondayFirstDayIndex(d: Date): number {
  const js = d.getDay();
  return js === 0 ? 6 : js - 1;
}

/** Five bands: early morning, morning, afternoon, evening, late night (matches visual mock). */
function hourToBand(hour: number): number {
  if (hour < 6) return 0;
  if (hour < 12) return 1;
  if (hour < 18) return 2;
  if (hour < 22) return 3;
  return 4;
}

function buildGrid(points: DailyHourPoint[]): { grid: number[][]; maxCell: number } {
  const grid: number[][] = Array.from({ length: NUM_BANDS }, () => Array(NUM_DAYS).fill(0));
  for (const p of points) {
    const dt = new Date(p.year, p.month - 1, p.date, p.hour, p.minute);
    const col = mondayFirstDayIndex(dt);
    const row = hourToBand(p.hour);
    grid[row][col] += p.wordCount;
  }
  let maxCell = 0;
  for (let r = 0; r < NUM_BANDS; r++) {
    for (let c = 0; c < NUM_DAYS; c++) {
      if (grid[r][c] > maxCell) maxCell = grid[r][c];
    }
  }
  return { grid, maxCell };
}

function splitBandLabel(text: string): { name: string; range: string | null } {
  const i = text.indexOf("\n");
  if (i === -1) return { name: text, range: null };
  return { name: text.slice(0, i), range: text.slice(i + 1) };
}

/** Empty cells blend from section surface into coral. */
function cellHeatColor(value: number, maxCell: number): string {
  const [lr, lg, lb] = hexToRgb(FEEDBACK_SECTION_SURFACE);
  const hi = FEEDBACK_SECTION_CHART_SENT;
  const hr = parseInt(hi.slice(1, 3), 16);
  const hg = parseInt(hi.slice(3, 5), 16);
  const hb = parseInt(hi.slice(5, 7), 16);
  if (maxCell <= 0 || value <= 0) {
    return FEEDBACK_SECTION_SURFACE;
  }
  const t = Math.min(1, value / maxCell);
  const r = Math.round(lr + (hr - lr) * t);
  const g = Math.round(lg + (hg - lg) * t);
  const b = Math.round(lb + (hb - lb) * t);
  return `rgb(${r},${g},${b})`;
}

export interface WritingActivityHeatmapSlideProps {
  dailySentHours: DailyHourPoint[];
  locale: string;
}

export default function WritingActivityHeatmapSlide({ dailySentHours, locale }: WritingActivityHeatmapSlideProps) {
  const t = useTranslations("feedback.generalInfoCarousel");

  const { grid, maxCell } = useMemo(() => buildGrid(dailySentHours), [dailySentHours]);

  const weekdayLabels = useMemo(() => {
    const labels: string[] = [];
    for (let i = 0; i < 7; i++) {
      labels.push(new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: "short" }));
    }
    return labels;
  }, [locale]);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        alignSelf: "stretch",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: { xs: 1, sm: 1.25 },
        minHeight: 0,
        flex: "1 1 auto",
        overflow: "hidden"
      }}
    >
      <Box
        role="img"
        aria-label={t("heatmapAria")}
        sx={{
          ...feedbackPlotPanelOnSurfaceSx,
          p: { xs: 1.15, sm: 1.5 },
          flex: "1 1 auto",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
      >
        <Typography
          sx={{
            mb: { xs: 0.75, sm: 1 },
            px: 0.5,
            fontSize: { xs: "0.58rem", sm: "0.64rem" },
            color: TEXT_MUTED,
            textAlign: "center",
            lineHeight: 1.4,
            fontWeight: 500,
            flexShrink: 0
          }}
        >
          {t("heatmapHoursFootnote")}
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(4.5rem, min(32%, 6.75rem)) repeat(7, minmax(0, 1fr))",
              sm: "minmax(6.25rem, 7rem) repeat(7, minmax(0, 1fr))"
            },
            gridTemplateRows: "auto repeat(5, minmax(0, 1fr))",
            gap: { xs: "2px 3px", sm: "4px 5px" },
            alignItems: "stretch",
            flex: "1 1 auto",
            minHeight: 0,
            width: "100%"
          }}
        >
          <Box />
          {weekdayLabels.map(label => (
            <Typography
              key={label}
              sx={{
                fontSize: { xs: "0.6rem", sm: "0.68rem" },
                fontWeight: 700,
                color: TEXT_MUTED,
                textAlign: "center",
                lineHeight: 1.2
              }}
            >
              {label}
            </Typography>
          ))}
          {BAND_KEYS.map((bandKey, row) => {
            const { name, range } = splitBandLabel(t(bandKey));
            return (
              <React.Fragment key={bandKey}>
                <Box
                  sx={{
                    pr: 0.25,
                    textAlign: "left",
                    minWidth: 0,
                    alignSelf: "stretch",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    py: 0.25
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: { xs: "0.55rem", sm: "0.62rem" },
                      fontWeight: 600,
                      color: TEXT_MUTED,
                      lineHeight: 1.15
                    }}
                  >
                    {name}
                  </Typography>
                  {range ? (
                    <Typography
                      sx={{
                        fontSize: { xs: "0.48rem", sm: "0.54rem" },
                        fontWeight: 600,
                        color: alpha(TEXT_MUTED, 0.9),
                        lineHeight: 1.15,
                        fontVariantNumeric: "tabular-nums",
                        letterSpacing: "0.01em",
                        mt: 0.1
                      }}
                    >
                      {range}
                    </Typography>
                  ) : null}
                </Box>
                {grid[row].map((value, col) => (
                  <Box
                    key={col}
                    sx={{
                      minHeight: { xs: 16, sm: 20 },
                      height: "100%",
                      borderRadius: 1,
                      bgcolor: cellHeatColor(value, maxCell),
                      border: `1px solid ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.22)}`,
                      boxSizing: "border-box"
                    }}
                  />
                ))}
              </React.Fragment>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
