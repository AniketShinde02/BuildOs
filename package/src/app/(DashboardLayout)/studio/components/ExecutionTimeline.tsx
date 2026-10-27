'use client';

/**
 * ExecutionTimeline — Real-time pipeline visualization
 * 
 * Driven entirely by ContentExecutionEvent stream from SSE.
 * No fake progress. No fabricated durations. All timings from backend.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Stack, Chip, Collapse } from '@mui/material';
import { 
  IconCheck, IconX, IconClock, IconLoader2, 
  IconChevronDown, IconChevronRight,
  IconBrain, IconRadar, IconCode, IconDatabaseSearch,
  IconShieldCheck, IconLayoutGrid, IconPalette, IconSparkles,
  IconSearch, IconUsers, IconTarget, IconHourglass
} from '@tabler/icons-react';
import { ContentExecutionEvent, EventStage, EventStatus } from '@/lib/studio/engine/v2/models/ContentExecutionEvent';

interface ExecutionTimelineProps {
  events: ContentExecutionEvent[];
  onStageClick: (event: ContentExecutionEvent) => void;
  devMode: boolean;
}

const STAGE_META: Record<EventStage, { label: string; agent: string; icon: React.ReactNode; color: string }> = {
  INTAKE:         { label: 'Job Accepted',        agent: 'BuildOS',            icon: <IconHourglass size={16}/>,    color: '#64748B' },
  INTENT:         { label: 'Intent Analysis',     agent: 'Intent Analyst',     icon: <IconBrain size={16}/>,        color: '#3B82F6' },
  RESEARCH_PLAN:  { label: 'Research Planning',   agent: 'Research Planner',   icon: <IconTarget size={16}/>,       color: '#8B5CF6' },
  RESEARCH:       { label: 'Web Research',        agent: 'Web Researcher',     icon: <IconSearch size={16}/>,       color: '#EC4899' },
  EVIDENCE:       { label: 'Evidence Synthesis',  agent: 'Synthesizer',        icon: <IconDatabaseSearch size={16}/>,color: '#F59E0B' },
  STRATEGY:       { label: 'Content Strategy',    agent: 'Content Strategist', icon: <IconRadar size={16}/>,        color: '#10B981' },
  APPROVAL:       { label: 'Awaiting Approval',   agent: 'BuildOS',            icon: <IconUsers size={16}/>,        color: '#F97316' },
  DRAFT:          { label: 'Content Writing',     agent: 'Content Writer',     icon: <IconCode size={16}/>,         color: '#06B6D4' },
  HUMANIZE:       { label: 'Humanization',        agent: 'Humanizer',          icon: <IconSparkles size={16}/>,     color: '#A78BFA' },
  CAROUSEL:       { label: 'Carousel Architecture',agent: 'Carousel Architect',icon: <IconLayoutGrid size={16}/>,   color: '#34D399' },
  DESIGN:         { label: 'Visual Direction',    agent: 'Visual Director',    icon: <IconPalette size={16}/>,      color: '#F472B6' },
  QA:             { label: 'Quality Assurance',   agent: 'QA Reviewer',        icon: <IconShieldCheck size={16}/>,  color: '#FBBF24' },
  RENDER:         { label: 'Render Gate',         agent: 'BuildOS',            icon: <IconCheck size={16}/>,        color: '#10B981' },
};

const statusIcon = (status: EventStatus) => {
  switch (status) {
    case 'COMPLETED':           return <IconCheck size={14} />;
    case 'FAILED':              return <IconX size={14} />;
    case 'RUNNING':             return <IconLoader2 size={14} className="spin" />;
    case 'WAITING_FOR_APPROVAL':return <IconHourglass size={14} />;
    default:                    return <IconClock size={14} />;
  }
};

const statusColor = (status: EventStatus): string => {
  switch (status) {
    case 'COMPLETED':           return '#10B981';
    case 'FAILED':              return '#EF4444';
    case 'RUNNING':             return '#3B82F6';
    case 'WAITING_FOR_APPROVAL':return '#F97316';
    default:                    return '#64748B';
  }
};

const formatMs = (ms?: number): string => {
  if (!ms) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

// Deduplicate events — show the *latest* event per stage
function deduplicateEvents(events: ContentExecutionEvent[]): ContentExecutionEvent[] {
  const stageMap = new Map<EventStage, ContentExecutionEvent>();
  for (const event of events) {
    const existing = stageMap.get(event.stage);
    if (!existing || event.sequence > existing.sequence) {
      stageMap.set(event.stage, event);
    }
  }
  // Maintain ordered stages
  const order: EventStage[] = ['INTAKE','INTENT','RESEARCH_PLAN','RESEARCH','EVIDENCE','STRATEGY','APPROVAL','DRAFT','HUMANIZE','CAROUSEL','DESIGN','QA','RENDER'];
  return order.map(s => stageMap.get(s)).filter(Boolean) as ContentExecutionEvent[];
}

export const ExecutionTimeline: React.FC<ExecutionTimelineProps> = ({ events, onStageClick, devMode }) => {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const displayEvents = deduplicateEvents(events);

  if (displayEvents.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>Waiting for pipeline events...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; display: inline-flex; }`}</style>

      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 2, display: 'block' }}>
        Execution Timeline
      </Typography>

      <Stack spacing={0}>
        {displayEvents.map((event, idx) => {
          const meta = STAGE_META[event.stage] || STAGE_META.INTAKE;
          const isExpanded = expandedStage === event.id;
          const isLast = idx === displayEvents.length - 1;

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
            >
              <Box
                onClick={() => { setExpandedStage(isExpanded ? null : event.id); onStageClick(event); }}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2,
                  cursor: 'pointer',
                  p: 1.5,
                  borderRadius: '8px',
                  transition: 'background 0.15s',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                  position: 'relative',
                }}
              >
                {/* Vertical Line */}
                {!isLast && (
                  <Box sx={{
                    position: 'absolute',
                    left: '23px',
                    top: '36px',
                    bottom: '-8px',
                    width: '2px',
                    bgcolor: event.status === 'COMPLETED' ? `${statusColor(event.status)}33` : 'rgba(255,255,255,0.06)',
                  }} />
                )}

                {/* Status indicator */}
                <Box sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: `${statusColor(event.status)}20`,
                  border: `2px solid ${statusColor(event.status)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: statusColor(event.status),
                  flexShrink: 0,
                  mt: '2px',
                }}>
                  {event.status === 'RUNNING' ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, ease: 'linear', repeat: Infinity }} style={{ display: 'flex' }}>
                      <IconLoader2 size={14} />
                    </motion.div>
                  ) : statusIcon(event.status)}
                </Box>

                {/* Content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: event.status === 'COMPLETED' ? 'text.primary' : event.status === 'FAILED' ? '#EF4444' : event.status === 'RUNNING' ? '#3B82F6' : event.status === 'WAITING_FOR_APPROVAL' ? '#F97316' : 'text.secondary' }}>
                        {meta.label}
                      </Typography>
                      {event.status === 'RUNNING' && (
                        <Chip size="small" label="RUNNING" sx={{ height: 18, fontSize: '10px', fontWeight: 700, bgcolor: '#3B82F620', color: '#3B82F6' }} />
                      )}
                      {event.status === 'WAITING_FOR_APPROVAL' && (
                        <Chip size="small" label="REVIEW" sx={{ height: 18, fontSize: '10px', fontWeight: 700, bgcolor: '#F9731620', color: '#F97316' }} />
                      )}
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {event.durationMs != null && (
                        <Typography variant="caption" sx={{ color: '#64748B', fontFamily: 'monospace', fontSize: '11px' }}>
                          {formatMs(event.durationMs)}
                        </Typography>
                      )}
                      {isExpanded ? <IconChevronDown size={14} color="#64748B" /> : <IconChevronRight size={14} color="#64748B" />}
                    </Stack>
                  </Stack>

                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.3 }}>
                    {meta.agent}
                    {event.sources && event.sources.length > 0 && ` • ${event.sources.length} sources`}
                    {event.outputSummary && !isExpanded && ` — ${event.outputSummary}`}
                  </Typography>

                  {/* Expanded detail */}
                  <Collapse in={isExpanded}>
                    <Box mt={1.5} sx={{ bgcolor: 'rgba(0,0,0,0.3)', borderRadius: '8px', p: 1.5, border: '1px solid rgba(255,255,255,0.06)' }}>
                      {event.outputSummary && (
                        <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 1 }}>
                          {event.outputSummary}
                        </Typography>
                      )}

                      {/* Sources */}
                      {event.sources && event.sources.length > 0 && (
                        <Box mb={1}>
                          <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.06em' }}>
                            Sources ({event.sources.length})
                          </Typography>
                          <Stack spacing={0.5} mt={0.5}>
                            {event.sources.slice(0, 5).map((src, i) => (
                              <Stack key={i} direction="row" spacing={1} alignItems="center">
                                <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#F59E0B', flexShrink: 0 }} />
                                <Typography variant="caption" sx={{ color: '#64748B', fontSize: '11px' }} noWrap>
                                  {src.domain} — {src.title?.substring(0, 50)}
                                </Typography>
                              </Stack>
                            ))}
                          </Stack>
                        </Box>
                      )}

                      {/* Dev mode trace */}
                      {devMode && (
                        <Box sx={{ bgcolor: 'rgba(0,0,0,0.3)', borderRadius: '6px', p: 1, mt: 1, border: '1px solid rgba(255,255,255,0.04)' }}>
                          <Typography variant="caption" sx={{ color: '#475569', fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.04em' }}>
                            {`stage=${event.stage} | status=${event.status} | seq=${event.sequence}`}
                            {event.provider && ` | provider=${event.provider}`}
                            {event.model && ` | model=${event.model}`}
                            {event.capability && ` | capability=${event.capability}`}
                            {event.errorCategory && ` | error=${event.errorCategory}`}
                          </Typography>
                        </Box>
                      )}

                      {/* Error info */}
                      {event.status === 'FAILED' && event.errorMessage && (
                        <Box sx={{ mt: 1, p: 1, bgcolor: '#EF444410', borderRadius: '6px', border: '1px solid #EF444433' }}>
                          <Typography variant="caption" sx={{ color: '#EF4444', fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-word' }}>
                            {event.errorCategory}: {event.errorMessage}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              </Box>
            </motion.div>
          );
        })}
      </Stack>
    </Box>
  );
};
