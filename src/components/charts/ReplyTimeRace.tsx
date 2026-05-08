import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ReplyTimeRacer } from "@models/graphData";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import DownloadButtons from "@components/charts/DownloadButtons";
import {
  FEEDBACK_SECTION_CHART_RECEIVED,
  FEEDBACK_SECTION_CHART_SENT,
  FEEDBACK_SECTION_CHART_SENT_HOVER,
  FEEDBACK_SECTION_TEXT_MAIN as TEXT_MAIN,
  FEEDBACK_SECTION_TEXT_MUTED as TEXT_MUTED
} from "@components/charts/feedbackSectionTheme";

interface ReplyTimeRaceProps {
  raceData?: ReplyTimeRacer[];
}

/** Coral / teal lane fills (cycles for many chats). */
const laneColors = [
  FEEDBACK_SECTION_CHART_SENT,
  FEEDBACK_SECTION_CHART_RECEIVED,
  FEEDBACK_SECTION_CHART_SENT_HOVER,
  alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.92),
  FEEDBACK_SECTION_CHART_SENT
] as const;

export default function ReplyTimeRace({ raceData }: ReplyTimeRaceProps) {
  const safeRaceData = raceData || [];

  const CHART_ID = "reply-time-race-chart";
  const FILE_NAME = "reply-time-race";

  const minTime = useMemo(() => {
    if (!safeRaceData || safeRaceData.length === 0) return 1;
    const times = safeRaceData.map(r => r.avgReplyTimeMinutes).filter(t => t > 0);
    return times.length > 0 ? Math.min(...times) : 1;
  }, [safeRaceData]);

  if (safeRaceData.length === 0) {
    return <Typography sx={{ color: TEXT_MUTED, textAlign: "center" }}>Not enough data to show reply time comparison.</Typography>;
  }

  return (
    <Box
      id={CHART_ID}
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        p: 2,
        position: "relative",
        bgcolor: "transparent",
        borderRadius: 2,
        border: "none",
        boxShadow: "none"
      }}
    >
      <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 100 }}>
        <DownloadButtons chartId={CHART_ID} fileNamePrefix={FILE_NAME} />
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          position: "relative",
          mt: 1
        }}
      >
        {safeRaceData.map((racer, index) => {
          const speedRatio = racer.avgReplyTimeMinutes > 0 ? minTime / racer.avgReplyTimeMinutes : 1;
          const barWidth = speedRatio * 90 + 5;
          const color = laneColors[index % laneColors.length];

          return (
            <Box key={index}>
              <Typography variant="body2" sx={{ fontWeight: 700, textAlign: "left", mb: 0.5, color: TEXT_MAIN }}>
                {racer.name}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    flex: 1,
                    position: "relative",
                    height: 40,
                    bgcolor: alpha(TEXT_MAIN, 0.06),
                    borderRadius: 2,
                    overflow: "hidden",
                    border: `1px solid ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.2)}`
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      left: 0,
                      right: 0,
                      borderBottom: `2px dashed ${alpha(TEXT_MAIN, 0.1)}`,
                      borderTop: `2px dashed ${alpha(TEXT_MAIN, 0.1)}`,
                      pointerEvents: "none"
                    }}
                  />

                  <Box
                    sx={{
                      height: "100%",
                      width: `${barWidth}%`,
                      bgcolor: color,
                      borderRadius: 2,
                      transition: "width 0.6s ease-out",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      pr: 0.5,
                      boxShadow: `inset 0 1px 0 ${alpha("#ffffff", 0.22)}`
                    }}
                  >
                    <DirectionsRunIcon
                      sx={{
                        fontSize: 28,
                        color: "#fff",
                        filter: "drop-shadow(0 1px 2px rgba(15,23,42,0.25))"
                      }}
                    />
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
                  <SmartphoneIcon sx={{ fontSize: 22, color: TEXT_MUTED }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: TEXT_MAIN, whiteSpace: "nowrap" }}>
                    {racer.formattedTime}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Typography variant="caption" sx={{ mt: 1.5, color: TEXT_MUTED, fontStyle: "italic", textAlign: "center", lineHeight: 1.5 }}>
        Each bar represents your median reply time in that chat. A longer bar means a faster reply.
      </Typography>
    </Box>
  );
}
