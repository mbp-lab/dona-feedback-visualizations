import CheckIcon from "@mui/icons-material/Check";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Paper from "@mui/material/Paper";
import styled from "@mui/material/styles/styled";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { TableCellProps } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";

import { CONFIG } from "@/config";
import { useRichTranslations } from "@/hooks/useRichTranslations";
import { sortConversationsByWordCount } from "@/services/sorting";
import AnonymizationModal from "@components/AnonymizationModal";
import { ChatMapping, Conversation, DataSourceValue } from "@models/processed";
import { useAliasConfig } from "@services/parsing/shared/aliasConfig";

const ResponsiveTableCell = styled(TableCell)<TableCellProps>(({ theme }) => ({
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    paddingLeft: theme.spacing(0.75),
    paddingRight: theme.spacing(0.75),
    "&.small-header": {
      fontSize: "0.75rem",
      whiteSpace: "normal",
      wordWrap: "break-word",
      maxWidth: 50
    }
  }
}));

interface AnonymizationPreviewProps {
  dataSourceValue: DataSourceValue;
  anonymizedConversations: Conversation[];
  chatMappingToShow: ChatMapping;
  onFeedbackChatsChange: (feedbackChats: Set<string>) => void;
}

const AnonymizationPreview: React.FC<AnonymizationPreviewProps> = ({
  dataSourceValue,
  anonymizedConversations,
  chatMappingToShow,
  onFeedbackChatsChange
}) => {
  const donation = useRichTranslations("donation");
  const aliasConfig = useAliasConfig();
  const [isModalOpen, setModalOpen] = React.useState(false);
  const [feedbackChats, setFeedbackChats] = useState<Set<string>>(() => {
    const sortedConversations = sortConversationsByWordCount(anonymizedConversations);
    const defaultChats = sortedConversations.slice(0, CONFIG.DEFAULT_FEEDBACK_CHATS).map(convo => convo.conversationPseudonym);
    return new Set(defaultChats);
  });

  // Use function from parent to feedback changes to feedback chats
  useEffect(() => {
    onFeedbackChatsChange(feedbackChats);
  }, [feedbackChats]);

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

  const handleFeedbackCheckboxChange = (chatPseudonym: string) => {
    const newFeedbackChats = new Set(feedbackChats);
    if (newFeedbackChats.has(chatPseudonym)) {
      if (newFeedbackChats.size > CONFIG.MIN_FEEDBACK_CHATS) {
        newFeedbackChats.delete(chatPseudonym);
      }
    } else if (newFeedbackChats.size < CONFIG.MAX_FEEDBACK_CHATS) {
      newFeedbackChats.add(chatPseudonym);
    }
    setFeedbackChats(newFeedbackChats);
  };

  return (
    <Box sx={{ my: 1 }}>
      <Typography variant="body1" sx={{ mb: 1, fontWeight: "bold" }}>
        {donation.t("contactsMapping.title")}
      </Typography>
      <Typography variant="body2" gutterBottom>
        {donation.t("contactsMapping.subtitle", {
          dataSourceInitials: dataSourceValue.slice(0, 2).toWellFormed()
        })}
      </Typography>
      <Typography variant="body2">
        {donation.rich("chatSelection", undefined, true, {
          min_num: CONFIG.MIN_FEEDBACK_CHATS.toString(),
          max_num: CONFIG.MAX_FEEDBACK_CHATS.toString(),
          default_num: CONFIG.DEFAULT_FEEDBACK_CHATS.toString()
        })}
      </Typography>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small" aria-label="pseudonyms table">
          <TableHead>
            <TableRow sx={{ verticalAlign: "top", th: { fontWeight: "bold" } }}>
              <ResponsiveTableCell className="small-header" sx={{ textAlign: "center" }}>
                {donation.t("contactsMapping.feedback")}
              </ResponsiveTableCell>
              <ResponsiveTableCell>{donation.t("contactsMapping.pseudonyms")}</ResponsiveTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from(chatMappingToShow.entries()).map(([chatPseudonym]) => (
              <TableRow key={chatPseudonym} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                <ResponsiveTableCell padding="checkbox" sx={{ textAlign: "center" }}>
                  {chatPseudonym != aliasConfig.donorAlias && (
                    <Checkbox
                      checked={feedbackChats.has(chatPseudonym)}
                      onChange={() => handleFeedbackCheckboxChange(chatPseudonym)}
                      disabled={!feedbackChats.has(chatPseudonym) && feedbackChats.size >= CONFIG.MAX_FEEDBACK_CHATS}
                    />
                  )}
                </ResponsiveTableCell>
                <ResponsiveTableCell component="th" scope="row">
                  {chatPseudonym}
                </ResponsiveTableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box
        sx={{
          my: 2,
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <Button onClick={handleOpenModal}>{donation.t("previewData.button")}</Button>
      </Box>
      <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
        {donation.t("successful")} {donation.t("previewData.body2")}
      </Alert>

      <AnonymizationModal
        open={isModalOpen}
        onClose={handleCloseModal}
        conversations={anonymizedConversations}
        n_listed_receivers={3}
        n_messages={100}
      />
    </Box>
  );
};

export default AnonymizationPreview;
