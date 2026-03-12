import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { ReplyTimeRacer } from "@models/graphData";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import DownloadButtons from "@components/charts/DownloadButtons";

interface ReplyTimeRaceProps {
  raceData?: ReplyTimeRacer[];
}

const laneColors = ["#4CAF50", "#2196F3", "#FF9800", "#E91E63", "#9C27B0"];

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
    return <Typography>Not enough data to show reply time comparison.</Typography>;
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
        bgcolor: "#FFFFFF"
      }}
    >
      <Box sx={{ position: "absolute", top: 0, right: 0, zIndex: 100 }}>
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
              <Typography variant="body2" sx={{ fontWeight: "bold", textAlign: "left", mb: 0.5 }}>
                {racer.name}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {/* Track lane */}
                <Box
                  sx={{
                    flex: 1,
                    position: "relative",
                    height: 40,
                    bgcolor: "#f0f0f0",
                    borderRadius: 2,
                    overflow: "hidden"
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      left: 0,
                      right: 0,
                      borderBottom: "2px dashed #ddd",
                      borderTop: "2px dashed #ddd",
                      pointerEvents: "none"
                    }}
                  />

                  <Box
                    sx={{
                      height: "100%",
                      width: `${barWidth}%`,
                      background: `linear-gradient(90deg, ${color}44 0%, ${color} 100%)`,
                      borderRadius: 2,
                      transition: "width 0.6s ease-out",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      pr: 0.5
                    }}
                  >
                    <DirectionsRunIcon sx={{ fontSize: 28, color: "#fff", filter: "drop-shadow(1px 1px 1px rgba(0,0,0,0.3))" }} />
                  </Box>
                </Box>

                {/* Time and phone icon outside the track */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
                  <SmartphoneIcon sx={{ fontSize: 22, color: "#333" }} />
                  <Typography variant="caption" sx={{ fontWeight: "bold", color: "#555", whiteSpace: "nowrap" }}>
                    {racer.formattedTime}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Typography variant="caption" sx={{ mt: 1.5, color: "#777", fontStyle: "italic", textAlign: "center" }}>
        Each bar represents your median reply time in that chat. A longer bar means a faster reply.
      </Typography>
    </Box>
  );
}
