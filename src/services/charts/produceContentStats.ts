import { Post, Comment, Reaction } from "@models/processed";
import { CommentStats, DailySentReceivedPoint, PostStats, ReactionStats } from "@models/graphData";

function groupByDay(timestampsMs: number[]): DailySentReceivedPoint[] {
  const dayMap = new Map<string, { year: number; month: number; date: number; count: number; epochSeconds: number }>();

  for (const ts of timestampsMs) {
    const d = new Date(ts);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const date = d.getUTCDate();
    const key = `${year}-${month}-${date}`;

    if (!dayMap.has(key)) {
      const epochSeconds = Math.floor(new Date(Date.UTC(year, month - 1, date, 12, 0)).getTime() / 1000);
      dayMap.set(key, { year, month, date, count: 0, epochSeconds });
    }
    dayMap.get(key)!.count++;
  }

  return Array.from(dayMap.values())
    .sort((a, b) => a.epochSeconds - b.epochSeconds)
    .map(({ year, month, date, count, epochSeconds }) => ({
      year,
      month,
      date,
      sentCount: count,
      receivedCount: 0,
      epochSeconds
    }));
}

export function producePostStats(postItems: Post[]): PostStats | undefined {
  if (postItems.length === 0) return undefined;

  const totalPosts = postItems.length;
  const totalWords = postItems.reduce((sum, p) => sum + p.wordCount, 0);
  const totalMedia = postItems.reduce((sum, p) => sum + p.mediaCount, 0);
  const avgWordsPerPost = totalPosts > 0 ? Math.round(totalWords / totalPosts) : 0;
  const avgMediaPerPost = totalPosts > 0 ? Math.round((totalMedia / totalPosts) * 10) / 10 : 0;
  const postsOverTime = groupByDay(postItems.map(p => p.timestampMs));

  return { totalPosts, totalWords, totalMedia, avgWordsPerPost, avgMediaPerPost, postsOverTime };
}

export function produceCommentStats(commentItems: Comment[]): CommentStats | undefined {
  if (commentItems.length === 0) return undefined;

  const totalComments = commentItems.length;
  const totalWords = commentItems.reduce((sum, c) => sum + c.wordCount, 0);
  const avgWordsPerComment = totalComments > 0 ? Math.round(totalWords / totalComments) : 0;
  const commentsOverTime = groupByDay(commentItems.map(c => c.timestampMs));

  return { totalComments, totalWords, avgWordsPerComment, commentsOverTime };
}

export function produceReactionStats(reactionItems: Reaction[]): ReactionStats | undefined {
  if (reactionItems.length === 0) return undefined;

  const totalReactions = reactionItems.length;
  const reactionTypeBreakdown: Record<string, number> = {};
  for (const r of reactionItems) {
    reactionTypeBreakdown[r.reactionType] = (reactionTypeBreakdown[r.reactionType] || 0) + 1;
  }
  const reactionsOverTime = groupByDay(reactionItems.map(r => r.timestampMs));

  return { totalReactions, reactionTypeBreakdown, reactionsOverTime };
}
