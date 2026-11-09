import React from 'react';
import { ShieldCheck, Cpu, CheckCircle2, Lock, Layers } from 'lucide-react';
import { Badge, Button, Modal } from './ui';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Architecture & Privacy Disclosure"
      subtitle="Transparent deterministic conversation intelligence"
      icon={<ShieldCheck className="w-4 h-4" />}
      maxWidthClass="max-w-lg"
      footer={
        <>
          <Badge variant="local" icon={<Lock className="w-2.5 h-2.5" />}>
            Zero Unconsented Network Calls
          </Badge>
          <Button variant="primary" size="sm" onClick={onClose}>
            Understood
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-xs text-text-secondary leading-relaxed">
        <div>
          <h4 className="font-bold text-text-primary text-sm mb-1">
            What Did I Miss? (Missed.)
          </h4>
          <p>
            <strong className="text-text-primary">Missed.</strong> turns noisy unread chat exports into structured, source-linked recaps, urgent alerts, decisions, deadlines, and task checklists.
          </p>
        </div>

        <div className="rounded-2xl p-3.5 bg-semantic-local/10 border border-semantic-local/30 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-[#34D399]">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>100% On-Device Deterministic Mode (Active)</span>
          </div>
          <p className="text-text-primary/90 text-[11px] leading-relaxed">
            In local workspace and demo mode, all file parsing and heuristic extraction execute strictly inside your browser tab via <code className="font-mono text-warm-highlight">@missed/engine</code>. No chat content is uploaded to external AI providers.
          </p>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5">
            <Cpu className="w-4 h-4 text-ember-hover mt-0.5 shrink-0" />
            <div>
              <strong className="text-text-primary">Honest Heuristic Attribution:</strong>{' '}
              Findings are extracted using curated regular expressions, temporal detectors, and priority scoring—not misrepresented as generative LLM output.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-semantic-decision mt-0.5 shrink-0" />
            <div>
              <strong className="text-text-primary">Verifiable Source Traceability:</strong>{' '}
              Every extracted finding links directly to its exact source message in the chronological transcript so nothing is taken out of context.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Layers className="w-4 h-4 text-semantic-deadline mt-0.5 shrink-0" />
            <div>
              <strong className="text-text-primary">Full-Stack Roadmap Status:</strong>{' '}
              The backend API and Supabase Row-Level Security schema are implemented in <code className="font-mono text-text-primary">server/</code>; frontend account sign-in and cloud workspace synchronization connect in Phase 4.
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
