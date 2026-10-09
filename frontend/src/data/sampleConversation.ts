import type { ParsedMessage } from '../types';

export const SAMPLE_CONVERSATION_RAW = `[2026-10-09 09:15:22] Maya Lin: Good morning team. Starting the payment gateway migration cutover now.
[2026-10-09 09:17:40] Leo Chen: Infrastructure standby is green. Database replicas are synchronized.
[2026-10-09 09:21:05] Maya Lin: CRITICAL: The staging payment gateway webhook is returning 500 Internal Server Error on card authorisations!
[2026-10-09 09:22:18] Priya Sharma: Is production affected yet? We have 1,400 active shoppers right now.
[2026-10-09 09:23:45] Leo Chen: Production traffic is still routing to legacy gateway v1. Staging cutover is isolated.
[2026-10-09 09:25:10] Maya Lin: BLOCKER: Redis connection pool is exhausted on node-3 due to unclosed socket connections in the new SDK.
[2026-10-09 09:26:30] Leo Chen: @Maya Lin I am increasing the connection pool limit to 500 and restarting the proxy workers immediately.
[2026-10-09 09:29:15] Priya Sharma: Can we proceed with today's 10:00 AM launch or do we need to postpone?
[2026-10-09 09:31:00] Maya Lin: Decision: We approved delaying the production cutover to 3:00 PM today until the SDK socket leak is patched.
[2026-10-09 09:32:45] Priya Sharma: Agreed. I will post an update to the customer executive dashboard before 10:00 AM.
[2026-10-09 09:35:12] Alex Rivera: Frontend checkout modal is currently displaying a generic error message. I will push a user-friendly retry banner.
[2026-10-09 09:37:04] Maya Lin: Action item: @Alex Rivera please deploy the banner fix to staging by 10:30 AM.
[2026-10-09 09:39:50] Sam Thorne: QA is ready. Action item for Sam: Run full automated checkout regression suite once Leo restarts the workers.
[2026-10-09 09:42:15] Leo Chen: Redis workers restarted. Memory usage stable at 38%. Socket leak is mitigated by the new connection pool timeout.
[2026-10-09 09:44:00] Sam Thorne: Beginning test execution now. Deadline for smoke test sign-off is 11:15 AM.
[2026-10-09 09:47:20] Maya Lin: Decision: Staging traffic will remain on v2 SDK for soak testing until 2:00 PM.
[2026-10-09 09:50:35] Priya Sharma: @Leo Chen can you confirm our rollback runbook is verified in case we encounter issues at 3:00 PM?
[2026-10-09 09:52:10] Leo Chen: Yes, rollback script is tested. Action item: Leo to prepare automated rollback trigger before 1:00 PM.
[2026-10-09 09:55:00] Alex Rivera: Banner deployed to staging. @Sam Thorne please include the banner in your validation pass.
[2026-10-09 09:58:30] Maya Lin: Excellent work under pressure everyone. Sync again at 1:30 PM for final go/no-go decision.`;

