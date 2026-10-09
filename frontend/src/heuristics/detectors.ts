import type { ParsedMessage, FindingItem } from '../types';

// URGENCY DETECTION
const URGENT_REGEX = /\b(critical|urgent|blocker|p0|outage|incident|emergency|fatal|fatal error|500 internal server error|asap)\b/i;

export function detectUrgency(msg: ParsedMessage): FindingItem | null {
  const match = msg.text.match(URGENT_REGEX);
  if (!match) return null;

  const keyword = match[1].toUpperCase();
  return {
    id: `finding-urg-${msg.id}`,
    sourceMessageId: msg.id,
    category: 'urgent',
    urgency: 'high',
    title: `${keyword} Issue Reported`,
    snippet: msg.text,
    sender: msg.sender,
    timestamp: msg.timestamp,
    relevanceScore: 95,
  };
}

// DECISION DETECTION
const DECISION_REGEX = /\b(decision\s*:|we agreed|agreed to|we approved|approved\b|let'?s proceed with|let'?s go with|final call\s*:|we will delay|we will postpone|we will roll back|consensus\s*:)/i;

export function detectDecision(msg: ParsedMessage): FindingItem | null {
  const match = msg.text.match(DECISION_REGEX);
  if (!match) return null;

  return {
    id: `finding-dec-${msg.id}`,
    sourceMessageId: msg.id,
    category: 'decision',
    urgency: 'high',
    title: 'Key Decision Reached',
    snippet: msg.text,
    sender: msg.sender,
    timestamp: msg.timestamp,
    relevanceScore: 85,
  };
}

// DEADLINE DETECTION
const DEADLINE_REGEX = /\b(deadline\s*(?:for|is)?|before\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)|by\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)|by\s+eod|before\s+eod|due\s+(?:on|by)|until\s+\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i;
const EXTRACT_DUE_REGEX = /(?:by|before|until|deadline(?:\s+is)?)\s+([0-9]{1,2}(?::[0-9]{2})?\s*(?:am|pm)|eod|tomorrow|friday|monday|today)/i;

export function detectDeadline(msg: ParsedMessage): FindingItem | null {
  const match = msg.text.match(DEADLINE_REGEX);
  if (!match) return null;

  const dueMatch = msg.text.match(EXTRACT_DUE_REGEX);
  const dueDate = dueMatch ? dueMatch[1].toUpperCase() : undefined;

  return {
    id: `finding-dl-${msg.id}`,
    sourceMessageId: msg.id,
    category: 'deadline',
    urgency: 'high',
    title: dueDate ? `Deadline: ${dueDate}` : 'Target Deadline Identified',
    snippet: msg.text,
    sender: msg.sender,
    timestamp: msg.timestamp,
    dueDate,
    relevanceScore: 80,
  };
}

// ACTION ITEM DETECTION
const ACTION_REGEX = /\b(action\s*item(?:\s*(?:for|:))?|todo\s*:|please\s+(?:deploy|check|verify|run|fix|investigate|prepare|post|restart|update|halt)|i\s*will\s+(?:deploy|check|verify|run|fix|investigate|prepare|post|restart|update|look|increase)|i'?ll\s+(?:deploy|check|verify|run|fix|investigate|prepare|post|restart|update|handle)|assigned\s+to|assigning\s+to|need\s+someone\s+to)\b/i;
const ASSIGNEE_NAME_REGEX = /(?:action\s*item\s*for|action\s*item\s*:?\s*@?|@)\s*([A-Za-z0-9_]+(?:\s+[A-Za-z0-9_]+)?)/i;

export function detectActionItem(msg: ParsedMessage): FindingItem | null {
  const match = msg.text.match(ACTION_REGEX);
  if (!match) return null;

  let assignee: string | undefined;

  if (/\bi\s*will\b|\bi'?ll\b/i.test(msg.text)) {
    assignee = msg.sender;
  } else {
    const assigneeMatch = msg.text.match(ASSIGNEE_NAME_REGEX);
    if (assigneeMatch && assigneeMatch[1]) {
      assignee = assigneeMatch[1].trim();
    }
  }

  const hasUrgencyOrDeadline = URGENT_REGEX.test(msg.text) || DEADLINE_REGEX.test(msg.text);

  return {
    id: `finding-act-${msg.id}`,
    sourceMessageId: msg.id,
    category: 'action_item',
    urgency: hasUrgencyOrDeadline ? 'high' : 'medium',
    title: assignee ? `Task assigned to ${assignee}` : 'Action Item Identified',
    snippet: msg.text,
    sender: msg.sender,
    timestamp: msg.timestamp,
    assignee,
    relevanceScore: 75,
  };
}

// MENTION DETECTION
const MENTION_REGEX = /@([A-Za-z0-9_]+(?:\s+[A-Za-z0-9_]+)?)/;

export function detectMention(msg: ParsedMessage): FindingItem | null {
  const match = msg.text.match(MENTION_REGEX);
  if (!match) return null;

  const target = match[1].trim();
  const isQuestion = msg.text.includes('?');

  return {
    id: `finding-men-${msg.id}`,
    sourceMessageId: msg.id,
    category: 'mention',
    urgency: isQuestion ? 'medium' : 'low',
    title: isQuestion ? `Direct question to @${target}` : `Direct mention of @${target}`,
    snippet: msg.text,
    sender: msg.sender,
    timestamp: msg.timestamp,
    assignee: target,
    relevanceScore: 65,
  };
}

