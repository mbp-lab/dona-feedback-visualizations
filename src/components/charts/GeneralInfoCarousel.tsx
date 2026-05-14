import React, { useId, useState, useMemo } from "react";
import { Box, Button, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import SwipeableViews from "react-swipeable-views";
import { useLocale, useTranslations } from "next-intl";

import { StatisticsSummaryPanel } from "@components/StatisticsCard";
import { GraphData } from "@models/graphData";
import {
  FEEDBACK_SECTION_CHART_RECEIVED,
  FEEDBACK_SECTION_CHART_RECEIVED_HOVER,
  FEEDBACK_SECTION_CHART_SENT,
  FEEDBACK_SECTION_CHART_SENT_HOVER,
  FEEDBACK_SECTION_SURFACE as SURFACE,
  FEEDBACK_SECTION_TEXT_MAIN as TEXT_MAIN,
  feedbackChartPaletteOuterSx
} from "@components/charts/feedbackSectionTheme";

/** *The Hobbit* (~95k words) — comparison when sent word count is below {@link WORDS_LOTR_THRESHOLD}. */
const HOBBIT_REFERENCE_WORDS = 95_000;
/** Approximate word count for *The Fellowship of the Ring* (first LOTR volume) — comparison from this count upward. */
const FELLOWSHIP_REFERENCE_WORDS = 187_790;
/** Use Hobbit baseline for X &lt; this value; Fellowship baseline for X ≥ this value. */
const WORDS_LOTR_THRESHOLD = 100_000;
/** Assumed typing speed for the “hours to type” estimate. */
const TYPING_WPM = 40;

const PARCHMENT_BG = "linear-gradient(148deg, #faf6ec 0%, #f0e6d0 38%, #e8dcc0 72%, #e3d4b4 100%)";
const BOOK_INK = "#3d2d22";
const BOOK_COVER_EDGE = "#2a1d14";

/** Open-book decoration: parchment + title page; ring (Fellowship) or mountains (Hobbit) on the right page. */
function TolkienOpenBookIllustration({
  variant,
  ariaLabel,
  title,
  author
}: {
  variant: "hobbit" | "fellowship";
  ariaLabel: string;
  title: string;
  author: string;
}) {
  const uid = useId().replace(/:/g, "");
  const gradGold = `frg-${uid}`;
  const gradSheen = `frs-${uid}`;
  const parchmentMid = "#e8dcc0";
  const rule = alpha(BOOK_INK, 0.12);

  const rightDecoration =
    variant === "fellowship" ? (
      <Box
        component="svg"
        viewBox="0 0 100 72"
        xmlns="http://www.w3.org/2000/svg"
        sx={{ width: 100, height: "auto", flexShrink: 0 }}
        aria-hidden
      >
        <defs>
          <radialGradient id={gradGold} cx="42%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#fffef5" />
            <stop offset="35%" stopColor="#e8c547" />
            <stop offset="70%" stopColor="#b8860b" />
            <stop offset="100%" stopColor="#6b5310" />
          </radialGradient>
          <linearGradient id={gradSheen} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="38" rx="34" ry="24" fill={`url(#${gradGold})`} stroke="#5c4810" strokeWidth="1.1" />
        <ellipse cx="50" cy="38" rx="34" ry="24" fill={`url(#${gradSheen})`} stroke="none" />
        <ellipse cx="50" cy="38" rx="14" ry="10" fill={parchmentMid} stroke={alpha("#5c4810", 0.45)} strokeWidth="0.85" />
        <ellipse cx="50" cy="38" rx="34" ry="24" fill="none" stroke={alpha("#fff", 0.35)} strokeWidth="0.6" opacity="0.9" />
      </Box>
    ) : (
      <Box
        component="svg"
        viewBox="0 0 100 72"
        xmlns="http://www.w3.org/2000/svg"
        sx={{ width: 100, height: "auto", flexShrink: 0, opacity: 0.92 }}
        aria-hidden
      >
        <circle cx="76" cy="22" r="7" fill="none" stroke={BOOK_INK} strokeWidth="0.9" opacity="0.65" />
        <polygon points="50,22 62,48 38,48" fill="none" stroke={BOOK_INK} strokeWidth="1.05" strokeLinejoin="round" />
        <polygon points="28,52 42,32 56,52" fill="none" stroke={BOOK_INK} strokeWidth="1.05" strokeLinejoin="round" />
        <polygon points="58,50 72,36 86,52" fill="none" stroke={BOOK_INK} strokeWidth="1" strokeLinejoin="round" />
        <path d="M 18 58 Q 50 48 82 58" fill="none" stroke={BOOK_INK} strokeWidth="0.85" strokeDasharray="3 3" opacity="0.7" />
      </Box>
    );

  return (
    <Box
      role="img"
      aria-label={ariaLabel}
      sx={{
        width: "100%",
        maxWidth: 440,
        mx: "auto",
        mt: 2
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "stretch",
          justifyContent: "center",
          filter: `drop-shadow(0 14px 24px ${alpha("#0f172a", 0.12)})`
        }}
      >
        <Box sx={{ width: { xs: 8, sm: 10 }, bgcolor: BOOK_COVER_EDGE, borderRadius: "8px 0 0 8px", minHeight: 204 }} />
        <Box
          sx={{
            display: "flex",
            flex: 1,
            minHeight: 204,
            maxWidth: 408,
            overflow: "hidden",
            borderRadius: "4px",
            border: `1px solid ${alpha(BOOK_INK, 0.22)}`
          }}
        >
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              background: PARCHMENT_BG,
              px: 1.5,
              py: 2,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 1.25,
              borderRight: `1px solid ${alpha(BOOK_INK, 0.12)}`,
              boxShadow: `inset -8px 0 16px ${alpha("#000", 0.05)}`
            }}
          >
            {[0, 1, 2, 3, 4].map(i => (
              <Box key={i} sx={{ height: 1, bgcolor: rule, opacity: 0.85, width: "88%", mx: "auto", borderRadius: 1 }} />
            ))}
          </Box>
          <Box
            sx={{
              width: 12,
              flexShrink: 0,
              background: `linear-gradient(90deg, ${alpha("#000", 0.14)} 0%, ${alpha("#000", 0.04)} 45%, ${alpha("#000", 0.14)} 100%)`,
              boxShadow: `inset 0 0 10px ${alpha("#000", 0.12)}`
            }}
          />
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              background: PARCHMENT_BG,
              px: { xs: 1.25, sm: 1.75 },
              py: 1.75,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              boxShadow: `inset 8px 0 16px ${alpha("#000", 0.05)}`
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Georgia", "Times New Roman", serif',
                fontWeight: 700,
                fontSize: { xs: "0.72rem", sm: "0.82rem" },
                color: "#1f1410",
                letterSpacing: "0.03em",
                lineHeight: 1.35,
                textShadow: "0 1px 0 rgba(255,255,255,0.35)",
                mb: 0.75
              }}
            >
              {title}
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Georgia", "Times New Roman", serif',
                fontSize: { xs: "0.68rem", sm: "0.76rem" },
                color: alpha("#1f1410", 0.88),
                fontStyle: "italic",
                mb: 1.25
              }}
            >
              {author}
            </Typography>
            {rightDecoration}
          </Box>
        </Box>
        <Box sx={{ width: { xs: 8, sm: 10 }, bgcolor: BOOK_COVER_EDGE, borderRadius: "0 8px 8px 0", minHeight: 204 }} />
      </Box>
    </Box>
  );
}

