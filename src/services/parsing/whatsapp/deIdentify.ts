import { AnonymizationResult, Conversation, DataSourceValue, Message } from "@models/processed";
import { getAliasConfig } from "@services/parsing/shared/aliasConfig";
import emojiCount from "@services/parsing/shared/emojiCount";
import { ChatPseudonyms, ContactPseudonyms } from "@services/parsing/shared/pseudonyms";
import wordCount from "@services/parsing/shared/wordCount";
import { ParsedMessage } from "@services/parsing/whatsapp/whatsappParser";

export default async function deIdentify(parsedFiles: ParsedMessage[][], donorName: string): Promise<AnonymizationResult> {
  const aliasConfig = getAliasConfig();
  const contactPseudonyms = new ContactPseudonyms(aliasConfig.contactAlias, aliasConfig.systemAlias);
  const chatPseudonyms = new ChatPseudonyms(aliasConfig.donorAlias, aliasConfig.chatAlias, DataSourceValue.WhatsApp);
  chatPseudonyms.setDonorName(donorName);
  contactPseudonyms.setPseudonym(donorName, aliasConfig.donorAlias);

  const deIdentifiedConversations: Conversation[] = [];
  parsedFiles.forEach((parsedMessaged, conv_idx) => {
    const participantPseudonyms = new Set<string>();

    // Filter out system messages
    const filteredMessages: ParsedMessage[] = parsedMessaged.filter(
      parsedMessage => parsedMessage.message && parsedMessage.author != aliasConfig.systemAlias
    ); // Filter out system messages

    console.log("Processing conversation", conv_idx + 1, "with", parsedMessaged.length, "messages");
    console.log("Filtered messages count:", filteredMessages.length);

    const messages: Message[] = filteredMessages.map(line => {
      const participant = contactPseudonyms.getPseudonym(line.author);
      participantPseudonyms.add(participant);
      const emojis = emojiCount(line.message);
      return {
        sender: participant,
        timestamp: line.date,
        wordCount: wordCount(line.message),
        emojiCounts: Object.keys(emojis).length > 0 ? emojis : undefined
      };
    });
    const participants = Array.from(participantPseudonyms);
    const isGroupConversation = participants.length > 2;
    const conversationPseudonym = chatPseudonyms.getPseudonym(contactPseudonyms.getOriginalNames(participants));

    // Add to conversations
    deIdentifiedConversations.push({
      isGroupConversation,
      dataSource: DataSourceValue.WhatsApp,
      messages,
      messagesAudio: [],
      participants,
      conversationPseudonym
    });
  });

  return {
    anonymizedConversations: deIdentifiedConversations,
    posts: [],
    comments: [],
    reactions: [],
    participantNamesToPseudonyms: contactPseudonyms.getPseudonymMap(),
    chatMappingToShow: chatPseudonyms.getPseudonymMap()
  };
}
