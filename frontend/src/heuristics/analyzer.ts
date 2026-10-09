import type { ParsedMessage, FindingItem, ConversationAnalysis } from '../types/index.ts';
import {
  detectUrgency,
  detectDecision,
  detectDeadline,
  detectActionItem,
  detectMention,
} from './detectors.ts';
import { generateRecap } from './recapGenerator.ts';

export function analyzeConversation(messages: ParsedMessage[]): ConversationAnalysis {
  const findings: FindingItem[] = [];

  for (const msg of messages) {
    // Check urgency
    const urgency = detectUrgency(msg);
    if (urgency) findings.push(urgency);

    // Check decisions
    const decision = detectDecision(msg);
    if (decision) findings.push(decision);

    // Check deadlines
    const deadline = detectDeadline(msg);
    if (deadline) findings.push(deadline);

    // Check action items
    const actionItem = detectActionItem(msg);
    if (actionItem) findings.push(actionItem);

    // Check mentions
    const mention = detectMention(msg);
    if (mention) findings.push(mention);
  }

  // Sort findings by priority: High first, then Medium, then Low; then by relevanceScore descending
  const priorityWeight: Record<FindingItem['urgency'], number> = {
    high: 300,
    medium: 200,
    low: 100,
  };

  findings.sort((a, b) => {
    const scoreA = priorityWeight[a.urgency] + a.relevanceScore;
    const scoreB = priorityWeight[b.urgency] + b.relevanceScore;
    return scoreB - scoreA;
  });

  // Calculate statistics
  const stats = {
    urgentCount: findings.filter((f) => f.category === 'urgent').length,
    actionItemCount: findings.filter((f) => f.category === 'action_item').length,
    decisionCount: findings.filter((f) => f.category === 'decision').length,
    deadlinesCount: findings.filter((f) => f.category === 'deadline').length,
    mentionsCount: findings.filter((f) => f.category === 'mention').length,
  };

  // Generate executive recap
  const recap = generateRecap(messages, findings);

  return {
    recap,
    findings,
    stats,
  };
}
