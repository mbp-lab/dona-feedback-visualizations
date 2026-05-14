import React, { ReactNode, useState } from "react";
import { useTranslations } from "next-intl";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import ChartContainer, { ChartType } from "@components/charts/ChartContainer";
import ChartExplanationModal from "@components/charts/ChartExplanationModal";
import {
  FEEDBACK_SECTION_CHART_RECEIVED,
  FEEDBACK_SECTION_CHART_SENT,
  FEEDBACK_SECTION_SURFACE as SURFACE,
  FEEDBACK_SECTION_TEXT_MAIN as TEXT_MAIN,
  FEEDBACK_SECTION_TEXT_MUTED as TEXT_MUTED,
  feedbackChartControlOutlinedButtonSx,
  feedbackChartPaletteHeaderStripSx,
  feedbackChartPaletteIconBoxSx,
  feedbackChartPaletteOuterSx,
  feedbackSectionBodySx,
  feedbackPlotPanelSx
} from "@components/charts/feedbackSectionTheme";
import { DataSourceValue } from "@models/processed";
import { GraphData } from "@models/graphData";
import GeneralInfoCarousel from "@components/charts/GeneralInfoCarousel";
import ComparisonCarousel from "@components/charts/ComparisonCarousel";
import ChatActivitySection from "@components/charts/ChatActivitySection";
import LifeEventActivitySection from "@components/charts/LifeEventActivitySection";

