import React, { useState } from "react";
import { Box, Typography, TextField, MenuItem, Stack, Paper, Fade } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { GraphData } from "@models/graphData";
import {
  FEEDBACK_SECTION_CHART_RECEIVED,
  FEEDBACK_SECTION_CHART_SENT,
  FEEDBACK_SECTION_TEXT_MAIN as TEXT_MAIN,
  FEEDBACK_SECTION_TEXT_MUTED as TEXT_MUTED,
  feedbackChartPaletteHeaderStripSx,
  feedbackChartPaletteIconBoxSx,
  feedbackChartPaletteOuterSx,
  feedbackSectionBodySx
} from "@components/charts/feedbackSectionTheme";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";

interface ChatSummaryCarouselProps {
  data: GraphData;
}

export default function ChatSummaryCarousel({ data }: ChatSummaryCarouselProps) {
  const chatSummaries = data.chatSummaries || [];
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  if (chatSummaries.length === 0) {
    return null;
  }

  const summary = chatSummaries[selectedIndex];

  const statRow = (text: string, icon: React.ReactNode) => (
    <Paper
      elevation={0}
      sx={{
        p: 2.25,
        borderRadius: 2.5,
        bgcolor: "#ffffff",
        border: `1px solid ${alpha(TEXT_MAIN, 0.08)}`,
        display: "flex",
        gap: 2,
        alignItems: "flex-start",
        textAlign: "left",
        transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          borderColor: FEEDBACK_SECTION_CHART_SENT,
          boxShadow: `0 10px 28px -12px ${alpha(TEXT_MAIN, 0.12)}`,
          transform: "translateY(-1px)"
        }
      }}
    >
      <Box
        sx={{
          width: 44,
          minWidth: 44,
          height: 44,
          borderRadius: "14px",
          bgcolor: FEEDBACK_SECTION_CHART_SENT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="body1"
        sx={{
          lineHeight: 1.55,
          color: TEXT_MAIN,
          pt: 0.35,
          fontWeight: 400
        }}
      >
        {text}
      </Typography>
    </Paper>
  );

  return (
    <Box sx={feedbackChartPaletteOuterSx}>
      <Box aria-hidden sx={{ display: "flex", height: 4, width: "100%" }}>
        <Box sx={{ flex: 1, bgcolor: FEEDBACK_SECTION_CHART_SENT }} />
        <Box sx={{ flex: 1, bgcolor: FEEDBACK_SECTION_CHART_RECEIVED }} />
      </Box>
      <Box sx={feedbackChartPaletteHeaderStripSx}>
        <Box sx={{ width: "fit-content", maxWidth: "100%", mb: 2.5 }}>
          <TextField
            select
            size="small"
            label="Conversation"
            value={selectedIndex}
            onChange={e => setSelectedIndex(Number(e.target.value))}
            SelectProps={{
              autoWidth: true
            }}
            sx={{
              width: "fit-content",
              maxWidth: "100%",
              "& .MuiOutlinedInput-root": {
                width: "fit-content",
                maxWidth: "100%",
                borderRadius: 2,
                color: TEXT_MAIN,
                bgcolor: "#ffffff",
                transition: "box-shadow 0.2s ease, background-color 0.2s ease",
                "& fieldset": {
                  borderColor: alpha(TEXT_MAIN, 0.12)
                },
                "&:hover fieldset": {
                  borderColor: alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.35)
                },
                "&.Mui-focused fieldset": {
                  borderColor: FEEDBACK_SECTION_CHART_SENT,
                  borderWidth: "1px"
                },
                "&.Mui-focused": {
                  bgcolor: "#ffffff",
                  boxShadow: `0 0 0 3px ${alpha(FEEDBACK_SECTION_CHART_SENT, 0.22)}`
                }
              },
              "& .MuiSvgIcon-root": {
                color: TEXT_MUTED
              },
              "& .MuiInputLabel-root": {
                color: TEXT_MUTED,
                fontSize: "0.875rem"
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: FEEDBACK_SECTION_CHART_SENT
              },
              "& .MuiSelect-select": {
                minWidth: 0,
                whiteSpace: "nowrap",
                overflow: "visible",
                textOverflow: "clip",
                width: "auto"
              }
            }}
          >
            {chatSummaries.map((s, i) => (
              <MenuItem key={i} value={i} sx={{ py: 1, whiteSpace: "nowrap" }}>
                {s.chatName}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="center" sx={{ mb: 1 }}>
          <Box sx={feedbackChartPaletteIconBoxSx}>
            <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 26, color: FEEDBACK_SECTION_CHART_SENT }} />
          </Box>
          <Box sx={{ textAlign: "left" }}>
            <Typography
              variant="overline"
              sx={{
                display: "block",
                letterSpacing: "0.2em",
                fontWeight: 700,
                fontSize: "0.65rem",
                color: FEEDBACK_SECTION_CHART_SENT
              }}
            >
              Your data
            </Typography>
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: TEXT_MAIN,
                fontSize: { xs: "1.45rem", sm: "1.85rem" },
                lineHeight: 1.2
              }}
            >
              Chat summaries
            </Typography>
          </Box>
        </Stack>
        <Typography
          variant="body2"
          sx={{
            textAlign: "center",
            color: TEXT_MUTED,
            mb: 0,
            maxWidth: 420,
            mx: "auto",
            lineHeight: 1.55
          }}
        >
          Choose a conversation to see how you texted there—messages, quick replies, and streaks.
        </Typography>
      </Box>

      <Box sx={{ ...feedbackSectionBodySx, minHeight: 380 }}>
        <Fade in timeout={220} key={selectedIndex}>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                textAlign: "center",
                color: TEXT_MAIN,
                mb: 3,
                px: 1,
                lineHeight: 1.35,
                fontSize: { xs: "1.15rem", sm: "1.4rem" }
              }}
            >
              {summary.chatName}
            </Typography>
            <Stack spacing={2} sx={{ width: "100%", maxWidth: 560, mx: "auto" }}>
              {statRow(
                `You sent ${summary.donorSentMessages.toLocaleString()} messages and ${summary.donorSentWords.toLocaleString()} words in this chat.`,
                <ForumOutlinedIcon sx={{ color: "#ffffff", fontSize: 24 }} />
              )}
              {statRow(
                `${summary.quickReplyPercentage}% of your replies were in less than a minute.`,
                <BoltOutlinedIcon sx={{ color: "#ffffff", fontSize: 24 }} />
              )}
              {statRow(
                `You had a ${summary.longestStreak} day texting streak.`,
                <LocalFireDepartmentOutlinedIcon sx={{ color: "#ffffff", fontSize: 24 }} />
              )}
            </Stack>
          </Box>
        </Fade>
      </Box>
    </Box>
  );
}
