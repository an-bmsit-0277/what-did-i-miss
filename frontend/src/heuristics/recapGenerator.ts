import type { ParsedMessage, FindingItem, RecapStats } from '../types';

const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he',
  'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or',
  'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about',
  'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
  'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than',
  'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two',
  'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give',
  'day', 'most', 'us', 'is', 'are', 'was', 'were', 'am', 'been', 'has', 'had', 'doing', 'does', 'did',
  'please', 'team', 'everyone', 'hello', 'morning', 'again', 'still', 'right',
]);

export function generateRecap(messages: ParsedMessage[], findings: FindingItem[]): RecapStats {
  const totalMessages = messages.length;
  if (totalMessages === 0) {
    return {
      totalMessages: 0,
      participantCount: 0,
      participants: [],
      topTopics: [],
      summaryBullets: ['No messages available to summarize.'],
    };
  }

  // Participants
  const participantSet = new Set<string>();
  messages.forEach((m) => {
    if (m.sender && m.sender !== 'Unknown') {
      participantSet.add(m.sender);
    }
  });
  const participants = Array.from(participantSet);
  const participantCount = participants.length;

  // Time span
  const timestamps = messages.map((m) => m.timestamp).filter((ts): ts is string => Boolean(ts));
  const startTime = timestamps.length > 0 ? timestamps[0] : undefined;
  const endTime = timestamps.length > 0 ? timestamps[timestamps.length - 1] : undefined;

  // Extract top keywords/topics
  const wordCounts = new Map<string, number>();
  messages.forEach((msg) => {
    const words = msg.text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/);

    words.forEach((w) => {
      if (w.length >= 4 && !STOP_WORDS.has(w) && !/^\d+$/.test(w)) {
        wordCounts.set(w, (wordCounts.get(w) || 0) + 1);
      }
    });
  });

  const topTopics = Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

  // Generate Executive Summary Bullets
  const summaryBullets: string[] = [];

  // Bullet 1: Scope & Activity
  const timeStr = startTime && endTime ? ` from ${startTime.split(' ')[1] || startTime} to ${endTime.split(' ')[1] || endTime}` : '';
  summaryBullets.push(
    `Conversation contains ${totalMessages} messages across ${participantCount} participants${timeStr}.`
  );

  // Bullet 2: Urgent / Blocker incidents
  const urgentFindings = findings.filter((f) => f.category === 'urgent');
  if (urgentFindings.length > 0) {
    summaryBullets.push(
      `⚠️ Identified ${urgentFindings.length} critical alert/blocker${urgentFindings.length > 1 ? 's' : ''} requiring immediate attention.`
    );
  } else {
    summaryBullets.push('✓ No critical blockers or P0 system alerts were raised.');
  }

  // Bullet 3: Decisions
  const decisionFindings = findings.filter((f) => f.category === 'decision');
  if (decisionFindings.length > 0) {
    summaryBullets.push(
      `🎯 ${decisionFindings.length} formal decision${decisionFindings.length > 1 ? 's' : ''} reached (e.g., "${decisionFindings[0].snippet.slice(0, 75)}...").`
    );
  }

  // Bullet 4: Action Items & Deadlines
  const actionFindings = findings.filter((f) => f.category === 'action_item');
  const deadlineFindings = findings.filter((f) => f.category === 'deadline');
  if (actionFindings.length > 0 || deadlineFindings.length > 0) {
    summaryBullets.push(
      `📌 ${actionFindings.length} actionable task${actionFindings.length > 1 ? 's' : ''} and ${deadlineFindings.length} targeted deadline${deadlineFindings.length > 1 ? 's' : ''} assigned.`
    );
  }

  return {
    totalMessages,
    participantCount,
    participants,
    startTime,
    endTime,
    topTopics,
    summaryBullets,
  };
}

