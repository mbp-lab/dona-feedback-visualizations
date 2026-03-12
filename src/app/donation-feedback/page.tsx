"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
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
    window.location.href =
      isFeedbackSurveyEnabled && feedbackSurveyLink ? `${feedbackSurveyLink}?UID=${externalDonorId}&lang=${locale}` : "/";
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

        const carouselBox = root?.parentElement;
        if (carouselBox) {
          save(carouselBox, { overflow: "visible" });
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

      // 4) Reveal the hidden scientific charts so they appear in the PDF
      element.querySelectorAll<HTMLElement>(".scientific-charts-pdf").forEach(section => {
        save(section, { display: "block" });
      });

      // Trigger resize so Chart.js instances render at their correct dimensions
      window.dispatchEvent(new Event("resize"));

      // Wait for layout to settle and charts to render
      await new Promise(r => setTimeout(r, 1000));

      // 5) Collect atomic blocks BEFORE capture (same DOM state toPng will clone)
      const containerRect = element.getBoundingClientRect();
      const domHeight = element.scrollHeight;
      const atomicBlocks: { top: number; bottom: number }[] = [];

      const addBlock = (el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        if (r.height > 0) {
          atomicBlocks.push({
            top: Math.round(r.top - containerRect.top),
            bottom: Math.round(r.bottom - containerRect.top)
          });
        }
      };

      element.querySelectorAll<HTMLElement>(".react-swipeable-view-container > div").forEach(addBlock);
      element.querySelectorAll<HTMLElement>(".MuiAlert-root").forEach(addBlock);
      element.querySelectorAll<HTMLElement>(".MuiCard-root").forEach(addBlock);
      element.querySelectorAll<HTMLElement>(".scientific-charts-pdf .MuiStack-root > *").forEach(el => {
        if (el.getBoundingClientRect().height > 30) addBlock(el);
      });

      atomicBlocks.sort((a, b) => a.top - b.top);

      // 6) Capture the full expanded content as a high-res PNG
      const pixelRatio = 2;
      const dataUrl = await toPng(element, {
        backgroundColor: "#ffffff",
        pixelRatio,
        filter: (node: HTMLElement) => !node.classList?.contains("download-buttons") && !node.classList?.contains("export-hidden")
      });

      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
      });

      // Proportional mapping from DOM-Y to image-Y to handle any height drift
      const domToImg = img.height / domHeight;

      // 7) Build multi-page PDF, never splitting an atomic block
      const pdfWidthMm = 210;
      const marginMm = 10;
      const contentWidthMm = pdfWidthMm - 2 * marginMm;
      const scaleMm = contentWidthMm / img.width;

      const pdf = new jsPDF("p", "mm", "a4");
      const pageHeightMm = pdf.internal.pageSize.getHeight() - 2 * marginMm;
      const pageHeightDom = (pageHeightMm * containerRect.width) / contentWidthMm;
      const BUFFER = 20;

      let currentY = 0;
      let pageNum = 0;

      while (currentY < domHeight - 1) {
        if (pageNum > 0) pdf.addPage();

        const maxY = currentY + pageHeightDom;
        let cutAt = Math.min(maxY, domHeight);

        // Pass 1: push cutAt before any block whose bottom extends beyond the page
        for (const block of atomicBlocks) {
          if (block.bottom <= currentY) continue;
          if (block.top >= cutAt) continue;
          if (block.bottom > maxY - BUFFER && block.top > currentY) {
            cutAt = Math.min(cutAt, block.top);
          }
        }

        // Pass 2: keep pushing cutAt earlier if it lands inside any block
        let settled = false;
        while (!settled) {
          settled = true;
          for (const block of atomicBlocks) {
            if (block.top >= cutAt) break;
            if (block.bottom <= currentY) continue;
            if (block.top < cutAt && block.bottom > cutAt && block.top > currentY) {
              cutAt = block.top;
              settled = false;
              break;
            }
          }
        }

        if (cutAt <= currentY) cutAt = Math.min(maxY, domHeight);

        // Map DOM coordinates to image coordinates via proportional scale
        const imgY0 = Math.round(currentY * domToImg);
        const imgY1 = Math.round(cutAt * domToImg);
        const sliceH = imgY1 - imgY0;
        if (sliceH <= 0) break;

        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = sliceH;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, imgY0, img.width, sliceH, 0, 0, img.width, sliceH);

        pdf.addImage(canvas.toDataURL("image/png"), "PNG", marginMm, marginMm, contentWidthMm, sliceH * scaleMm);

        currentY = cutAt;
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
                  <DataSourceFeedbackSection
                    key={source}
                    dataSourceValue={source as DataSourceValue}
                    graphData={data}
                    onDownloadPdf={handleDownloadPdf}
                    isGeneratingPdf={isGeneratingPdf}
                  />
                ))}
              </Box>

              <RichText sx={{ py: 2, textAlign: "center" }}>{feedback.t("thanks")}</RichText>
            </Box>

            <Button variant="contained" onClick={handleContinue} sx={{ mt: 2 }}>
              {actions("next")}
            </Button>
          </>
        )}
      </Stack>
    </Container>
  );
}
