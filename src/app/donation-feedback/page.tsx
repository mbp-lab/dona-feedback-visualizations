"use client";

import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useRef, useState } from "react";

import { useDonation } from "@/context/DonationContext";
import { useRichTranslations } from "@/hooks/useRichTranslations";
import { MainTitle, RichText } from "@/styles/StyledTypography";
import DataSourceFeedbackSection from "@components/DataSourceFeedbackSection";
import LoadingSpinner from "@components/LoadingSpinner";
import { DataSourceValue } from "@models/processed";

import { fetchOrComputeGraphDataByDonationId, getDonationId } from "./actions";

const isFeedbackSurveyEnabled = process.env.NEXT_PUBLIC_FEEDBACK_SURVEY_ENABLED === "true";
const feedbackSurveyLink = process.env.NEXT_PUBLIC_FEEDBACK_SURVEY_LINK;

export default function DonationFeedbackPage() {
  const actions = useTranslations("actions");
  const feedback = useRichTranslations("feedback");
  const { externalDonorId, feedbackData, setDonationData } = useDonation();
  const [isLoading, setIsLoading] = useState(!feedbackData);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const feedbackContentRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();

  useEffect(() => {
    const loadGraphData = async () => {
      if (!feedbackData) {
        try {
          const donationIdFromCookie = await getDonationId();
          if (donationIdFromCookie) {
            const fetchedGraphData = await fetchOrComputeGraphDataByDonationId(donationIdFromCookie);
            setDonationData(donationIdFromCookie, fetchedGraphData);
          }
        } catch (error) {
          console.error("Error fetching graph data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadGraphData();
  }, [feedbackData, setDonationData]);

  const handleContinue = () => {
    window.location.href = isFeedbackSurveyEnabled && feedbackSurveyLink ? `${feedbackSurveyLink}?UID=${externalDonorId}&lang=${locale}` : "/";
  };

  const handleDownloadPdf = async () => {
    const element = feedbackContentRef.current;
    if (!element) return;

    setIsGeneratingPdf(true);

    const savedStyles: { el: HTMLElement; props: Record<string, string> }[] = [];

    const save = (el: HTMLElement, props: Record<string, string>) => {
      const original: Record<string, string> = {};
      for (const key of Object.keys(props)) {
        original[key] = el.style.getPropertyValue(key);
      }
      savedStyles.push({ el, props: original });
      for (const [key, val] of Object.entries(props)) {
        el.style.setProperty(key, val);
      }
    };

    const hide = (el: HTMLElement) => save(el, { display: "none" });

    try {
      // 1) Expand all SwipeableViews carousels to show every slide vertically
      const swipeContainers = element.querySelectorAll<HTMLElement>(".react-swipeable-view-container");
      swipeContainers.forEach(container => {
        save(container, {
          transform: "none",
          "flex-direction": "column",
          transition: "none",
          "will-change": "auto"
        });

        const root = container.parentElement;
        if (root) {
          save(root, { overflow: "visible", height: "auto" });
        }
      });

      // 2) Hide carousel navigation bars (Back/Next buttons + dot indicators)
      swipeContainers.forEach(container => {
        const swipeRoot = container.parentElement;
        if (!swipeRoot) return;
        const carouselBox = swipeRoot.parentElement;
        if (!carouselBox) return;
        Array.from(carouselBox.children).forEach(child => {
          if (child !== swipeRoot) hide(child as HTMLElement);
        });
      });

      // 3) Hide all standalone buttons (e.g. "See more detailed plots")
      element.querySelectorAll<HTMLElement>("button, a.MuiButton-root").forEach(btn => {
        if (btn.closest(".MuiAccordionSummary-root")) return;
        if (btn.closest(".react-swipeable-view-container")) return;
        hide(btn);
      });

      // Wait for layout to settle after DOM changes
      await new Promise(r => setTimeout(r, 200));

      // 4) Collect safe page-break points (DOM px relative to container top)
      const containerRect = element.getBoundingClientRect();
      const breakSet = new Set<number>();
      breakSet.add(0);

      element.querySelectorAll<HTMLElement>(".react-swipeable-view-container > div").forEach(slide => {
        const r = slide.getBoundingClientRect();
        breakSet.add(Math.round(r.top - containerRect.top));
        breakSet.add(Math.round(r.bottom - containerRect.top));
      });

      element.querySelectorAll<HTMLElement>(".MuiAlert-root, .MuiAccordion-root").forEach(block => {
        const r = block.getBoundingClientRect();
        breakSet.add(Math.round(r.top - containerRect.top));
        breakSet.add(Math.round(r.bottom - containerRect.top));
      });

      const breakPoints = [...breakSet].sort((a, b) => a - b);

      // 5) Capture the full expanded content as a high-res PNG
      const pixelRatio = 2;
      const dataUrl = await toPng(element, {
        backgroundColor: "#ffffff",
        pixelRatio,
        filter: (node: HTMLElement) =>
          !node.classList?.contains("download-buttons") && !node.classList?.contains("export-hidden")
      });

      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
      });

      // 6) Build multi-page PDF, slicing only at block boundaries
      const pdfWidthMm = 210;
      const marginMm = 10;
      const contentWidthMm = pdfWidthMm - 2 * marginMm;
      const scale = contentWidthMm / img.width;

      const pdf = new jsPDF("p", "mm", "a4");
      const pageHeightMm = pdf.internal.pageSize.getHeight() - 2 * marginMm;
      const pageHeightDom = pageHeightMm / scale / pixelRatio;

      const totalHeightDom = Math.round(element.scrollHeight);
      let currentY = 0;
      let pageNum = 0;

      while (currentY < totalHeightDom - 1) {
        if (pageNum > 0) pdf.addPage();

        const maxY = currentY + pageHeightDom;

        // Find the last safe break point that fits on this page
        let bestBreak = currentY;
        for (const bp of breakPoints) {
          if (bp > currentY && bp <= maxY) bestBreak = bp;
          if (bp > maxY) break;
        }

        if (bestBreak <= currentY) {
          bestBreak = Math.min(maxY, totalHeightDom);
        }

        const srcY = Math.round(currentY * pixelRatio);
        const sliceH = Math.round((bestBreak - currentY) * pixelRatio);
        if (sliceH <= 0) break;

        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = sliceH;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, srcY, img.width, sliceH, 0, 0, img.width, sliceH);

        pdf.addImage(canvas.toDataURL("image/png"), "PNG", marginMm, marginMm, contentWidthMm, sliceH * scale);

        currentY = bestBreak;
        pageNum++;
      }

      pdf.save("dona-feedback.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      savedStyles.reverse().forEach(({ el, props }) => {
        for (const [key, val] of Object.entries(props)) {
          if (val) {
            el.style.setProperty(key, val);
          } else {
            el.style.removeProperty(key);
          }
        }
      });

      // Force SwipeableViews to recalculate its layout
      window.dispatchEvent(new Event("resize"));

      setIsGeneratingPdf(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ flexGrow: 1 }}>
      <Stack
        spacing={3}
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center"
        }}
      >
        <MainTitle variant="h5">{feedback.t("title")}</MainTitle>

        {/* Loading indicator */}
        {isLoading && <LoadingSpinner message={feedback.t("loading")} />}

        {/* Error fetching required data*/}
        {!isLoading && !feedbackData && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {feedback.t("genericError")}
          </Alert>
        )}

        {feedbackData && (
          <>
            <Box ref={feedbackContentRef} sx={{ width: "100%" }}>
              <Alert severity="info">
                <Typography variant="body1">{feedback.t("importantMessage.title")}</Typography>
                <Typography variant="body2">{feedback.rich("importantMessage.disclaimer")}</Typography>
              </Alert>

              <Box sx={{ width: "100%", textAlign: "left" }}>
                {Object.entries(feedbackData).map(([source, data]) => (
                  <DataSourceFeedbackSection key={source} dataSourceValue={source as DataSourceValue} graphData={data} />
                ))}
              </Box>

              <RichText sx={{ py: 2, textAlign: "center" }}>{feedback.t("thanks")}</RichText>
            </Box>

            <Stack spacing={2} direction="row" sx={{ justifyContent: "center", mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={isGeneratingPdf ? <CircularProgress size={20} /> : <PictureAsPdfIcon />}
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
              >
                {feedback.t("downloadPdf")}
              </Button>
              <Button variant="contained" onClick={handleContinue}>
                {actions("next")}
              </Button>
            </Stack>
          </>
        )}
      </Stack>
    </Container>
  );
}
