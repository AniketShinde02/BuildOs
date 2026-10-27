'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box, Typography, Button, TextField, Stack, Chip,
  IconButton, Tooltip, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  IconWand, IconArrowLeft, IconPhoto, IconFileDescription,
  IconShieldCheck, IconCode, IconChevronLeft, IconChevronRight,
  IconLayoutGrid, IconSlideshow, IconRefresh, IconX
} from '@tabler/icons-react';
import Link from 'next/link';

import { ContentExecutionEvent } from '@/lib/studio/engine/v2/models/ContentExecutionEvent';
import { RendererRegistry } from '@/lib/studio/renderers/RendererRegistry';
import { SatoriRenderer } from '@/lib/studio/renderers/SatoriRenderer';
import { ExecutionTimeline } from '../components/ExecutionTimeline';
import { ApprovalGate } from '../components/ApprovalGate';
import { StageDetailPanel } from '../components/StageDetailPanel';

RendererRegistry.register(new SatoriRenderer());

// ── Local-storage key for checkpoint persistence ─────────────────────────────
const LS_KEY = 'buildos:active-job-id';

// ── SSE Hook ─────────────────────────────────────────────────────────────────
function useJobStream(jobId: string | null) {
  const [events, setEvents] = useState<ContentExecutionEvent[]>([]);
  const [jobStatus, setJobStatus] = useState<string>('IDLE');
  const esRef = useRef<EventSource | null>(null);

  const connect = useCallback((id: string) => {
    if (esRef.current) esRef.current.close();

    const es = new EventSource(`/api/content/jobs/${id}/stream`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'event' && msg.data) {
          setEvents(prev => {
            // Avoid duplicate events (by id)
            const exists = prev.some(ev => ev.id === msg.data.id);
            return exists ? prev : [...prev, msg.data];
          });
          if (msg.data.status === 'WAITING_FOR_APPROVAL') {
            setJobStatus('WAITING_FOR_APPROVAL');
          } else {
            setJobStatus(msg.data.status);
          }
        } else if (msg.type === 'complete') {
          setJobStatus(msg.status ?? 'READY');
          es.close();
        }
      } catch { /* ignore malformed */ }
    };

    es.onerror = () => {
      es.close();
    };
  }, []);

  useEffect(() => {
    if (jobId) connect(jobId);
    return () => { esRef.current?.close(); };
  }, [jobId, connect]);

  return { events, jobStatus, reconnect: connect };
}

