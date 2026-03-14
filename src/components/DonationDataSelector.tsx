"use client";

import Alert, { AlertProps } from "@mui/material/Alert";
import Box from "@mui/material/Box";

import { FileList, FileUploadButton, RemoveButton } from "@components/DonationComponents";
import styled from "@mui/material/styles/styled";
import Typography from "@mui/material/Typography";
import React, { ChangeEvent, useState } from "react";

import { CONFIG } from "@/config";
import { useRichTranslations } from "@/hooks/useRichTranslations";
import { anonymizeData } from "@/services/anonymization";
import { computeConversationHash, shouldHashConversation } from "@/services/conversationHash";
import { checkForDuplicateConversations } from "@/app/data-donation/actions";
import AnonymizationPreview from "@components/AnonymizationPreview";
import DateRangePicker from "@components/DateRangePicker";
import LoadingSpinner from "@components/LoadingSpinner";
import { AnonymizationResult, Comment, Conversation, DataSourceValue, Post, Reaction } from "@models/processed";
import { DonationErrors, getErrorMessage } from "@services/errors";
import { calculateMinMaxDates, filterDataByRange, NullableRange, validateDateRange } from "@services/rangeFiltering";
import { validateMinChatsForDonation, validateMinImportantChatsForDonation } from "@services/validation";

const UploadAlert = styled((props: AlertProps) => <Alert severity="error" {...props} />)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  width: "100%"
}));

export interface ContentData {
  posts: Post[];
  comments: Comment[];
  reactions: Reaction[];
}

interface DonationDataSelectorProps {
  dataSourceValue: DataSourceValue;
  onDonatedConversationsChange: (newDonatedConversations: Conversation[]) => void;
  onFeedbackChatsChange: (newFeedbackChats: Set<string>) => void;
  onContentDataChange?: (contentData: ContentData) => void;
}

const DonationDataSelector: React.FC<DonationDataSelectorProps> = ({
  dataSourceValue,
  onDonatedConversationsChange,
  onFeedbackChatsChange,
  onContentDataChange
}) => {
  const donation = useRichTranslations("donation");
  const acceptedFileTypes =
    dataSourceValue == DataSourceValue.WhatsApp ? ".txt, .zip" : dataSourceValue == DataSourceValue.IMessage ? ".db" : ".zip";

  // States
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState<number>(0); // Add a key state for file input
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<1 | 2>(1); // Track which step: 1=anonymizing, 2=checking duplicates
  const [anonymizationResult, setAnonymizationResult] = useState<AnonymizationResult | null>(null);
  const [calculatedRange, setCalculatedRange] = useState<NullableRange>([null, null]);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);

  // Handle file selection
  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setDateRangeError(null);

    const files = event.target.files ? Array.from(event.target.files) : [];
    setSelectedFiles(files);
    if (files.length === 0) return;

    setIsLoading(true);
    setLoadingStep(1);
    try {
      // Step 1: Anonymize data
      const result = await anonymizeData(dataSourceValue, files);

      // Step 2: Compute hashes and check for duplicates with server
      setLoadingStep(2);
      const conversationsWithHashes = result.anonymizedConversations.map(convo => {
        const hash = shouldHashConversation(convo) ? computeConversationHash(convo) : null;
        return {
          ...convo,
          conversationHash: hash
        };
      });

      const hashes = conversationsWithHashes.map(convo => convo.conversationHash).filter((hash): hash is string => hash !== null);
      if (hashes.length > 0) {
        const duplicateCheck = await checkForDuplicateConversations(hashes);
        if (!duplicateCheck.success) {
          throw duplicateCheck.error;
        }
      }

      // Step 3: Only show results if no duplicates found
      const { minDate, maxDate } = calculateMinMaxDates(conversationsWithHashes);

      setAnonymizationResult({ ...result, anonymizedConversations: conversationsWithHashes });
      setCalculatedRange([minDate, maxDate]);
      setFilteredConversations(conversationsWithHashes);
      onDonatedConversationsChange(conversationsWithHashes);
      onContentDataChange?.({ posts: result.posts, comments: result.comments, reactions: result.reactions });
    } catch (err) {
      const errorMessage = getErrorMessage(donation.t, err as Error, CONFIG);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingStep(1);
    }
  };

  // Handle clearing files
  const handleClearFiles = () => {
    setError(null);
    setDateRangeError(null);
    setSelectedFiles([]);
    setAnonymizationResult(null);
    setFilteredConversations([]);
    onDonatedConversationsChange([]);
    onContentDataChange?.({ posts: [], comments: [], reactions: [] });
    setFileInputKey(prevKey => prevKey + 1);
  };

  // Handle date range selection
  const handleDateRangeChange = (newRange: NullableRange) => {
    // Validate the selected range
    const errorReason = validateDateRange(anonymizationResult?.anonymizedConversations!, newRange);
    setDateRangeError(errorReason);

    if (!errorReason && !error && anonymizationResult) {
      const filteredConversations = filterDataByRange(anonymizationResult.anonymizedConversations, newRange);

      // Validation
      if (!validateMinChatsForDonation(filteredConversations)) {
        setDateRangeError(DonationErrors.TooFewChats);
        return;
      }
      if (!validateMinImportantChatsForDonation(filteredConversations)) {
        setDateRangeError(DonationErrors.TooFewContactsOrMessages);
        return;
      }
      setDateRangeError(null);
      setFilteredConversations(filteredConversations);
      onDonatedConversationsChange(filteredConversations); // Update parent with filtered data
    }
  };

  return (
    <Box>
      <Typography sx={{ fontWeight: "bold" }}>{donation.t("selectData.instruction")}</Typography>
      <Box sx={{ display: "flex", gap: 2 }}>
        <FileUploadButton
          key={fileInputKey} // Add the key prop here
          onChange={handleFileSelection}
          loading={isLoading}
          accept={acceptedFileTypes}
        />
        <RemoveButton onClick={handleClearFiles} loading={isLoading} />
      </Box>

      {/* Show selected files for feedback */}
      {selectedFiles.length > 0 && (
        <Box sx={{ my: 3, width: "100%" }}>
          <FileList files={selectedFiles} />
          {error && <UploadAlert>{error}</UploadAlert>}
        </Box>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <LoadingSpinner
          message={
            loadingStep === 1
              ? donation.t("anonymisation.processingStep", { step: "1/2" })
              : donation.t("anonymisation.checkingDuplicatesStep", { step: "2/2" })
          }
        />
      )}

      {/* Display anonymized data */}
      {!error && !isLoading && anonymizationResult && filteredConversations && (
        <Box sx={{ my: 3 }}>
          {dataSourceValue !== DataSourceValue.Facebook && dataSourceValue !== DataSourceValue.Instagram && (
            <>
              <DateRangePicker calculatedRange={calculatedRange} setSelectedRange={handleDateRangeChange} />
              {dateRangeError && <UploadAlert>{getErrorMessage(donation.t, dateRangeError, CONFIG)}</UploadAlert>}
            </>
          )}
          <AnonymizationPreview
            dataSourceValue={dataSourceValue}
            anonymizedConversations={filteredConversations}
            chatMappingToShow={anonymizationResult.chatMappingToShow}
            onFeedbackChatsChange={onFeedbackChatsChange}
          />
        </Box>
      )}
    </Box>
  );
};

export default DonationDataSelector;
