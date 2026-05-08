import React from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { PodiumContact } from "@models/graphData";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import DownloadButtons from "@components/charts/DownloadButtons";
import {
  FEEDBACK_SECTION_CHART_RECEIVED,
  FEEDBACK_SECTION_CHART_RECEIVED_HOVER,
  FEEDBACK_SECTION_CHART_SENT,
  FEEDBACK_SECTION_TEXT_MAIN as TEXT_MAIN,
  FEEDBACK_SECTION_TEXT_MUTED as TEXT_MUTED
} from "@components/charts/feedbackSectionTheme";

interface TopContactsPodiumProps {
  podiumData?: PodiumContact[];
}

const RANK_STYLE: Record<
  number,
  { width: number; height: number; topBg: string; frontBg: string; trophyColor: string; nameColor: string; metaColor: string }
> = {
  1: {
    width: 170,
    height: 250,
    topBg: alpha(FEEDBACK_SECTION_CHART_SENT, 0.42),
    frontBg: FEEDBACK_SECTION_CHART_SENT,
    trophyColor: "rgba(255,255,255,0.95)",
    nameColor: "#ffffff",
    metaColor: "rgba(255,255,255,0.85)"
  },
  2: {
    width: 150,
    height: 180,
    topBg: alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.38),
    frontBg: FEEDBACK_SECTION_CHART_RECEIVED,
    trophyColor: "rgba(255,255,255,0.95)",
    nameColor: "#ffffff",
    metaColor: "rgba(255,255,255,0.88)"
  },
  3: {
    width: 150,
    height: 140,
    topBg: alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.18),
    frontBg: FEEDBACK_SECTION_CHART_RECEIVED_HOVER,
    trophyColor: "rgba(255,255,255,0.95)",
    nameColor: TEXT_MAIN,
    metaColor: alpha(TEXT_MAIN, 0.75)
  }
};

export default function TopContactsPodium({ podiumData }: TopContactsPodiumProps) {
  const safePodiumData = podiumData || [];

  const orderedPodium = [
    safePodiumData.find(p => p.rank === 2) || null,
    safePodiumData.find(p => p.rank === 1) || null,
    safePodiumData.find(p => p.rank === 3) || null
  ];

  const CHART_ID = "top-contacts-podium-chart";
  const FILE_NAME = "top-contacts-podium";

  const standFrontBase = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 8px",
    boxShadow: `0 8px 20px -8px ${alpha(TEXT_MAIN, 0.2)}`,
    width: "100%",
    border: `1px solid ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.35)}`,
    borderTop: "none"
  };

  const standTopBase = {
    height: "25px",
    width: "100%",
    border: `1px solid ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.28)}`,
    borderBottom: "none"
  };

  return (
    <Box
      id={CHART_ID}
      sx={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
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
          alignItems: "flex-end",
          justifyContent: "center",
          flexGrow: 1,
          width: "100%",
          pb: 2,
          pt: 1,
          gap: 1.25
        }}
      >
        {orderedPodium.map((contact, index) => {
          if (!contact) {
            const standWidth = index === 1 ? 130 : 110;
            const standHeight = index === 1 ? 150 : index === 0 ? 120 : 90;
            let clipPath;
            let zIndex;
            let marginLeft;

            switch (index) {
              case 0:
                clipPath = "polygon(15% 0, 100% 0, 100% 100%, 0% 100%)";
                break;
              case 1:
                clipPath = "polygon(15% 0, 85% 0, 100% 100%, 0% 100%)";
                zIndex = 10;
                marginLeft = "-15px";
                break;
              case 2:
                clipPath = "polygon(0% 0, 85% 0, 100% 100%, 0% 100%)";
                marginLeft = "-15px";
                break;
              default:
                clipPath = "none";
            }

            return (
              <Box
                key={`empty-${index}`}
                sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: standWidth, zIndex, marginLeft }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 0.5, visibility: "hidden" }}>
                  <Typography variant="h5" sx={{ fontWeight: "bold", lineHeight: 1 }}>
                    0
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: "medium" }}>
                    messages
                  </Typography>
                </Box>
                <Box
                  sx={{
                    ...standTopBase,
                    background: alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.1),
                    clipPath,
                    borderColor: alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.2)
                  }}
                />
                <Box
                  sx={{
                    ...standFrontBase,
                    height: standHeight,
                    background: alpha(TEXT_MAIN, 0.04),
                    borderColor: alpha(TEXT_MAIN, 0.08),
                    boxShadow: "none"
                  }}
                >
                  <Typography variant="h6" sx={{ color: TEXT_MUTED }}>
                    ?
                  </Typography>
                </Box>
              </Box>
            );
          }

          let clipPath;
          let zIndex: number | undefined;
          let marginLeft: string | undefined;
          const rs = RANK_STYLE[contact.rank];

          switch (contact.rank) {
            case 1:
              clipPath = "polygon(15% 0, 85% 0, 100% 100%, 0% 100%)";
              zIndex = 10;
              marginLeft = "-15px";
              break;
            case 2:
              clipPath = "polygon(15% 0, 100% 0, 100% 100%, 0% 100%)";
              break;
            case 3:
              clipPath = "polygon(0% 0, 85% 0, 100% 100%, 0% 100%)";
              marginLeft = "-15px";
              break;
            default:
              clipPath = "none";
          }

          return (
            <Box
              key={contact.rank}
              sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: rs.width, zIndex, marginLeft }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 0.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: TEXT_MAIN, lineHeight: 1 }}>
                  {contact.messageCount.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: TEXT_MUTED, fontWeight: 600 }}>
                  messages
                </Typography>
              </Box>

              <Box sx={{ ...standTopBase, background: rs.topBg, clipPath, borderColor: alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.35) }} />

              <Box sx={{ ...standFrontBase, background: rs.frontBg, height: rs.height }}>
                <EmojiEventsIcon sx={{ fontSize: 30, color: rs.trophyColor, mb: 0.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, color: rs.nameColor, textAlign: "center", px: 0.5 }}>
                  {contact.name}
                </Typography>
                <Typography variant="body2" sx={{ color: rs.metaColor, fontWeight: 600 }}>
                  Rank {contact.rank}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