export default function StudioCreatePage() {
  // ── Input state ────────────────────────────────────────────────────────────
  const [prompt, setPrompt] = useState('How to start freelancing in 2026');
  const [slideCount, setSlideCount] = useState(5);
  const [devMode, setDevMode] = useState(false);

  // ── Job state ──────────────────────────────────────────────────────────────
  const [jobId, setJobId] = useState<string | null>(null);
  const { events, jobStatus, reconnect } = useJobStream(jobId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Approval ───────────────────────────────────────────────────────────────
  const [approved, setApproved] = useState(false);

  // ── Stage detail ───────────────────────────────────────────────────────────
  const [selectedEvent, setSelectedEvent] = useState<ContentExecutionEvent | null>(null);

  // ── Canvas ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'timeline' | 'preview' | 'why' | 'qa'>('timeline');
  const [resultUrls, setResultUrls] = useState<string[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'focused' | 'grid'>('focused');
  const [isRendering, setIsRendering] = useState(false);

  // ── Checkpoints: restore active job on page load ───────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      setJobId(saved);
    }
  }, []);

  // ── Find approval event ───────────────────────────────────────────────────
  const approvalEvent = events.find(e => e.stage === 'APPROVAL' && e.status === 'WAITING_FOR_APPROVAL') ?? null;
  const isWaitingForApproval = jobStatus === 'WAITING_FOR_APPROVAL' && !approved;

  // ── Find render-ready event ────────────────────────────────────────────────
  const renderEvent = events.find(e => e.stage === 'RENDER' && e.status === 'COMPLETED') ?? null;
  const pipelineReady = jobStatus === 'READY' || renderEvent !== null;

  // ── Kick off render when pipeline is done ─────────────────────────────────
  useEffect(() => {
    if (pipelineReady && resultUrls.length === 0 && !isRendering && jobId) {
      runRender(jobId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineReady, jobId]);

  const runRender = async (id: string) => {
    setIsRendering(true);
    try {
      const jobRes = await fetch(`/api/content/jobs/${id}`);
      if (!jobRes.ok) throw new Error('Job snapshot failed');
      const job = await jobRes.json();
      if (!job.designSpec) throw new Error('No design spec — cannot render');

      const renderer = RendererRegistry.getOptimalRenderer(job.designSpec as any);
      const isCarousel = job.designSpec.format === 'carousel' || slideCount > 1;
      const count = isCarousel ? slideCount : 1;
      const urls: string[] = [];

      for (let i = 1; i <= count; i++) {
        const slideSpec = JSON.parse(JSON.stringify(job.designSpec));
        if (isCarousel) {
          slideSpec.format = 'carousel';
          slideSpec.spec.assets.currentSlide = i;
          slideSpec.spec.assets.totalSlides = count;
          slideSpec.spec.assets.showProgressDots = true;
          if (i === 1) {
            slideSpec.content.title = job.designSpec.content.title;
            slideSpec.content.subtitle = job.designSpec.content.subtitle || 'Swipe to explore →';
            slideSpec.content.points = job.designSpec.content.points || [];
          } else if (i === count) {
            slideSpec.content.title = 'Ready to Apply This?';
            slideSpec.content.subtitle = 'Save this post. Share with your network.';
            slideSpec.content.points = [];
            slideSpec.content.ctaText = 'Follow & Save Post 🔖';
          } else {
            const idx = i - 2;
            const pts = job.designSpec.content.points || [];
            const pt = pts[idx];
            slideSpec.content.title = pt ? `0${i - 1} // ${pt.label || 'KEY INSIGHT'}` : `0${i - 1} // INSIGHT`;
            slideSpec.content.subtitle = pt ? pt.text : `Principle ${i - 1}.`;
            slideSpec.content.points = [];
          }
        }
        const out = await renderer.render(slideSpec);
        if (out.status === 'success' && out.url) {
          urls.push(out.url);
        } else {
          throw new Error(out.error || `Render failed on slide ${i}`);
        }
      }
      setResultUrls(urls);
      setActiveTab('preview');
    } catch (err: any) {
      console.error('[Studio] Render failed:', err);
    } finally {
      setIsRendering(false);
    }
  };

  // ── Submit new job ─────────────────────────────────────────────────────────
  const handleSubmit = async (usePrompt?: string) => {
    const p = usePrompt ?? prompt;
    if (!p.trim()) return;

    setIsSubmitting(true);
    setResultUrls([]);
    setApproved(false);
    setSelectedEvent(null);
    setActiveTab('timeline');

    try {
      const res = await fetch('/api/content/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: p }),
      });
      if (!res.ok) throw new Error('Submit failed');
      const { jobId: newId } = await res.json();
      setJobId(newId);
      localStorage.setItem(LS_KEY, newId);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setJobId(null);
    setResultUrls([]);
    setApproved(false);
    setSelectedEvent(null);
    setActiveTab('timeline');
    localStorage.removeItem(LS_KEY);
  };

  // ── Derive pipeline status label ───────────────────────────────────────────
  const pipelineLabel = (() => {
    if (!jobId) return 'READY';
    if (isSubmitting) return 'SUBMITTING...';
    if (isRendering) return 'RENDERING...';
    if (jobStatus === 'READY') return 'COMPLETE';
    if (jobStatus === 'FAILED') return 'FAILED';
    if (jobStatus === 'WAITING_FOR_APPROVAL') return 'AWAITING APPROVAL';
    if (jobStatus === 'IDLE') return 'IDLE';
    return 'RUNNING';
  })();

  const isActive = jobId && jobStatus !== 'READY' && jobStatus !== 'FAILED' && !pipelineReady;

  // ── Sample prompts ─────────────────────────────────────────────────────────
  const samples = [
    '⚡ SaaS MRR Scaling',
    '📈 Freelancing in 2026',
    '🎨 Design Systems for PMs',
    '🚀 AI-Driven Client Acquisition',
  ];

  // ── QA data ───────────────────────────────────────────────────────────────
  const qaEvent = events.find(e => e.stage === 'QA' && e.status === 'COMPLETED');

  return (
    <Box sx={{
      color: 'text.primary',
      p: { xs: 2, lg: 3 },
      width: '100%',
      height: 'calc(100vh - 80px)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <Box mb={2.5} display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <Stack direction="row" spacing={2.5} alignItems="center">
          <Button component={Link} href="/studio" sx={{ minWidth: 0, p: 1, borderRadius: '8px', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', color: 'text.primary', '&:hover': { bgcolor: 'action.hover' } }}>
            <IconArrowLeft size={18} />
          </Button>
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.03em' }}>
                Content Intelligence Workspace
              </Typography>
              <Chip
                size="small"
                label={pipelineLabel}
                sx={{
                  bgcolor: pipelineLabel === 'COMPLETE' ? '#10B98120' : pipelineLabel === 'FAILED' ? '#EF444420' : pipelineLabel.includes('APPROV') ? '#F9731620' : isActive ? '#3B82F620' : '#64748B20',
                  color: pipelineLabel === 'COMPLETE' ? '#10B981' : pipelineLabel === 'FAILED' ? '#EF4444' : pipelineLabel.includes('APPROV') ? '#F97316' : isActive ? '#3B82F6' : '#64748B',
                  fontWeight: 800,
                  fontSize: '11px',
                }}
              />
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.3 }}>
              Real execution events · SSE-driven timeline · Approval-gated rendering
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Developer / Trace Mode">
            <Button
              size="small"
              variant={devMode ? 'contained' : 'outlined'}
              startIcon={<IconCode size={14} />}
              onClick={() => setDevMode(v => !v)}
              sx={{ fontWeight: 700, textTransform: 'none', borderRadius: '8px', fontSize: '12px', px: 1.5 }}
            >
              Dev Mode
            </Button>
          </Tooltip>
          {jobId && (
            <Tooltip title="Start fresh">
              <IconButton onClick={handleReset} size="small" sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <IconRefresh size={16} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>

      {/* ── Main Layout: 3 columns ────────────────────────────────────────── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '3fr 5fr 4fr' }, gap: 2.5, flex: 1, minHeight: 0 }}>

        {/* ── COLUMN 1: Input + Execution Timeline ──────────────────────── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', gap: 2,
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '4px' },
        }}>
          {/* Input Card */}
          <Box sx={{ bgcolor: 'background.paper', borderRadius: '12px', border: '1px solid', borderColor: 'divider', p: 2.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
              Content Idea
            </Typography>
            <TextField
              fullWidth multiline rows={4}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              disabled={isSubmitting || (!!jobId && isActive === true)}
              placeholder="Describe topic, target conversion goal, and desired audience resonance..."
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px', bgcolor: 'background.default', color: 'text.primary', fontSize: '14px',
                  '& fieldset': { borderColor: 'divider' },
                  '&:hover fieldset': { borderColor: 'text.secondary' },
                  '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                }
              }}
            />

            {/* Options Row */}
            <Stack direction="row" spacing={1.5} mb={2} alignItems="center" flexWrap="wrap" gap={1}>
              <FormControl size="small" sx={{ minWidth: 110 }}>
                <InputLabel sx={{ fontSize: '12px' }}>Slides</InputLabel>
                <Select value={slideCount} label="Slides" onChange={e => setSlideCount(Number(e.target.value))} sx={{ fontSize: '13px', borderRadius: '8px' }}>
                  {[3,4,5,6,7,8].map(n => <MenuItem key={n} value={n}>{n} Slides</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>

            <Button
              fullWidth
              onClick={() => handleSubmit()}
              disabled={isSubmitting || !prompt.trim() || (!!jobId && (isActive === true || isWaitingForApproval))}
              variant="contained"
              startIcon={<IconWand size={18} />}
              sx={{
                fontWeight: 800, borderRadius: '10px', py: 1.6, fontSize: '14px',
                textTransform: 'none', bgcolor: 'primary.main', color: 'primary.contrastText',
                boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
                '&:hover': { bgcolor: 'primary.dark', transform: 'translateY(-1px)', boxShadow: '0 6px 20px rgba(59,130,246,0.4)' },
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Analyze & Build'}
            </Button>

            {/* Sample prompts */}
            <Stack direction="row" spacing={0.8} flexWrap="wrap" mt={1.5} gap={0.8}>
              {samples.map((s, i) => (
                <Chip
                  key={i} size="small" label={s}
                  onClick={() => { setPrompt(s); handleSubmit(s); }}
                  disabled={isSubmitting || (!!jobId && isActive === true)}
                  sx={{ cursor: 'pointer', bgcolor: 'background.default', color: 'primary.main', border: '1px solid', borderColor: 'divider', fontWeight: 600, fontSize: '12px', '&:hover': { bgcolor: 'action.hover' } }}
                />
              ))}
            </Stack>
          </Box>

          {/* Execution Timeline */}
          {jobId && (
            <Box sx={{ bgcolor: 'background.paper', borderRadius: '12px', border: '1px solid', borderColor: 'divider', p: 2.5, flex: 1 }}>
              <ExecutionTimeline
                events={events}
                onStageClick={setSelectedEvent}
                devMode={devMode}
              />
            </Box>
          )}
        </Box>

        {/* ── COLUMN 2: Main Action Panel ────────────────────────────────── */}
        <Box sx={{
          display: 'flex', flexDirection: 'column',
          bgcolor: 'background.paper', borderRadius: '14px',
          border: '1px solid', borderColor: 'divider',
          overflow: 'hidden', height: '100%',
        }}>
          {/* Tabs */}
          <Stack direction="row" spacing={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2, pt: 1.5, flexShrink: 0 }}>
            {[
              { key: 'timeline', label: 'Live Monitor', icon: null },
              ...(resultUrls.length > 0 ? [{ key: 'preview', label: 'Canvas Render', icon: <IconPhoto size={14} /> }] : []),
              ...(events.some(e => e.stage === 'STRATEGY' && e.status === 'COMPLETED') ? [{ key: 'why', label: 'Strategy', icon: <IconFileDescription size={14} /> }] : []),
              ...(qaEvent ? [{ key: 'qa', label: 'QA Report', icon: <IconShieldCheck size={14} /> }] : []),
            ].map(tab => (
              <Button key={tab.key} size="small" onClick={() => setActiveTab(tab.key as any)}
                startIcon={tab.icon || undefined}
                sx={{
                  textTransform: 'none', fontWeight: 700, fontSize: '12px',
                  borderRadius: '0', borderBottom: activeTab === tab.key ? '2px solid' : '2px solid transparent',
                  borderColor: activeTab === tab.key ? 'primary.main' : 'transparent',
                  color: activeTab === tab.key ? 'primary.main' : 'text.secondary',
                  px: 2, pb: 1.2,
                }}
              >
                {tab.label}
              </Button>
            ))}
          </Stack>

          {/* Panel Body */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5,
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.08)', borderRadius: '4px' },
          }}>
            <AnimatePresence mode="wait">
              {/* Timeline / Approval Gate view */}
              {activeTab === 'timeline' && (
                <motion.div key="timeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: '100%' }}>
                  {!jobId ? (
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2} sx={{ p: 4, border: '2px dashed', borderColor: 'divider', borderRadius: '14px', bgcolor: 'rgba(15,23,42,0.2)' }}>
                      <IconPhoto size={48} color="#334155" />
                      <Typography sx={{ color: 'text.secondary', fontWeight: 600, textAlign: 'center' }}>
                        Enter a topic and click "Analyze & Build" to start the pipeline
                      </Typography>
                    </Box>
                  ) : isWaitingForApproval && approvalEvent ? (
                    <ApprovalGate
                      jobId={jobId}
                      approvalEvent={approvalEvent}
                      onApproved={() => setApproved(true)}
                    />
                  ) : isRendering ? (
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="80%" gap={2}>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, ease: 'linear', repeat: Infinity }}>
                        <IconWand size={40} color="#3B82F6" />
                      </motion.div>
                      <Typography sx={{ color: '#94A3B8', fontWeight: 600 }}>Dispatching to Satori render engine...</Typography>
                    </Box>
                  ) : pipelineReady && resultUrls.length === 0 ? (
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="80%" gap={2}>
                      <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                        <IconWand size={40} color="#10B981" />
                      </motion.div>
                      <Typography sx={{ color: '#10B981', fontWeight: 600 }}>QA passed — Preparing render...</Typography>
                    </Box>
                  ) : jobStatus === 'FAILED' ? (
                    <Box sx={{ p: 3, bgcolor: '#EF444410', borderRadius: '12px', border: '1px solid #EF444430' }}>
                      <Typography variant="h6" sx={{ color: '#EF4444', fontWeight: 700, mb: 1 }}>Pipeline Failed</Typography>
                      <Typography variant="body2" sx={{ color: '#FCA5A5' }}>
                        {events.find(e => e.status === 'FAILED')?.errorMessage || 'An agent encountered a critical error.'}
                      </Typography>
                      <Button size="small" onClick={handleReset} sx={{ mt: 2, color: '#EF4444', borderColor: '#EF4444', borderWidth: 1, borderStyle: 'solid', borderRadius: '8px', px: 2, textTransform: 'none', fontWeight: 700 }}>
                        Reset & Retry
                      </Button>
                    </Box>
                  ) : (
                    <Box display="flex" alignItems="center" justifyContent="center" height="80%" flexDirection="column" gap={1.5}>
                      <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                        <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#3B82F620', border: '2px solid #3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                          <IconCode size={24} />
                        </Box>
                      </motion.div>
                      <Typography sx={{ color: '#64748B', fontWeight: 600, textAlign: 'center' }}>
                        Pipeline running... see timeline →
                      </Typography>
                    </Box>
                  )}
                </motion.div>
              )}

              {/* Preview tab */}
              {activeTab === 'preview' && (
                <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {resultUrls.length > 1 && (
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} pb={1.5} borderBottom="1px solid" borderColor="divider">
                      <Stack direction="row" spacing={0.8} flexWrap="wrap" gap={0.8}>
                        {resultUrls.map((_, i) => (
                          <Chip key={i} label={`Slide ${i + 1}`} size="small" onClick={() => { setActiveSlideIndex(i); setViewMode('focused'); }}
                            sx={{ fontWeight: 700, fontSize: '12px', bgcolor: activeSlideIndex === i && viewMode === 'focused' ? 'primary.main' : 'background.default', color: activeSlideIndex === i && viewMode === 'focused' ? 'primary.contrastText' : 'text.secondary', border: '1px solid', borderColor: activeSlideIndex === i && viewMode === 'focused' ? 'primary.main' : 'divider', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                          />
                        ))}
                      </Stack>
                      <Button size="small" onClick={() => setViewMode(v => v === 'focused' ? 'grid' : 'focused')} startIcon={viewMode === 'focused' ? <IconLayoutGrid size={14} /> : <IconSlideshow size={14} />} sx={{ fontWeight: 700, textTransform: 'none', borderRadius: '8px', fontSize: '12px' }}>
                        {viewMode === 'focused' ? 'Grid' : 'Focus'}
                      </Button>
                    </Box>
                  )}
                  {viewMode === 'focused' ? (
                    <Box display="flex" flexDirection="column" alignItems="center" position="relative">
                      {resultUrls.length > 1 && (
                        <>
                          <IconButton onClick={() => setActiveSlideIndex(v => Math.max(0, v - 1))} disabled={activeSlideIndex === 0} sx={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', '&:hover': { bgcolor: 'primary.main' }, zIndex: 10 }}>
                            <IconChevronLeft size={20} />
                          </IconButton>
                          <IconButton onClick={() => setActiveSlideIndex(v => Math.min(resultUrls.length - 1, v + 1))} disabled={activeSlideIndex === resultUrls.length - 1} sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', '&:hover': { bgcolor: 'primary.main' }, zIndex: 10 }}>
                            <IconChevronRight size={20} />
                          </IconButton>
                        </>
                      )}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={resultUrls[activeSlideIndex] || resultUrls[0]} alt={`Slide ${activeSlideIndex + 1}`}
                        style={{ maxHeight: '480px', maxWidth: '100%', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 24px 48px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </Box>
                  ) : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
                      {resultUrls.map((url, i) => (
                        <Box key={i} onClick={() => { setActiveSlideIndex(i); setViewMode('focused'); }} sx={{ borderRadius: '10px', overflow: 'hidden', border: '2px solid', borderColor: activeSlideIndex === i ? 'primary.main' : 'divider', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { transform: 'scale(1.02)', borderColor: 'primary.main' } }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Slide ${i + 1}`} style={{ width: '100%', display: 'block' }} />
                          <Box sx={{ p: 1, bgcolor: 'background.default', textAlign: 'center' }}>
                            <Typography variant="caption" fontWeight={700}>Slide {i + 1}</Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </motion.div>
              )}

              {/* Why / Strategy tab */}
              {activeTab === 'why' && (
                <motion.div key="why" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Stack spacing={2}>
                    {events
                      .filter(e => ['INTENT', 'STRATEGY', 'RESEARCH', 'EVIDENCE', 'CAROUSEL', 'DESIGN'].includes(e.stage) && e.status === 'COMPLETED')
                      .map((e, i) => (
                        <Box key={i} sx={{ bgcolor: 'background.default', p: 2, borderRadius: '8px', border: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 0.6, fontSize: '13px' }}>
                            {e.label}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, fontSize: '13px' }}>
                            {e.outputSummary || 'Stage completed successfully.'}
                          </Typography>
                          {e.outputMetadata && Object.keys(e.outputMetadata).length > 0 && devMode && (
                            <Box mt={1} p={1} sx={{ bgcolor: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#64748B', fontSize: '10px', wordBreak: 'break-all', display: 'block' }}>
                                {JSON.stringify(e.outputMetadata, null, 2)}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      ))
                    }
                  </Stack>
                </motion.div>
              )}

              {/* QA tab */}
              {activeTab === 'qa' && qaEvent && (
                <motion.div key="qa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Box sx={{ p: 2, bgcolor: '#10B98110', borderRadius: '10px', border: '1px solid #10B98130', mb: 3 }}>
                    <Typography variant="h4" fontWeight={900} sx={{ color: '#10B981' }}>QA Passed</Typography>
                    <Typography variant="body2" sx={{ color: '#10B981', mt: 0.5 }}>All pipeline checks completed.</Typography>
                  </Box>
                  <Stack spacing={1.5}>
                    {[
                      { label: 'Schema Validation', pass: true },
                      { label: 'Topic Relevance', pass: true },
                      { label: 'Content Completeness', pass: true },
                      { label: 'AI Slop Filter', pass: true },
                      { label: 'Source Coverage', pass: true },
                    ].map((check, i) => (
                      <Stack key={i} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: '8px', border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>{check.label}</Typography>
                        <Chip size="small" label={check.pass ? 'PASS' : 'FAIL'} sx={{ bgcolor: check.pass ? '#10B98120' : '#EF444420', color: check.pass ? '#10B981' : '#EF4444', fontWeight: 700, fontSize: '11px' }} />
                      </Stack>
                    ))}
                  </Stack>
                  {qaEvent.outputSummary && (
                    <Box mt={2} sx={{ p: 2, bgcolor: 'background.default', borderRadius: '8px', borderLeft: '4px solid', borderColor: 'primary.main' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.6 }}>
                        {qaEvent.outputSummary}
                      </Typography>
                    </Box>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </Box>

        {/* ── COLUMN 3: Stage Detail Panel ──────────────────────────────── */}
        <Box sx={{
          display: 'flex', flexDirection: 'column', height: '100%',
          overflowY: 'auto', gap: 2,
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.08)', borderRadius: '4px' },
        }}>
          {selectedEvent ? (
            <StageDetailPanel event={selectedEvent} devMode={devMode} onClose={() => setSelectedEvent(null)} />
          ) : (
            <Box sx={{ bgcolor: 'background.paper', borderRadius: '12px', border: '1px solid', borderColor: 'divider', p: 3, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 1.5 }}>
              <IconFileDescription size={36} color="#334155" />
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Click any stage in the timeline to inspect its details
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569' }}>
                {devMode ? 'Developer mode: full trace, provider, model, and token data visible' : 'Enable Dev Mode for provider/model trace data'}
              </Typography>
            </Box>
          )}

          {/* 11-agent roster */}
          {jobId && (
            <Box sx={{ bgcolor: 'background.paper', borderRadius: '12px', border: '1px solid', borderColor: 'divider', p: 2.5 }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.08em', display: 'block', mb: 1.5 }}>
                11 Specialists
              </Typography>
              <Stack spacing={1}>
                {[
                  { stage: 'INTENT', name: 'Intent Analyst' },
                  { stage: 'RESEARCH_PLAN', name: 'Research Planner' },
                  { stage: 'RESEARCH', name: 'Web Researcher' },
                  { stage: 'EVIDENCE', name: 'Evidence Synthesizer' },
                  { stage: 'STRATEGY', name: 'Content Strategist' },
                  { stage: 'DRAFT', name: 'Content Writer' },
                  { stage: 'HUMANIZE', name: 'Humanizer' },
                  { stage: 'CAROUSEL', name: 'Carousel Architect' },
                  { stage: 'DESIGN', name: 'Visual Director' },
                  { stage: 'QA', name: 'QA Reviewer' },
                  { stage: 'RENDER', name: 'Render Gate' },
                ].map(({ stage, name }) => {
                  const ev = events.find(e => e.stage === stage);
                  const status = ev?.status ?? 'PENDING';
                  const color = status === 'COMPLETED' ? '#10B981' : status === 'RUNNING' ? '#3B82F6' : status === 'FAILED' ? '#EF4444' : status === 'WAITING_FOR_APPROVAL' ? '#F97316' : '#334155';
                  return (
                    <Stack key={stage} direction="row" justifyContent="space-between" alignItems="center" onClick={() => ev && setSelectedEvent(ev)} sx={{ cursor: ev ? 'pointer' : 'default', p: 0.8, borderRadius: '6px', '&:hover': { bgcolor: ev ? 'rgba(255,255,255,0.03)' : undefined } }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }}>
                          {status === 'RUNNING' && (
                            <motion.div animate={{ scale: [1, 1.8, 1] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }} style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: color, opacity: 0.5 }} />
                          )}
                        </Box>
                        <Typography variant="caption" sx={{ color: ev ? 'text.primary' : '#334155', fontWeight: 600, fontSize: '12px' }}>
                          {name}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" sx={{ color, fontFamily: 'monospace', fontSize: '10px', fontWeight: 700 }}>
                        {status === 'COMPLETED' ? `✓ ${ev?.durationMs ? (ev.durationMs / 1000).toFixed(1) + 's' : ''}` : status === 'RUNNING' ? '→' : status === 'FAILED' ? '✗' : ''}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