interface GeneralInfoCarouselProps {
  data: GraphData;
  isWhatsApp?: boolean;
}

export default function GeneralInfoCarousel({ data, isWhatsApp = false }: GeneralInfoCarouselProps) {
  const theme = useTheme();
  const locale = useLocale();
  const t = useTranslations("feedback.generalInfoCarousel");
  const tNav = useTranslations("feedback.comparisonCarousel");
  const [activeStep, setActiveStep] = useState(0);
  const maxSteps = 2;

  const { sentWords } = useMemo(() => {
    return {
      sentWords: data.basicStatistics?.wordsTotal?.sent ?? 0
    };
  }, [data]);

  const useFellowshipComparison = sentWords >= WORDS_LOTR_THRESHOLD;

  const fellowshipPercent = useMemo(() => Math.round((sentWords / FELLOWSHIP_REFERENCE_WORDS) * 100), [sentWords]);

  const hobbitPercent = useMemo(() => Math.round((sentWords / HOBBIT_REFERENCE_WORDS) * 100), [sentWords]);

  const bookPercent = useFellowshipComparison ? fellowshipPercent : hobbitPercent;

  const typingHours = useMemo(() => {
    const h = sentWords / (TYPING_WPM * 60);
    return Math.round(h * 10) / 10;
  }, [sentWords]);

  const handleNext = () => setActiveStep(prev => (prev + 1) % maxSteps);
  const handleBack = () => setActiveStep(prev => (prev - 1 + maxSteps) % maxSteps);
  const handleStepChange = (step: number) => setActiveStep(step);

  const slideBoxStyles = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: 460,
    p: 4,
    textAlign: "center",
    bgcolor: SURFACE,
    color: TEXT_MAIN,
    borderLeft: `1px solid ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.22)}`,
    borderRight: `1px solid ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.22)}`
  };

  const wordsFmt = sentWords.toLocaleString(locale);

  return (
    <Box sx={feedbackChartPaletteOuterSx}>
      <Box aria-hidden sx={{ display: "flex", height: 4, width: "100%" }}>
        <Box sx={{ flex: 1, bgcolor: FEEDBACK_SECTION_CHART_SENT }} />
        <Box sx={{ flex: 1, bgcolor: FEEDBACK_SECTION_CHART_RECEIVED }} />
      </Box>
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          pt: 2.5,
          pb: 2,
          textAlign: "center",
          bgcolor: SURFACE,
          color: TEXT_MAIN,
          borderLeft: `1px solid ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.22)}`,
          borderRight: `1px solid ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.22)}`,
          borderBottom: `1px solid ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.14)}`
        }}
      >
        <Typography
          variant="overline"
          sx={{
            display: "block",
            letterSpacing: "0.2em",
            fontWeight: 700,
            fontSize: "0.65rem",
            color: FEEDBACK_SECTION_CHART_SENT,
            mb: 0.75
          }}
        >
          {tNav("cardOverline")}
        </Typography>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: TEXT_MAIN,
            fontSize: { xs: "1.35rem", sm: "1.75rem" },
            lineHeight: 1.2,
            mb: 0
          }}
        >
          {t("introTitle")}
        </Typography>
      </Box>
      <SwipeableViews
        axis={theme.direction === "rtl" ? "x-reverse" : "x"}
        index={activeStep}
        onChangeIndex={handleStepChange}
        enableMouseEvents
      >
        {/* slide 1: message totals + postcard (overview panel) */}
        <Box
          key="message-totals"
          sx={{
            ...slideBoxStyles,
            justifyContent: "flex-start",
            alignItems: "stretch",
            py: 2,
            px: { xs: 1.5, sm: 2 },
            overflow: "hidden",
            minHeight: 0
          }}
        >
          <Box
            sx={{
              flex: "1 1 auto",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              width: "100%"
            }}
          >
            <StatisticsSummaryPanel stats={data.basicStatistics} isWhatsApp={isWhatsApp} fillHeight />
          </Box>
        </Box>

        {/* slide 2: word count — book metaphor (Hobbit if X &lt; 100k, Fellowship if X ≥ 100k) */}
        <Box
          key="words"
          sx={{
            ...slideBoxStyles,
            justifyContent: "flex-start",
            py: 3,
            overflowY: "auto"
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: 540,
              mx: "auto",
              textAlign: "center",
              px: { xs: 1, sm: 1.5 },
              py: { xs: 0.5, sm: 0.75 },
              bgcolor: "transparent"
            }}
          >
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, color: TEXT_MAIN, mb: 2, fontSize: { xs: "1.2rem", sm: "1.5rem" }, lineHeight: 1.3 }}
            >
              {t("wordsBookHeading")}
            </Typography>
            <Typography component="p" variant="body1" sx={{ color: TEXT_MAIN, mb: 1.5, lineHeight: 1.65 }}>
              {t("wordsBookLine1a")}
              <Box component="span" sx={{ fontWeight: 800, color: FEEDBACK_SECTION_CHART_SENT }}>
                {wordsFmt}
              </Box>
              {t("wordsBookLine1b")}
              <Box component="span" sx={{ fontWeight: 800, color: FEEDBACK_SECTION_CHART_SENT }}>
                {bookPercent}
              </Box>
              {useFellowshipComparison ? t("wordsBookLine1cFellowship") : t("wordsBookLine1cHobbit")}
            </Typography>
            <Typography component="p" variant="body1" sx={{ color: TEXT_MAIN, mb: 2, lineHeight: 1.65 }}>
              {t("wordsBookTypingA")}
              <Box component="span" sx={{ fontWeight: 700, color: FEEDBACK_SECTION_CHART_RECEIVED }}>
                {typingHours.toLocaleString(locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 })}
              </Box>
              {t("wordsBookTypingB")}
            </Typography>
            <TolkienOpenBookIllustration
              variant={useFellowshipComparison ? "fellowship" : "hobbit"}
              ariaLabel={useFellowshipComparison ? t("wordsBookDecorAriaFellowship") : t("wordsBookDecorAriaHobbit")}
              title={useFellowshipComparison ? t("wordsBookCoverTitleFellowship") : t("wordsBookCoverTitleHobbit")}
              author={t("wordsBookCoverAuthor")}
            />
            {useFellowshipComparison && fellowshipPercent >= 100 ? (
              <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 800, color: FEEDBACK_SECTION_CHART_SENT, letterSpacing: "0.02em" }}>
                {t("wordsBookImpressiveFellowship")}
              </Typography>
            ) : null}
            {!useFellowshipComparison && hobbitPercent >= 100 ? (
              <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 800, color: FEEDBACK_SECTION_CHART_SENT, letterSpacing: "0.02em" }}>
                {t("wordsBookImpressiveHobbit")}
              </Typography>
            ) : null}
          </Box>
        </Box>
      </SwipeableViews>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2,
          bgcolor: alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.06),
          borderTop: `1px solid ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.22)}`
        }}
      >
        <Button
          onClick={handleBack}
          variant="contained"
          sx={{
            bgcolor: FEEDBACK_SECTION_CHART_RECEIVED,
            "&:hover": { bgcolor: FEEDBACK_SECTION_CHART_RECEIVED_HOVER }
          }}
        >
          {tNav("back")}
        </Button>
        <Box sx={{ display: "flex", gap: 1 }}>
          {[...Array(maxSteps)].map((_, index) => (
            <Box
              key={index}
              onClick={() => handleStepChange(index)}
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: activeStep === index ? FEEDBACK_SECTION_CHART_SENT : alpha(TEXT_MAIN, 0.14),
                cursor: "pointer",
                transition: "background-color 0.3s, transform 0.2s",
                transform: activeStep === index ? "scale(1.12)" : "scale(1)",
                boxShadow: activeStep === index ? `0 0 0 2px ${alpha(FEEDBACK_SECTION_CHART_RECEIVED, 0.4)}` : "none"
              }}
            />
          ))}
        </Box>
        <Button
          onClick={handleNext}
          variant="contained"
          sx={{
            bgcolor: FEEDBACK_SECTION_CHART_SENT,
            "&:hover": { bgcolor: FEEDBACK_SECTION_CHART_SENT_HOVER }
          }}
        >
          {tNav("next")}
        </Button>
      </Box>
    </Box>
  );
}