export const SAMPLE_MESSAGES: ParsedMessage[] = [
  {
    id: 'sample-01',
    sender: 'Maya Lin',
    timestamp: '2026-10-09 09:15:22',
    text: 'Good morning team. Starting the payment gateway migration cutover now.',
    raw: '[2026-10-09 09:15:22] Maya Lin: Good morning team. Starting the payment gateway migration cutover now.',
    lineIndex: 0,
  },
  {
    id: 'sample-02',
    sender: 'Leo Chen',
    timestamp: '2026-10-09 09:17:40',
    text: 'Infrastructure standby is green. Database replicas are synchronized.',
    raw: '[2026-10-09 09:17:40] Leo Chen: Infrastructure standby is green. Database replicas are synchronized.',
    lineIndex: 1,
  },
  {
    id: 'sample-03',
    sender: 'Maya Lin',
    timestamp: '2026-10-09 09:21:05',
    text: 'CRITICAL: The staging payment gateway webhook is returning 500 Internal Server Error on card authorisations!',
    raw: '[2026-10-09 09:21:05] Maya Lin: CRITICAL: The staging payment gateway webhook is returning 500 Internal Server Error on card authorisations!',
    lineIndex: 2,
  },
  {
    id: 'sample-04',
    sender: 'Priya Sharma',
    timestamp: '2026-10-09 09:22:18',
    text: 'Is production affected yet? We have 1,400 active shoppers right now.',
    raw: '[2026-10-09 09:22:18] Priya Sharma: Is production affected yet? We have 1,400 active shoppers right now.',
    lineIndex: 3,
  },
  {
    id: 'sample-05',
    sender: 'Leo Chen',
    timestamp: '2026-10-09 09:23:45',
    text: 'Production traffic is still routing to legacy gateway v1. Staging cutover is isolated.',
    raw: '[2026-10-09 09:23:45] Leo Chen: Production traffic is still routing to legacy gateway v1. Staging cutover is isolated.',
    lineIndex: 4,
  },
  {
    id: 'sample-06',
    sender: 'Maya Lin',
    timestamp: '2026-10-09 09:25:10',
    text: 'BLOCKER: Redis connection pool is exhausted on node-3 due to unclosed socket connections in the new SDK.',
    raw: '[2026-10-09 09:25:10] Maya Lin: BLOCKER: Redis connection pool is exhausted on node-3 due to unclosed socket connections in the new SDK.',
    lineIndex: 5,
  },
  {
    id: 'sample-07',
    sender: 'Leo Chen',
    timestamp: '2026-10-09 09:26:30',
    text: '@Maya Lin I am increasing the connection pool limit to 500 and restarting the proxy workers immediately.',
    raw: '[2026-10-09 09:26:30] Leo Chen: @Maya Lin I am increasing the connection pool limit to 500 and restarting the proxy workers immediately.',
    lineIndex: 6,
  },
  {
    id: 'sample-08',
    sender: 'Priya Sharma',
    timestamp: '2026-10-09 09:29:15',
    text: "Can we proceed with today's 10:00 AM launch or do we need to postpone?",
    raw: "[2026-10-09 09:29:15] Priya Sharma: Can we proceed with today's 10:00 AM launch or do we need to postpone?",
    lineIndex: 7,
  },
  {
    id: 'sample-09',
    sender: 'Maya Lin',
    timestamp: '2026-10-09 09:31:00',
    text: 'Decision: We approved delaying the production cutover to 3:00 PM today until the SDK socket leak is patched.',
    raw: '[2026-10-09 09:31:00] Maya Lin: Decision: We approved delaying the production cutover to 3:00 PM today until the SDK socket leak is patched.',
    lineIndex: 8,
  },
  {
    id: 'sample-10',
    sender: 'Priya Sharma',
    timestamp: '2026-10-09 09:32:45',
    text: 'Agreed. I will post an update to the customer executive dashboard before 10:00 AM.',
    raw: '[2026-10-09 09:32:45] Priya Sharma: Agreed. I will post an update to the customer executive dashboard before 10:00 AM.',
    lineIndex: 9,
  },
  {
    id: 'sample-11',
    sender: 'Alex Rivera',
    timestamp: '2026-10-09 09:35:12',
    text: 'Frontend checkout modal is currently displaying a generic error message. I will push a user-friendly retry banner.',
    raw: '[2026-10-09 09:35:12] Alex Rivera: Frontend checkout modal is currently displaying a generic error message. I will push a user-friendly retry banner.',
    lineIndex: 10,
  },
  {
    id: 'sample-12',
    sender: 'Maya Lin',
    timestamp: '2026-10-09 09:37:04',
    text: 'Action item: @Alex Rivera please deploy the banner fix to staging by 10:30 AM.',
    raw: '[2026-10-09 09:37:04] Maya Lin: Action item: @Alex Rivera please deploy the banner fix to staging by 10:30 AM.',
    lineIndex: 11,
  },
  {
    id: 'sample-13',
    sender: 'Sam Thorne',
    timestamp: '2026-10-09 09:39:50',
    text: 'QA is ready. Action item for Sam: Run full automated checkout regression suite once Leo restarts the workers.',
    raw: '[2026-10-09 09:39:50] Sam Thorne: QA is ready. Action item for Sam: Run full automated checkout regression suite once Leo restarts the workers.',
    lineIndex: 12,
  },
  {
    id: 'sample-14',
    sender: 'Leo Chen',
    timestamp: '2026-10-09 09:42:15',
    text: 'Redis workers restarted. Memory usage stable at 38%. Socket leak is mitigated by the new connection pool timeout.',
    raw: '[2026-10-09 09:42:15] Leo Chen: Redis workers restarted. Memory usage stable at 38%. Socket leak is mitigated by the new connection pool timeout.',
    lineIndex: 13,
  },
  {
    id: 'sample-15',
    sender: 'Sam Thorne',
    timestamp: '2026-10-09 09:44:00',
    text: 'Beginning test execution now. Deadline for smoke test sign-off is 11:15 AM.',
    raw: '[2026-10-09 09:44:00] Sam Thorne: Beginning test execution now. Deadline for smoke test sign-off is 11:15 AM.',
    lineIndex: 14,
  },
  {
    id: 'sample-16',
    sender: 'Maya Lin',
    timestamp: '2026-10-09 09:47:20',
    text: 'Decision: Staging traffic will remain on v2 SDK for soak testing until 2:00 PM.',
    raw: '[2026-10-09 09:47:20] Maya Lin: Decision: Staging traffic will remain on v2 SDK for soak testing until 2:00 PM.',
    lineIndex: 15,
  },
  {
    id: 'sample-17',
    sender: 'Priya Sharma',
    timestamp: '2026-10-09 09:50:35',
    text: '@Leo Chen can you confirm our rollback runbook is verified in case we encounter issues at 3:00 PM?',
    raw: '[2026-10-09 09:50:35] Priya Sharma: @Leo Chen can you confirm our rollback runbook is verified in case we encounter issues at 3:00 PM?',
    lineIndex: 16,
  },
  {
    id: 'sample-18',
    sender: 'Leo Chen',
    timestamp: '2026-10-09 09:52:10',
    text: 'Yes, rollback script is tested. Action item: Leo to prepare automated rollback trigger before 1:00 PM.',
    raw: '[2026-10-09 09:52:10] Leo Chen: Yes, rollback script is tested. Action item: Leo to prepare automated rollback trigger before 1:00 PM.',
    lineIndex: 17,
  },
  {
    id: 'sample-19',
    sender: 'Alex Rivera',
    timestamp: '2026-10-09 09:55:00',
    text: 'Banner deployed to staging. @Sam Thorne please include the banner in your validation pass.',
    raw: '[2026-10-09 09:55:00] Alex Rivera: Banner deployed to staging. @Sam Thorne please include the banner in your validation pass.',
    lineIndex: 18,
  },
  {
    id: 'sample-20',
    sender: 'Maya Lin',
    timestamp: '2026-10-09 09:58:30',
    text: 'Excellent work under pressure everyone. Sync again at 1:30 PM for final go/no-go decision.',
    raw: '[2026-10-09 09:58:30] Maya Lin: Excellent work under pressure everyone. Sync again at 1:30 PM for final go/no-go decision.',
    lineIndex: 19,
  },
];

