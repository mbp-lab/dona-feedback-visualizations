import React, { ReactNode, useState } from "react";
import { useTranslations } from "next-intl";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CircularProgress from "@mui/material/CircularProgress";
import StatisticsCard from "@components/StatisticsCard";
import ChartContainer, { ChartType } from "@components/charts/ChartContainer";
import ChartExplanationModal from "@components/charts/ChartExplanationModal";
import MoreChartsModal from "@components/charts/MoreChartsModal";
import { DataSourceValue } from "@models/processed";
import { DailyHourPoint, GraphData } from "@models/graphData";
import GeneralInfoCarousel from "@components/charts/GeneralInfoCarousel";
import ChatSummaryCarousel from "@components/charts/ChatSummaryCarousel";
import ComparisonCarousel from "@components/charts/ComparisonCarousel";
import EventComparisonChart from "@components/charts/EventComparisonChart";
import FullSizeModal from "@components/FullSizeModal";
import { MainTitle } from "@/styles/StyledTypography";

type SectionName = "responseTimes" | "dailyActivityTimes" | "interactionIntensity";

const toMessageData = (points: DailyHourPoint[]) =>
  points.map(p => ({
    dateTime: new Date(p.year, p.month - 1, p.date, p.hour, p.minute),
    wordCount: p.wordCount
  }));

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
  console.log("DataSourceFeedbackSection graphData", graphData);
  let t = useTranslations("feedback");
  const ii = useTranslations("feedback.interactionIntensity");
  const dat = useTranslations("feedback.dailyActivityTimes");
  const rt = useTranslations("feedback.responseTimes");

  // State for ChartExplanationModal
  const [modalContent, setModalContent] = useState<{ title: string; contentHtml: string; imageSrc?: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State for MoreChartsModal
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<SectionName | null>(null);

  const [isScientificModalOpen, setIsScientificModalOpen] = useState(false);

  // Handlers for ChartExplanationModal
  const openExplanationModal = (title: string, contentHtml: string, imageSrc?: string) => {
    setModalContent({ title, contentHtml, imageSrc });
    setIsModalOpen(true);
  };
  const closeExplanationModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
  };

  // Handlers for MoreChartsModal
  const openSectionModal = (section: SectionName) => {
    setCurrentSection(section);
    setIsSectionModalOpen(true);
  };
  const closeSectionModal = () => {
    setIsSectionModalOpen(false);
    setCurrentSection(null);
  };

  const openScientificModal = () => setIsScientificModalOpen(true);
  const closeScientificModal = () => setIsScientificModalOpen(false);

  const openModalSpan = (content: ReactNode, translator: any, chartName: string) => (
    <span
      style={{ color: "blue", textDecoration: "underline", cursor: "pointer" }}
      onClick={() =>
        openExplanationModal(
          translator(translator.has(`${chartName}.title`) ? `${chartName}.title` : "title"),
          translator.raw(`${chartName}.example.text`),
          translator(`${chartName}.example.image`)
        )
      }
    >
      {content}
    </span>
  );

  const renderScientificCharts = () => (
    <Stack
      direction="column"
      spacing={2}
      sx={{ display: "flex", textAlign: "center", bgcolor: "background.paper", p: 2 }} // Added padding for modal
    >
      {/* Message composition */}
      <Typography variant="h6">{t("messageComposition.title")}</Typography>
      {/* TODO: Add media as type */}
      <Box>
        <Typography variant="body1" fontWeight="fontWeightBold">
          {t("messageComposition.messageTypesBarChart.title")}
        </Typography>
        <Typography variant="body2">
          {t.rich("messageComposition.messageTypesBarChart.description", {
            button: label => openModalSpan(label, t, "messageComposition.messageTypesBarChart")
          })}
        </Typography>
      </Box>
      <ChartContainer type={ChartType.MessageTypesBarChart} data={graphData} dataSourceValue={dataSourceValue} />
      {showDetailedAudioFeedback && (
        <>
          <Box>
            <Typography variant="body1" fontWeight="fontWeightBold">
              {t("messageComposition.audioLengthsBarChart.title")}
            </Typography>
            <Typography variant="body2">
              {t.rich("messageComposition.audioLengthsBarChart.description", {
                button: label => openModalSpan(label, t, "messageComposition.audioLengthsBarChart")
              })}
            </Typography>
          </Box>
          <ChartContainer type={ChartType.AudioLengthsBarChart} data={graphData} dataSourceValue={dataSourceValue} />
        </>
      )}
      {/* TODO: Histogram word counts? */}
      {/* Emoji analysis */}
      {graphData.emojiDistribution && (
        <>
          <Box>
            <Typography variant="body1" fontWeight="fontWeightBold">
              {t("messageComposition.emojiBarChart.title")}
            </Typography>
            <Typography variant="body2">
              {t.rich("messageComposition.emojiBarChart.description", {
                button: label => openModalSpan(label, t, "messageComposition.emojiBarChart")
              })}
            </Typography>
          </Box>
          <ChartContainer type={ChartType.EmojiBarChart} data={graphData} dataSourceValue={dataSourceValue} />
        </>
      )}

      {/* Interaction Intensity */}
      <Typography variant="h6">{ii("title")}</Typography>
      <Box>
        <Typography variant="body1" fontWeight="fontWeightBold">
          {ii("animatedIntensityPolarChart.title")}
        </Typography>
        <Typography variant="body2">
          {ii.rich("animatedIntensityPolarChart.description", {
            button: label => openModalSpan(label, ii, "animatedIntensityPolarChart")
          })}
        </Typography>
      </Box>
      <ChartContainer type={ChartType.AnimatedIntensityPolarChart} data={graphData} dataSourceValue={dataSourceValue} />
      <Box>
        <Typography variant="body1" fontWeight="fontWeightBold" sx={{ mt: 2 }}>
          {ii("wordCountSlidingWindowMean.title")}
        </Typography>
        <Typography variant="body2">{ii("wordCountSlidingWindowMean.description")}</Typography>
      </Box>
      <ChartContainer type={ChartType.WordCountSlidingWindowMean} data={graphData} dataSourceValue={dataSourceValue} />
      {showDetailedAudioFeedback && (
        <>
          <Box>
            <Typography variant="body1" fontWeight="fontWeightBold">
              {ii("animatedSecondsPerChatBarChart.title")}
            </Typography>
            <Typography variant="body2">
              {ii.rich("animatedSecondsPerChatBarChart.description", {
                button: label => openModalSpan(label, ii, "animatedSecondsPerChatBarChart")
              })}
            </Typography>
          </Box>
          <ChartContainer type={ChartType.AnimatedSecondsPerChatBarChart} data={graphData} dataSourceValue={dataSourceValue} />
        </>
      )}

      {/* Daily Activity Times */}
      <Typography variant="h6">{dat("title")}</Typography>
      <Box>
        <Typography variant="body2">
          {dat.rich("dailyActivityHoursChart.description", {
            button: label => openModalSpan(label, dat, "dailyActivityHoursChart")
          })}
        </Typography>
      </Box>
      <ChartContainer type={ChartType.DailyActivityHoursChart} data={graphData} dataSourceValue={dataSourceValue} />

      <Box>
        <Typography variant="body1" fontWeight="fontWeightBold" sx={{ mt: 2 }}>
          {dat("dayPartsMonthly.title")}
        </Typography>
        <Typography variant="body2">
          {dat.rich("dayPartsMonthly.description", {
            u: chunks => <u>{chunks}</u>
          })}
        </Typography>
      </Box>
      <ChartContainer type={ChartType.AnimatedDayPartsActivityChart} data={graphData} dataSourceValue={dataSourceValue} />

      {/* Response Times */}
      <Typography variant="h6">{rt("title")}</Typography>
      <Box>
        <Typography variant="body2">
          {rt.rich("responseTimeBarChart.description", {
            button: label => openModalSpan(label, rt, "responseTimeBarChart")
          })}
        </Typography>
      </Box>
      <ChartContainer type={ChartType.ResponseTimeBarChart} data={graphData} dataSourceValue={dataSourceValue} />

      {/* Event-Based Activity Analysis */}
      <Typography variant="h6" sx={{ mt: 3 }}>
        Event-Based Activity Analysis
      </Typography>
      <Box sx={{ textAlign: "left" }}>
        <EventComparisonChart
          sentMessages={toMessageData(graphData.dailySentHours)}
          receivedMessages={toMessageData(graphData.dailyReceivedHours)}
          perChatSentMessages={graphData.dailySentHoursPerConversation.map((points, i) => ({
            chatName: graphData.focusConversations[i] ?? `Chat ${i + 1}`,
            messages: toMessageData(points)
          }))}
          defaultWindowDays={30}
        />
      </Box>

      {/* Social Content Activity */}
      {showContentFeedback && hasContentData && (
        <>
          <Typography variant="h6" sx={{ mt: 3 }}>
            Social Content Activity
          </Typography>
          <Box>
            <Typography variant="body1" fontWeight="fontWeightBold">
              Social Engagement Timeline
            </Typography>
            <Typography variant="body2">Combined view of all your social content activity over time.</Typography>
          </Box>
          <ChartContainer type={ChartType.SocialEngagementTimelineChart} data={graphData} dataSourceValue={dataSourceValue} />
          <Box>
            <Typography variant="body1" fontWeight="fontWeightBold">
              Your Engagement Style
            </Typography>
            <Typography variant="body2">How your activity is distributed across creating, commenting, and reacting.</Typography>
          </Box>
          <ChartContainer type={ChartType.EngagementStyleChart} data={graphData} dataSourceValue={dataSourceValue} />
          {graphData.postStats && (
            <>
              <Box>
                <Typography variant="body1" fontWeight="fontWeightBold">
                  Post Activity
                </Typography>
                <Typography variant="body2">Frequency and composition of your posts over time.</Typography>
              </Box>
              <ChartContainer type={ChartType.PostActivityChart} data={graphData} dataSourceValue={dataSourceValue} />
            </>
          )}
          {graphData.commentStats && (
            <>
              <Box>
                <Typography variant="body1" fontWeight="fontWeightBold">
                  Comment Activity
                </Typography>
                <Typography variant="body2">Your commenting activity over time.</Typography>
              </Box>
              <ChartContainer type={ChartType.CommentActivityChart} data={graphData} dataSourceValue={dataSourceValue} />
            </>
          )}
          {graphData.reactionStats && (
            <>
              <Box>
                <Typography variant="body1" fontWeight="fontWeightBold">
                  Reactions
                </Typography>
                <Typography variant="body2">Breakdown of your reaction types and activity over time.</Typography>
              </Box>
              <ChartContainer type={ChartType.ReactionBreakdownChart} data={graphData} dataSourceValue={dataSourceValue} />
            </>
          )}
        </>
      )}
    </Stack>
  );

  return (
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ArrowDropDownIcon />}>
        <Typography variant="h6">{t("sourceTitle", { source: dataSourceValue })}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ width: "100%", overflowX: "hidden" }}>
        <Stack direction="column" spacing={2} sx={{ display: "flex", textAlign: "center", bgcolor: "background.paper" }}>
          {/* Statistics card 
                    <Typography variant="h6">{t("statisticsCard.title")}</Typography>
                    <StatisticsCard stats={graphData.basicStatistics} />
                    */}

          {/* General Info Carousel */}
          <GeneralInfoCarousel data={graphData} />

          {/* Comparison Carousel */}
          <ComparisonCarousel data={graphData} />

          {/* Chat Summary Carousel */}
          <ChatSummaryCarousel data={graphData} />

          {/* Event-Based Activity Analysis */}
          <Box sx={{ textAlign: "left", mt: 2 }}>
            <EventComparisonChart
              sentMessages={toMessageData(graphData.dailySentHours)}
              receivedMessages={toMessageData(graphData.dailyReceivedHours)}
              perChatSentMessages={graphData.dailySentHoursPerConversation.map((points, i) => ({
                chatName: graphData.focusConversations[i] ?? `Chat ${i + 1}`,
                messages: toMessageData(points)
              }))}
              defaultWindowDays={30}
            />
          </Box>

          {/* Social Content Activity (Posts, Comments, Reactions) */}
          {showContentFeedback && hasContentData && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Social Content Activity
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight="fontWeightBold" sx={{ mb: 1 }}>
                  Social Engagement Timeline
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Combined view of all your social content activity over time.
                </Typography>
                <ChartContainer type={ChartType.SocialEngagementTimelineChart} data={graphData} dataSourceValue={dataSourceValue} />
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight="fontWeightBold" sx={{ mb: 1 }}>
                  Your Engagement Style
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  How your activity is distributed across creating, commenting, and reacting.
                </Typography>
                <ChartContainer type={ChartType.EngagementStyleChart} data={graphData} dataSourceValue={dataSourceValue} />
              </Box>
              {graphData.postStats && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" fontWeight="fontWeightBold" sx={{ mb: 1 }}>
                    Post Activity
                  </Typography>
                  <ChartContainer type={ChartType.PostActivityChart} data={graphData} dataSourceValue={dataSourceValue} />
                </Box>
              )}
              {graphData.commentStats && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" fontWeight="fontWeightBold" sx={{ mb: 1 }}>
                    Comment Activity
                  </Typography>
                  <ChartContainer type={ChartType.CommentActivityChart} data={graphData} dataSourceValue={dataSourceValue} />
                </Box>
              )}
              {graphData.reactionStats && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" fontWeight="fontWeightBold" sx={{ mb: 1 }}>
                    Reactions
                  </Typography>
                  <ChartContainer type={ChartType.ReactionBreakdownChart} data={graphData} dataSourceValue={dataSourceValue} />
                </Box>
              )}
            </Box>
          )}

          <Stack direction="row" spacing={2} sx={{ mt: 2, mb: 2, justifyContent: "center" }}>
            <Button variant="contained" size="large" onClick={openScientificModal}>
              {t("moreScientificPlots")}
            </Button>
            {onDownloadPdf && (
              <Button
                variant="outlined"
                size="large"
                startIcon={isGeneratingPdf ? <CircularProgress size={20} /> : <PictureAsPdfIcon />}
                onClick={onDownloadPdf}
                disabled={isGeneratingPdf}
              >
                {t("downloadPdf")}
              </Button>
            )}
          </Stack>

          <Box className="scientific-charts-pdf" sx={{ display: "none" }}>
            {renderScientificCharts()}
          </Box>
        </Stack>
      </AccordionDetails>

      {/* ChartExplanationModal (remains here, as it's used by the charts inside the new modal) */}
      <ChartExplanationModal
        open={isModalOpen}
        onClose={closeExplanationModal}
        title={modalContent?.title || ""}
        contentHtml={modalContent?.contentHtml || ""}
        imageSrc={modalContent?.imageSrc}
      />

      {/* MoreChartsModal (remains here) */}
      {currentSection && (
        <MoreChartsModal
          open={isSectionModalOpen}
          onClose={closeSectionModal}
          graphData={graphData}
          section={currentSection}
          showDetailedAudioFeedback={showDetailedAudioFeedback}
        />
      )}

      <FullSizeModal open={isScientificModalOpen} onClose={closeScientificModal}>
        {renderScientificCharts()}
      </FullSizeModal>
    </Accordion>
  );
}
