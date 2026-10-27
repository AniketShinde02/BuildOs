'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, Stack, CircularProgress } from '@mui/material';
import { IconCpu, IconRadar, IconCode, IconDatabaseSearch, IconBrain, IconCheck, IconServerCog } from '@tabler/icons-react';

export type EngineStatus = 'INTAKE' | 'ANALYZING' | 'RESEARCH_PLANNING' | 'RESEARCHING' | 'STRATEGIZING' | 'DRAFTING' | 'HUMANIZING' | 'FORMAT_PLANNING' | 'DESIGNING' | 'QA' | 'READY' | 'FAILED';

interface TrackerProps {
  status: EngineStatus;
}

const statusConfig: Record<EngineStatus, { icon: React.ReactNode; text: string; detail: string; color: string }> = {
  INTAKE: { icon: <IconServerCog />, text: "Awaiting Payload", detail: "Initializing isolated pipeline environment...", color: "#94A3B8" },
  ANALYZING: { icon: <IconCpu />, text: "Intent Analysis", detail: "Parsing semantics, extracting core objective, defining audience boundaries.", color: "#3B82F6" },
  RESEARCH_PLANNING: { icon: <IconRadar />, text: "Research Strategy", detail: "Generating targeted query vectors for real-time web extraction.", color: "#8B5CF6" },
  RESEARCHING: { icon: <IconDatabaseSearch />, text: "Web Extraction Engine", detail: "Scraping parallel data streams. Bypassing noise, indexing high-signal knowledge.", color: "#EC4899" },
  STRATEGIZING: { icon: <IconBrain />, text: "Cognitive Strategy", detail: "Mapping audience tension, defining emotional hooks, and structuring arguments.", color: "#F59E0B" },
  DRAFTING: { icon: <IconCode />, text: "Content Synthesis", detail: "Executing linear copy generation across structural boundaries.", color: "#10B981" },
  HUMANIZING: { icon: <IconCpu />, text: "Anti-AI Filter", detail: "Scrubbing cliché patterns, applying natural cadence, injecting human texture.", color: "#06B6D4" },
  FORMAT_PLANNING: { icon: <IconRadar />, text: "Format Architecture", detail: "Translating linear narrative into spatial slide geometry and pacing.", color: "#6366F1" },
  DESIGNING: { icon: <IconBrain />, text: "Visual Direction", detail: "Mapping layout families, padding math, and color psychology matrices.", color: "#EC4899" },
  QA: { icon: <IconDatabaseSearch />, text: "Quality Audit", detail: "Verifying WCAG AA contrast, hierarchy, and adherence to constraints.", color: "#F59E0B" },
  READY: { icon: <IconCheck />, text: "System Ready", detail: "Pipeline complete. Dispatching payload to rendering engine.", color: "#10B981" },
  FAILED: { icon: <IconServerCog />, text: "System Failure", detail: "A critical threshold was breached. Pipeline aborted.", color: "#EF4444" }
};

export const AIResearchTracker: React.FC<TrackerProps> = ({ status }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const config = statusConfig[status] || statusConfig.INTAKE;

  useEffect(() => {
    setLogs(prev => {
      const newLog = `[SYSTEM] Transitioned state -> ${status}: ${config.text}`;
      const updated = [...prev, newLog];
      return updated.slice(-6); // Keep last 6 logs for terminal view
    });
  }, [status, config.text]);

  return (
    <Box 
      sx={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: '#0f172a',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
        position: 'relative',
        boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)'
      }}
    >
      {/* Top Gradient Scanning Line */}
      <motion.div
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 3, ease: "linear", repeat: Infinity }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${config.color}, transparent)`,
          zIndex: 10
        }}
      />

      <Box sx={{ p: 4, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ width: '100%' }}
          >
            <Stack direction="row" spacing={3} alignItems="center" justifyContent="center">
              <Box sx={{ p: 2, borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: config.color, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {status !== 'READY' && status !== 'FAILED' && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, ease: "linear", repeat: Infinity }}
                    style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '16px', border: `1px dashed ${config.color}`, opacity: 0.3 }}
                  />
                )}
                <Box sx={{ color: config.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {config.icon}
                </Box>
              </Box>
              
              <Box>
                <Typography variant="caption" sx={{ color: config.color, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  {status !== 'READY' && status !== 'FAILED' && <CircularProgress size={12} sx={{ color: config.color }} thickness={6} />}
                  PHASE: {status}
                </Typography>
                <Typography variant="h4" sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.02em', mb: 1 }}>
                  {config.text}
                </Typography>
                <Typography variant="body1" sx={{ color: '#94a3b8', maxWidth: '400px', lineHeight: 1.6 }}>
                  {config.detail}
                </Typography>
              </Box>
            </Stack>
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* Terminal Logs Output */}
      <Box sx={{ bgcolor: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(255,255,255,0.05)', p: 2, pt: 2.5, px: 3, height: '180px' }}>
        <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700, mb: 1.5, display: 'block', letterSpacing: '0.05em' }}>
          LIVE PIPELINE TELEMETRY
        </Typography>
        <Stack spacing={1}>
          <AnimatePresence initial={false}>
            {logs.map((log, i) => (
              <motion.div
                key={log + i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: i === logs.length - 1 ? 1 : 0.5, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '12px', color: i === logs.length - 1 ? config.color : '#64748b' }}>
                  <span style={{ opacity: 0.5 }}>{new Date().toISOString().split('T')[1].slice(0, 8)}</span> {log}
                </Typography>
              </motion.div>
            ))}
          </AnimatePresence>
        </Stack>
      </Box>
    </Box>
  );
}
