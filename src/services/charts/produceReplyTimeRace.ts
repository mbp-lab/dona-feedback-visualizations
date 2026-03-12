import { Conversation } from "@models/processed";
import { ReplyTimeRacer } from "@models/graphData";
import { produceAnswerTimesPerConversation } from "@services/charts/timeAggregates";

/**
 * calculates the average reply time for the donor to their top 3 most messaged contacts.
 * @param donorId - the ID of the donor.
 * @param conversations - an array of all conversations.
 * @returns an array of ReplyTimeRacer objects for the top 3 contacts.
 */
export function produceReplyTimeRace(donorId: string, conversations: Conversation[]): ReplyTimeRacer[] {
  // find the top 3 conversations by message count sent by the donor
  const topConversations = conversations
    .map(convo => ({
      convo,
      sentMessages: convo.messages.filter(m => m.sender === donorId).length
    }))
    .sort((a, b) => b.sentMessages - a.sentMessages)
    .slice(0, 3)
    .map(item => item.convo);

  // calculate the average reply time for each of these top conversations
  const racers: ReplyTimeRacer[] = topConversations.map(convo => {
    const answerTimes = produceAnswerTimesPerConversation(donorId, convo);

    // filter for replies sent by the donor
    const donorReplies = answerTimes.filter(at => at.isFromDonor);

    if (donorReplies.length === 0) {
      return {
        name: convo.conversationPseudonym,
        avgReplyTimeMinutes: 0,
        formattedTime: "0 mins"
      };
    }

    let medianReplyTimeMs = 0;
    if (donorReplies.length > 0) {
      // all reply times sorted from fastest to slowest
      const sortedTimesMs = donorReplies.map(reply => reply.responseTimeMs).sort((a, b) => a - b);

      // the middle index
      const midIndex = Math.floor(sortedTimesMs.length / 2);

      // the median value from the sorted list
      medianReplyTimeMs = sortedTimesMs[midIndex];
    }

    let displayString = "";

    if (medianReplyTimeMs < 60000) {
      displayString = "<1 min";
    } else {
      const mins = Math.round(medianReplyTimeMs / 60000);
      displayString = `${mins} min${mins !== 1 ? "s" : ""}`;
    }

    // the original calculation for sorting/charts if needed
    const medianReplyTimeMinutes = medianReplyTimeMs / 60000;

    return {
      name: convo.conversationPseudonym,
      avgReplyTimeMinutes: medianReplyTimeMinutes,
      formattedTime: displayString
    };
  });

  return racers;
}
