"use client";

import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";

import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import DonationDataSelector from "@components/DonationDataSelector";
import { useDonation } from "@/context/DonationContext";
import { LinkButton } from "@/components/LinkButton";

import { useRichTranslations } from "@/hooks/useRichTranslations";
import produceGraphData from "@/services/charts/produceGraphData";
import { useAliasConfig } from "@/services/parsing/shared/aliasConfig";
import { MainTitle, RichText } from "@/styles/StyledTypography";
import { FacebookIcon, IMessageIcon, InstagramIcon, WhatsAppIcon } from "@components/CustomIcon";
import { Conversation, DataSourceValue, Post, Comment, Reaction } from "@models/processed";
import { ContentData } from "@components/DonationDataSelector";
import { getErrorMessage } from "@services/errors";

import { appendConversationBatch, appendContentData, finalizeDonation, logClientError, startDonation } from "./actions";
import { calculateDonationStats } from "@services/donationStats";

const CONVERSATION_BATCH_SIZE = 250;

type ConversationsBySource = Record<DataSourceValue, Conversation[]>;
type SelectedChatsBySource = Record<DataSourceValue, Set<string>>;
type ContentDataBySource = Record<DataSourceValue, ContentData>;

export default function DataDonationPage() {
  const router = useRouter();
  const actions = useTranslations("actions");
  const donation = useRichTranslations("donation");
  const donorStrings = useRichTranslations("donorId");
  const aliasConfig = useAliasConfig();
  const { setDonationData, loadExternalDonorIdFromCookie, externalDonorId } = useDonation();
  const [allDonatedConversationsBySource, setAllDonatedConversationsBySource] = useState<ConversationsBySource>(
    {} as ConversationsBySource
  );
  const [feedbackChatsBySource, setFeedbackChatsBySource] = useState<SelectedChatsBySource>({} as SelectedChatsBySource);
  const [contentDataBySource, setContentDataBySource] = useState<ContentDataBySource>({} as ContentDataBySource);
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State for batch progress display
  const [totalBatches, setTotalBatches] = useState<number>(0);
  const [currentBatchIndex, setCurrentBatchIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!externalDonorId) {
      loadExternalDonorIdFromCookie();
    }
  }, [externalDonorId]);

  const handleDonatedConversationsChange = (dataSource: DataSourceValue, newConversations: Conversation[]) => {
    setAllDonatedConversationsBySource(prev => ({
      ...prev,
      [dataSource]: newConversations
    }));
    setValidated(true);
  };

  const handleFeedbackChatsChange = (dataSource: DataSourceValue, newFeedbackChats: Set<string>) => {
    setFeedbackChatsBySource(prev => ({
      ...prev,
      [dataSource]: newFeedbackChats
    }));
  };

  const handleContentDataChange = (dataSource: DataSourceValue, contentData: ContentData) => {
    setContentDataBySource(prev => ({
      ...prev,
      [dataSource]: contentData
    }));
  };

  const onDataDonationUpload = async () => {
    document.body.scrollTo(0, 0);
    setLoading(true);
    setErrorMessage(null);

    const allConversations = Object.entries(allDonatedConversationsBySource).flatMap(([dataSource, conversations]) => {
      const feedbackChats = feedbackChatsBySource[dataSource as DataSourceValue] || new Set();
      return conversations.map(conversation => ({
        ...conversation,
        focusInFeedback: feedbackChats.has(conversation.conversationPseudonym)
      }));
    });

    if (allConversations.length > 0) {
      console.log(`[DONATION] Starting donation with ${allConversations.length} conversations.`);
      try {
        // Calculate donation stats for logging
        const stats = calculateDonationStats(allConversations);

        // 1) Start donation and get IDs
        const start = await startDonation(externalDonorId, stats);
        if (!start.success || !start.data) throw start.error;
        const { donationId, donorId } = start.data;

        // 2) Append in batches
        const total = Math.ceil(allConversations.length / CONVERSATION_BATCH_SIZE);
        setTotalBatches(total); // set total batches for UI
        for (let i = 0; i < allConversations.length; i += CONVERSATION_BATCH_SIZE) {
          const batchNumber = Math.floor(i / CONVERSATION_BATCH_SIZE) + 1;
          setCurrentBatchIndex(batchNumber); // update current batch for UI
          const batch = allConversations.slice(i, i + CONVERSATION_BATCH_SIZE);
          console.log(`[DONATION] Uploading batch ${batchNumber}/${total} (size=${batch.length})`);
          const res = await appendConversationBatch(donationId, donorId, batch, aliasConfig.donorAlias);
          if (!res.success) throw res.error;
        }

        // 2b) Upload posts, comments, reactions
        const allPosts = Object.values(contentDataBySource).flatMap(cd => cd.posts ?? []);
        const allComments = Object.values(contentDataBySource).flatMap(cd => cd.comments ?? []);
        const allReactions = Object.values(contentDataBySource).flatMap(cd => cd.reactions ?? []);
        if (allPosts.length > 0 || allComments.length > 0 || allReactions.length > 0) {
          const contentRes = await appendContentData(donationId, allPosts, allComments, allReactions);
          if (!contentRes.success) throw contentRes.error;
        }

        // 3) Compute graph data client-side and finalize
        const graphDataRecord = produceGraphData(aliasConfig.donorAlias, allConversations, allPosts, allComments, allReactions);
        const fin = await finalizeDonation(donationId, graphDataRecord as any);
        if (!fin.success || !fin.data) throw fin.error;

        setDonationData(fin.data.donationId, graphDataRecord);
        router.push("/donation-feedback");
      } catch (err) {
        console.log("[DONATION] Error during donation:", err);
        await logClientError(
          err,
          `onDataDonationUpload - ${totalBatches === 0 ? "before startDonation" : `after startDonation, before batch ${currentBatchIndex || 1}/${totalBatches}`}`
        );
        setErrorMessage(getErrorMessage(donation.t, err as any));
      } finally {
        // clear batch UI state and loading
        setCurrentBatchIndex(null);
        setTotalBatches(0);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ flexGrow: 1, position: "relative" }}>
      {/* Full-page overlay to freeze the page */}
      {loading && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            zIndex: 9999,
            pointerEvents: "none"
          }}
        />
      )}

      <Stack
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center"
        }}
      >
        <MainTitle variant="h4">{donation.t("selectData.title")}</MainTitle>

        <RichText>
          {donorStrings.t("yourId")}: {externalDonorId}
        </RichText>

        {/* Loading spinner and alert  */}
        {loading && (
          <Stack spacing={2} sx={{ zIndex: 10000, alignItems: "center" }}>
            <CircularProgress color="inherit" />
            <Alert severity="info">
              {donation.t("sendingWait")}
              {/* Show batch progress only when there are multiple batches */}
              {totalBatches > 1 && currentBatchIndex != null && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {donation.t("sendingBatchProgress", {
                    current: currentBatchIndex,
                    total: totalBatches
                  })}
                </Typography>
              )}
            </Alert>
          </Stack>
        )}

        {errorMessage && !loading && <Alert severity="error">{errorMessage}</Alert>}

        {!errorMessage && !loading && (
          <Box>
            <RichText>{donation.t("selectData.body1")}</RichText>
            <RichText>{donation.rich("selectData.body2")}</RichText>
          </Box>
        )}
        <Box sx={{ my: 4, minWidth: "80%", textAlign: "left" }}>
          {[DataSourceValue.WhatsApp, DataSourceValue.Facebook, DataSourceValue.Instagram, DataSourceValue.IMessage].map(source => (
            <Accordion key={source} sx={{ my: 1 }}>
              <AccordionSummary expandIcon={<ArrowDropDownIcon />}>
                {source === DataSourceValue.WhatsApp && <WhatsAppIcon sx={{ mr: 1, mt: 0.5 }} />}
                {source === DataSourceValue.Facebook && <FacebookIcon sx={{ mr: 1, mt: 0.5 }} />}
                {source === DataSourceValue.Instagram && <InstagramIcon sx={{ mr: 1, mt: 0.5 }} />}
                {source === DataSourceValue.IMessage && <IMessageIcon sx={{ mr: 1, mt: 0.5 }} />}
                <Typography variant="h6">
                  {donation.t("datasourceTitle_format", {
                    datasource: source == DataSourceValue.IMessage ? "iMessage" : source
                  })}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <DonationDataSelector
                  dataSourceValue={source}
                  onDonatedConversationsChange={newConversations => handleDonatedConversationsChange(source, newConversations)}
                  onFeedbackChatsChange={newFeedbackChats => handleFeedbackChatsChange(source, newFeedbackChats)}
                  onContentDataChange={contentData => handleContentDataChange(source, contentData)}
                />
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        <Box>
          <Stack spacing={2} direction="row" sx={{ justifyContent: "center" }}>
            <LinkButton variant="contained" href="/instructions">
              {actions("previous")}
            </LinkButton>
            <Button variant="contained" onClick={onDataDonationUpload} disabled={loading || !validated}>
              {actions("submit")}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}