export default function DataSourceFeedbackSection({
  dataSourceValue,
  graphData,
  onDownloadPdf,
  isGeneratingPdf
}: {
  dataSourceValue: DataSourceValue;
  graphData: GraphData;
  onDownloadPdf?: () => void;
  isGeneratingPdf?: boolean;
}) {
  const showDetailedAudioFeedback = [DataSourceValue.Facebook, DataSourceValue.Instagram].includes(dataSourceValue);
  const showContentFeedback = [DataSourceValue.Facebook, DataSourceValue.Instagram].includes(dataSourceValue);
  const hasContentData = !!(graphData.postStats || graphData.commentStats || graphData.reactionStats);
  const showMessageComposition = showDetailedAudioFeedback || !!graphData.emojiDistribution;
  console.log("DataSourceFeedbackSection graphData", graphData);
  const t = useTranslations("feedback");
  const socialT = useTranslations("feedback.socialContent");

  const [modalContent, setModalContent] = useState<{ title: string; contentHtml: string; imageSrc?: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openExplanationModal = (title: string, contentHtml: string, imageSrc?: string) => {
    setModalContent({ title, contentHtml, imageSrc });
    setIsModalOpen(true);
  };
  const closeExplanationModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
  };

  const openModalSpan = (content: ReactNode, translator: any, chartName: string, linkColor: string = FEEDBACK_SECTION_CHART_SENT) => (
    <Box
      component="span"
      sx={{
        color: linkColor,
        textDecoration: "underline",
        cursor: "pointer",
        "&:hover": { color: alpha(linkColor, 0.85) }
      }}
      onClick={() =>
        openExplanationModal(
          translator(translator.has(`${chartName}.title`) ? `${chartName}.title` : "title"),
          translator.raw(`${chartName}.example.text`),
          translator(`${chartName}.example.image`)
        )
      }
    >
      {content}
    </Box>
  );

  return (
    <Accordion
      defaultExpanded
      elevation={0}
      sx={{
        bgcolor: "#ffffff",
        borderRadius: 2,
        border: `1px solid ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.45)}`,
        boxShadow: `0 2px 12px ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.12)}, 0 2px 8px ${alpha(TEXT_MAIN, 0.04)}`,
        "&:before": { display: "none" }
      }}
    >
      <AccordionSummary
        expandIcon={<ArrowDropDownIcon sx={{ color: FEEDBACK_SECTION_CHART_SENT }} />}
        sx={{
          px: 2,
          bgcolor: alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.06),
          borderBottom: `1px solid ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.22)}`,
          "& .MuiAccordionSummary-content": { my: 1.25 }
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_MAIN }}>
          {t("sourceTitle", { source: dataSourceValue })}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ width: "100%", overflowX: "hidden", bgcolor: SURFACE, px: { xs: 1, sm: 1.5 }, py: 2 }}>
        <Stack direction="column" spacing={3} sx={{ display: "flex", textAlign: "center" }}>
          <GeneralInfoCarousel data={graphData} isWhatsApp={dataSourceValue === DataSourceValue.WhatsApp} />

          <ComparisonCarousel data={graphData} />

          {showMessageComposition && (
            <Box sx={feedbackChartPaletteOuterSx}>
              <Box aria-hidden sx={{ display: "flex", height: 4, width: "100%" }}>
                <Box sx={{ flex: 1, bgcolor: FEEDBACK_SECTION_CHART_SENT }} />
                <Box sx={{ flex: 1, bgcolor: FEEDBACK_SECTION_CHART_RECEIVED }} />
              </Box>
              <Box sx={feedbackChartPaletteHeaderStripSx}>
                <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="center" sx={{ mb: 1 }}>
                  <Box sx={feedbackChartPaletteIconBoxSx}>
                    <EditNoteOutlinedIcon sx={{ fontSize: 26, color: FEEDBACK_SECTION_CHART_SENT }} />
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
                      {t("messageComposition.cardOverline")}
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
                      {t("messageComposition.title")}
                    </Typography>
                  </Box>
                </Stack>
                <Typography variant="body2" sx={{ textAlign: "center", color: TEXT_MUTED, maxWidth: 520, mx: "auto", lineHeight: 1.55 }}>
                  {t("messageComposition.cardIntro")}
                </Typography>
              </Box>
              <Box sx={feedbackSectionBodySx}>
                <Stack
                  spacing={3}
                  divider={
                    showDetailedAudioFeedback && graphData.emojiDistribution ? (
                      <Divider flexItem sx={{ borderColor: alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.22) }} />
                    ) : undefined
                  }
                  sx={{ width: "100%" }}
                >
                  {showDetailedAudioFeedback && (
                    <Box sx={{ ...feedbackPlotPanelSx, display: "flex", flexDirection: "column", alignItems: "stretch" }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, textAlign: "center", color: TEXT_MAIN }}>
                        {t("messageComposition.audioLengthsBarChart.title")}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2, textAlign: "center", color: TEXT_MAIN }}>
                        {t.rich("messageComposition.audioLengthsBarChart.description", {
                          button: label => openModalSpan(label, t, "messageComposition.audioLengthsBarChart")
                        })}
                      </Typography>
                      <ChartContainer type={ChartType.AudioLengthsBarChart} data={graphData} dataSourceValue={dataSourceValue} />
                    </Box>
                  )}
                  {graphData.emojiDistribution && (
                    <Box sx={{ ...feedbackPlotPanelSx, display: "flex", flexDirection: "column", alignItems: "stretch" }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, textAlign: "center", color: TEXT_MAIN }}>
                        {t("messageComposition.emojiBarChart.title")}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2, textAlign: "center", color: TEXT_MAIN }}>
                        {t.rich("messageComposition.emojiBarChart.description", {
                          button: label => openModalSpan(label, t, "messageComposition.emojiBarChart")
                        })}
                      </Typography>
                      <ChartContainer type={ChartType.EmojiBarChart} data={graphData} dataSourceValue={dataSourceValue} />
                    </Box>
                  )}
                </Stack>
              </Box>
            </Box>
          )}

          <ChatActivitySection graphData={graphData} />

          <LifeEventActivitySection graphData={graphData} />

          {showContentFeedback && hasContentData && (
            <Box sx={feedbackChartPaletteOuterSx}>
              <Box aria-hidden sx={{ display: "flex", height: 4, width: "100%" }}>
                <Box sx={{ flex: 1, bgcolor: FEEDBACK_SECTION_CHART_SENT }} />
                <Box sx={{ flex: 1, bgcolor: FEEDBACK_SECTION_CHART_RECEIVED }} />
              </Box>
              <Box sx={feedbackChartPaletteHeaderStripSx}>
                <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="center" sx={{ mb: 1 }}>
                  <Box sx={feedbackChartPaletteIconBoxSx}>
                    <PublicOutlinedIcon sx={{ fontSize: 26, color: FEEDBACK_SECTION_CHART_SENT }} />
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
                      {socialT("cardOverline")}
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
                      {socialT("title")}
                    </Typography>
                  </Box>
                </Stack>
                <Typography variant="body2" sx={{ textAlign: "center", color: TEXT_MUTED, maxWidth: 520, mx: "auto", lineHeight: 1.55 }}>
                  {socialT("intro")}
                </Typography>
              </Box>
              <Box sx={feedbackSectionBodySx}>
                <Stack
                  spacing={3}
                  divider={<Divider flexItem sx={{ borderColor: alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.22) }} />}
                  sx={{ width: "100%" }}
                >
                  <Box sx={{ ...feedbackPlotPanelSx, display: "flex", flexDirection: "column", alignItems: "stretch" }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, textAlign: "center", color: TEXT_MAIN }}>
                      {socialT("timelineTitle")}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, textAlign: "center", color: TEXT_MUTED }}>
                      {socialT("timelineIntro")}
                    </Typography>
                    <ChartContainer type={ChartType.SocialEngagementTimelineChart} data={graphData} dataSourceValue={dataSourceValue} />
                  </Box>
                  <Box sx={{ ...feedbackPlotPanelSx, display: "flex", flexDirection: "column", alignItems: "stretch" }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, textAlign: "center", color: TEXT_MAIN }}>
                      {socialT("styleTitle")}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, textAlign: "center", color: TEXT_MUTED }}>
                      {socialT("styleIntro")}
                    </Typography>
                    <ChartContainer type={ChartType.EngagementStyleChart} data={graphData} dataSourceValue={dataSourceValue} />
                  </Box>
                  {graphData.postStats && (
                    <Box sx={{ ...feedbackPlotPanelSx, display: "flex", flexDirection: "column", alignItems: "stretch" }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, textAlign: "center", color: TEXT_MAIN }}>
                        {socialT("postsTitle")}
                      </Typography>
                      <ChartContainer type={ChartType.PostActivityChart} data={graphData} dataSourceValue={dataSourceValue} />
                    </Box>
                  )}
                  {graphData.commentStats && (
                    <Box sx={{ ...feedbackPlotPanelSx, display: "flex", flexDirection: "column", alignItems: "stretch" }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, textAlign: "center", color: TEXT_MAIN }}>
                        {socialT("commentsTitle")}
                      </Typography>
                      <ChartContainer type={ChartType.CommentActivityChart} data={graphData} dataSourceValue={dataSourceValue} />
                    </Box>
                  )}
                  {graphData.reactionStats && (
                    <Box sx={{ ...feedbackPlotPanelSx, display: "flex", flexDirection: "column", alignItems: "stretch" }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, textAlign: "center", color: TEXT_MAIN }}>
                        {socialT("reactionsTitle")}
                      </Typography>
                      <ChartContainer type={ChartType.ReactionBreakdownChart} data={graphData} dataSourceValue={dataSourceValue} />
                    </Box>
                  )}
                </Stack>
              </Box>
            </Box>
          )}

          {onDownloadPdf && (
            <Stack direction="row" spacing={2} sx={{ pt: 1, pb: 1, justifyContent: "center" }}>
              <Button
                variant="outlined"
                size="large"
                startIcon={isGeneratingPdf ? <CircularProgress size={20} /> : <PictureAsPdfIcon />}
                onClick={onDownloadPdf}
                disabled={isGeneratingPdf}
                sx={feedbackChartControlOutlinedButtonSx}
              >
                {t("downloadPdf")}
              </Button>
            </Stack>
          )}
        </Stack>
      </AccordionDetails>

      <ChartExplanationModal
        open={isModalOpen}
        onClose={closeExplanationModal}
        title={modalContent?.title || ""}
        contentHtml={modalContent?.contentHtml || ""}
        imageSrc={modalContent?.imageSrc}
      />
    </Accordion>
  );
}
