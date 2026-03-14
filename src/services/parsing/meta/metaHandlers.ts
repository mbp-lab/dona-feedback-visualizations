import { AnonymizationResult, DataSourceValue } from "@models/processed";
import { DonationErrors, DonationValidationError } from "@services/errors";
import { decode, processJsonContent } from "@services/parsing/shared/decoding";
import { extractEntriesFromZips, getEntryText, isMatchingEntry, ValidEntry } from "@services/parsing/shared/zipExtraction";

import deIdentify from "./deIdentify";

interface ParsedMessage {
  sender_name: string;
  content?: string;
  audio_files?: { uri: string }[];
  timestamp_ms: number;
}

export interface ParsedConversation {
  participants: { name: string }[];
  messages: ParsedMessage[];
  [key: string]: any;
}

export async function handleInstagramZipFiles(fileList: File[]): Promise<AnonymizationResult> {
  return handleMetaZipFiles(fileList, "personal_information.json", extractDonorNameFromInstagramProfile, DataSourceValue.Instagram);
}

export async function handleFacebookZipFiles(fileList: File[]): Promise<AnonymizationResult> {
  return handleMetaZipFiles(fileList, "profile_information.json", extractDonorNameFromFacebookProfile, DataSourceValue.Facebook);
}

const extractDonorNameFromFacebookProfile = (profileText: string): string => {
  const profileJson = JSON.parse(profileText);

  const profileKey = Object.keys(profileJson).find(key => /profile/.test(key));
  if (profileKey && profileJson[profileKey]?.name?.full_name) {
    return decode(profileJson[profileKey].name.full_name);
  }

  throw DonationValidationError(DonationErrors.NoDonorNameFound);
};

const extractDonorNameFromInstagramProfile = (profileText: string): string => {
  interface ProfileUser {
    string_map_data: {
      Name: { value: string };
    };
  }

  interface ProfileInfo {
    profile_user: ProfileUser[];
  }

  const profileJson: ProfileInfo = JSON.parse(profileText);

  const name = profileJson?.profile_user?.[0]?.string_map_data?.Name?.value;
  if (name) return decode(name);

  throw DonationValidationError(DonationErrors.NoDonorNameFound);
};

async function handleMetaZipFiles(
  fileList: File[],
  profileInfoFilePattern: string,
  userNameExtractor: (profileText: string) => string,
  dataSourceValue: DataSourceValue
): Promise<AnonymizationResult> {
  const allEntries: ValidEntry[] = await extractEntriesFromZips(fileList);

  // Check for the presence of profile information
  const profileInfoEntry = allEntries.find(entry => isMatchingEntry(entry, profileInfoFilePattern));
  if (!profileInfoEntry) {
    throw DonationValidationError(DonationErrors.NoProfile);
  }
  // Filter for message entries
  const messageEntries = allEntries.filter(entry => isMatchingEntry(entry, "message.json") || isMatchingEntry(entry, "message_1.json"));
  if (messageEntries.length < 1) {
    throw DonationValidationError(DonationErrors.NoMessageEntries);
  }
  // Select audio entries
  const audioEntries = allEntries.filter(entry => isMatchingEntry(entry, ".wav"));
  console.log("Audio entries found:", audioEntries.length);

  // Filter for post entries (exclude past_instagram_insights/posts.json)
  const postEntries = allEntries.filter(
    entry =>
      !isMatchingEntry(entry, "past_instagram_insights/posts.json") &&
      (isMatchingEntry(entry, "/posts_1.json") || isMatchingEntry(entry, "/posts.json"))
  );
  console.log("Post entries found:", postEntries.length);

  // Filter for comment entries
  const commentEntries = allEntries.filter(
    entry => isMatchingEntry(entry, "post_comments_1.json") || isMatchingEntry(entry, "post_comments.json")
  );
  console.log("Comment entries found:", commentEntries.length);

  // Filter for reaction/like entries
  const reactionEntries = allEntries.filter(
    entry => isMatchingEntry(entry, "liked_comments.json") || isMatchingEntry(entry, "liked_posts.json")
  );
  console.log("Reaction entries found:", reactionEntries.length);

  try {
    // Extract donor name from profile
    const donorName = userNameExtractor(await getEntryText(profileInfoEntry));

    // Extract message contents from message entries
    const parsedConversations = await getConversationsFromEntries(messageEntries);

    // Read raw content for posts, comments, reactions
    const rawPosts = await Promise.all(postEntries.map(getEntryText));
    const rawComments = await Promise.all(commentEntries.map(getEntryText));
    const rawReactions = await Promise.all(reactionEntries.map(getEntryText));

    // Process the extracted data
    return deIdentify(parsedConversations, audioEntries, donorName, dataSourceValue, rawPosts, rawComments, rawReactions);
  } catch (error) {
    throw DonationValidationError(DonationErrors.UnknownError);
  }
}

const getConversationsFromEntries = async (messageEntries: ValidEntry[]): Promise<ParsedConversation[]> => {
  const textList = await Promise.all(messageEntries.map(getEntryText));
  const jsonContents: Map<string, ParsedConversation> = new Map();

  textList.forEach(textContent => {
    try {
      // First parse the JSON directly
      const jsonContent: ParsedConversation = JSON.parse(textContent);

      // Then handle any special character encoding in the parsed object
      const fullyDecodedContent = processJsonContent(jsonContent);

      if (jsonContents.has(fullyDecodedContent.thread_path)) {
        jsonContents.get(fullyDecodedContent.thread_path)!.messages.push(...fullyDecodedContent.messages);
      } else {
        jsonContents.set(fullyDecodedContent.thread_path, fullyDecodedContent);
      }
    } catch (error) {
      console.error("Error processing message entry:", error);
    }
  });
  return Array.from(jsonContents.values());
};
