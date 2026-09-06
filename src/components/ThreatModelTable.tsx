import React, { useState } from 'react';
import { Shield, Lock, Cpu, Database, Network, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react';
import { ThreatZoneEvaluation } from '../types';

export const THREAT_MODEL_DATA: ThreatZoneEvaluation[] = [
  {
    zone: 'Input Surfaces',
    threatDescription: 'Prompt Injection, Jailbreaks & Cross-Site Scripting (XSS) via user journal prompts or hijacked reflection prompts.',
    attackVector: 'Adversarial instructions injected in user entry text attempting to bypass safety guidelines, extract system prompts, or execute arbitrary browser scripts.',
    severity: 'High',
    technicalMitigation: 'Defensive schema sanitization with exact string length bounds (max 40,000 chars), strict JSON response typing via @google/genai Type.OBJECT responseSchema, input isolation in multi-turn content parts, and text sanitization before DOM render.',
    implementationArtifact: 'server/geminiResilient.ts, firebase-blueprint.json, Content-Security-Policy',
    verificationStatus: 'Enforced',
  },
  {
    zone: 'Planning & Reasoning',
    threatDescription: 'Hallucinated cognitive diagnosis, biased feedback, or non-deterministic fallback loop exhaustion.',
    attackVector: 'Unpredictable model outputs asserting false psychological diagnoses, triggering infinite retry loops, or leaking internal chain-of-thought tokens.',
    severity: 'Medium',
    technicalMitigation: 'Strict human-centered system instructions restricting role to non-clinical reflective journaling; deterministic fallback ladder (gemini-3.6-flash -> gemini-3.1-flash-lite -> gemini-flash-latest -> gemini-3.7-flash) with bounded retries and exponential backoff.',
    implementationArtifact: 'server/geminiResilient.ts (MODEL_FALLBACK_LADDER & Error Matrix)',
    verificationStatus: 'Hardened',
  },
  {
    zone: 'Tool Execution',
    threatDescription: 'Unsanitized Geolocation injection and Map ID spoofing.',
    attackVector: 'Malicious coordinate payloads or unauthenticated calls to Google Maps Platform endpoints causing quota exhaustion or client crash.',
    severity: 'Medium',
    technicalMitigation: 'Strict type validation on latitude/longitude boundaries (-90..90, -180..180), environment tag whitelisting, and server-side secret isolation; Maps API key restricted to HTTP referrers.',
    implementationArtifact: 'src/components/SpatialLocationPicker.tsx, server.ts',
    verificationStatus: 'Enforced',
  },
  {
    zone: 'Memory & State',
    threatDescription: 'Cross-User Journal Data Leakage, PII Exposure & Unencrypted Data-at-Rest in Cloud Firestore.',
    attackVector: 'Malicious authenticated user querying /users/{otherUserId}/journals or intercepting database snapshots containing private reflections.',
    severity: 'Critical',
    technicalMitigation: '1. Strict owner-bound Firestore Security Rules enforcing request.auth.uid == userId on all read/list/write operations. 2. Client-Side Zero-Knowledge Encryption (AES-256-GCM + PBKDF2) using Web Crypto API before transmission to Firestore so stored payloads are unreadable ciphertext.',
    implementationArtifact: 'firestore.rules, src/lib/crypto.ts, src/lib/journalRepository.ts',
    verificationStatus: 'Enforced',
  },
  {
    zone: 'Inter-System Communication',
    threatDescription: 'Hardcoded API Key exposure, Token Spoofing, and SSRF during Gemini or Secret Manager retrieval.',
    attackVector: 'Reverse-engineering client-side bundle for GEMINI_API_KEY, forged Firebase bearer tokens, or unauthorized IAM calls.',
    severity: 'Critical',
    technicalMitigation: 'All Gemini API and Secret Manager calls are strictly server-side (server.ts); GEMINI_API_KEY is retrieved dynamically via @google-cloud/secret-manager or runtime env (zero client exposure); Firebase Admin SDK enforces verifyIdToken on every API route.',
    implementationArtifact: 'server/secrets.ts, server/firebaseAdmin.ts, server.ts',
    verificationStatus: 'Enforced',
  },
];

export const ThreatModelTable: React.FC = () => {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const getZoneIcon = (zone: ThreatZoneEvaluation['zone']) => {
    switch (zone) {
      case 'Input Surfaces':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'Planning & Reasoning':
        return <Cpu className="w-5 h-5 text-indigo-500" />;
      case 'Tool Execution':
        return <Shield className="w-5 h-5 text-blue-500" />;
      case 'Memory & State':
        return <Database className="w-5 h-5 text-emerald-500" />;
      case 'Inter-System Communication':
        return <Network className="w-5 h-5 text-purple-500" />;
    }
  };

  const getSeverityBadge = (severity: ThreatZoneEvaluation['severity']) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      case 'High':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'Medium':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      default:
        return 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20';
    }
  };

  return (
    <div id="threat-model-section" className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl border border-black/5 dark:border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] text-xs font-semibold tracking-wide">
              <Shield className="w-3.5 h-3.5" />
              Agentic Threat Model Matrix
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
              5 Threat Zones & Technical Mitigations
            </h2>
            <p className="text-sm text-[#86868B] max-w-2xl">
              Evaluation of potential attack surfaces across the AI agent lifecycle with corresponding
              cryptographic, architectural, and access control guardrails enforced in this deployment.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#34C759]/10 border border-[#34C759]/20 text-[#34C759] text-xs font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Zero-Trust Architecture Enforced
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {THREAT_MODEL_DATA.map((item) => (
          <button
            key={item.zone}
            onClick={() => setSelectedZone(selectedZone === item.zone ? null : item.zone)}
            className={`p-4 rounded-2xl text-left transition-all duration-300 border ${
              selectedZone === item.zone
                ? 'bg-[#0071E3]/10 border-[#0071E3] dark:border-[#2997FF] shadow-sm'
                : 'bg-white/60 dark:bg-[#1C1C1E]/60 border-black/5 dark:border-white/10 hover:bg-white/90 dark:hover:bg-[#1C1C1E]/90'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              {getZoneIcon(item.zone)}
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getSeverityBadge(item.severity)}`}>
                {item.severity}
              </span>
            </div>
            <div className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
              {item.zone}
            </div>
            <div className="text-xs text-[#86868B] mt-1 line-clamp-2">
              {item.threatDescription}
            </div>
          </button>
        ))}
      </div>

      {/* Detailed Table */}
      <div className="rounded-3xl bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl border border-black/5 dark:border-white/10 overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-xs font-semibold text-[#86868B] uppercase tracking-wider">
                <th className="py-4 px-6">Threat Zone</th>
                <th className="py-4 px-6">Threat & Attack Vector</th>
                <th className="py-4 px-6">Severity</th>
                <th className="py-4 px-6">Technical Mitigation</th>
                <th className="py-4 px-6">Implementation Artifact</th>
                <th className="py-4 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/10">
              {THREAT_MODEL_DATA.map((item) => {
                const isSelected = selectedZone === item.zone;
                return (
                  <tr
                    key={item.zone}
                    className={`transition-colors duration-150 ${
                      isSelected ? 'bg-[#0071E3]/5 dark:bg-[#0071E3]/10' : 'hover:bg-black/[0.01] dark:hover:bg-white/[0.01]'
                    }`}
                  >
                    <td className="py-4 px-6 font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        {getZoneIcon(item.zone)}
                        <span>{item.zone}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 max-w-xs">
                      <div className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">{item.threatDescription}</div>
                      <div className="text-xs text-[#86868B] mt-1 font-mono">{item.attackVector}</div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${getSeverityBadge(item.severity)}`}>
                        {item.severity}
                      </span>
                    </td>
                    <td className="py-4 px-6 max-w-sm text-xs leading-relaxed text-[#1D1D1F] dark:text-[#D1D1D6]">
                      {item.technicalMitigation}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-xs font-mono text-[#86868B]">
                      {item.implementationArtifact}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#34C759]/10 text-[#34C759] text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {item.verificationStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
