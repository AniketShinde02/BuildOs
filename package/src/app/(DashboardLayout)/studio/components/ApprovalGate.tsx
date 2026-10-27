'use client';

/**
 * ApprovalGate — Pauses the UX at WAITING_FOR_APPROVAL
 * Shows the content brief, strategy, and research summary.
 * User can approve, request modifications, or cancel.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Button, Stack, TextField, Chip, Divider } from '@mui/material';
import { IconCheck, IconEdit, IconSearch, IconBrain, IconTarget, IconUsers } from '@tabler/icons-react';
import { ContentExecutionEvent } from '@/lib/studio/engine/v2/models/ContentExecutionEvent';

interface ApprovalGateProps {
  jobId: string;
  approvalEvent: ContentExecutionEvent;
  onApproved: () => void;
}

export const ApprovalGate: React.FC<ApprovalGateProps> = ({ jobId, approvalEvent, onApproved }) => {
  const [mode, setMode] = useState<'review' | 'modify'>('review');
  const [modifications, setModifications] = useState('');
  const [loading, setLoading] = useState(false);

  const meta = approvalEvent.outputMetadata as any;

  const handleApprove = async (withMods?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/content/jobs/${jobId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modifications: withMods }),
      });
      if (!res.ok) throw new Error('Approval failed');
      onApproved();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Box sx={{
        bgcolor: 'rgba(249, 115, 22, 0.04)',
        border: '1px solid rgba(249, 115, 22, 0.3)',
        borderRadius: '14px',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(249, 115, 22, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#F97316' }}>
              <motion.div
                animate={{ scale: [1, 1.6, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#F97316', opacity: 0.5 }}
              />
            </Box>
            <Typography variant="subtitle2" sx={{ color: '#F97316', fontWeight: 800, letterSpacing: '0.04em' }}>
              WHAT I UNDERSTOOD
            </Typography>
          </Stack>
          <Chip size="small" label="AWAITING APPROVAL" sx={{ bgcolor: '#F9731620', color: '#F97316', fontWeight: 700, fontSize: '10px' }} />
        </Box>

        {/* Brief Content */}
        <Box sx={{ p: 2.5 }}>
          <Stack spacing={2.5}>
            {/* Core Brief Fields */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <BriefField icon={<IconBrain size={14} />} label="Topic" value={meta?.topic} color="#3B82F6" />
              <BriefField icon={<IconUsers size={14} />} label="Audience" value={meta?.audience} color="#8B5CF6" />
              <BriefField icon={<IconTarget size={14} />} label="Objective" value={meta?.objective} color="#10B981" />
              <BriefField icon={<IconSearch size={14} />} label="Format" value={meta?.likelyFormat} color="#F59E0B" />
            </Box>

            {/* Recommended Angle */}
            {meta?.angle && (
              <Box sx={{ p: 2, bgcolor: 'rgba(16, 185, 129, 0.06)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.08em', display: 'block', mb: 0.5 }}>
                  Recommended Angle
                </Typography>
                <Typography variant="body2" sx={{ color: '#CBD5E1', lineHeight: 1.6 }}>
                  {meta.angle}
                </Typography>
              </Box>
            )}

            {/* Core Insights */}
            {meta?.coreInsights && meta.coreInsights.length > 0 && (
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.08em', display: 'block', mb: 1 }}>
                  Core Insights ({meta.coreInsights.length})
                </Typography>
                <Stack spacing={0.8}>
                  {meta.coreInsights.map((insight: string, i: number) => (
                    <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
                      <Box sx={{ mt: '5px', width: 6, height: 6, borderRadius: '50%', bgcolor: '#3B82F6', flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '13px', lineHeight: 1.5 }}>
                        {insight}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Research summary */}
            {meta?.evidenceCount > 0 && (
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                🔍 {meta.evidenceCount} evidence claims gathered from web research
              </Typography>
            )}

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

            {/* Modify Mode */}
            {mode === 'modify' && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder='e.g. "Focus more on client acquisition" or "Use 7 slides" or "Make it more practical"'
                  value={modifications}
                  onChange={e => setModifications(e.target.value)}
                  sx={{
                    mb: 1.5,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px', bgcolor: 'rgba(0,0,0,0.2)', color: 'text.primary', fontSize: '13px',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      '&.Mui-focused fieldset': { borderColor: '#F97316' },
                    }
                  }}
                />
              </motion.div>
            )}

            {/* Actions */}
            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={<IconCheck size={16} />}
                disabled={loading}
                onClick={() => handleApprove(mode === 'modify' ? modifications : undefined)}
                sx={{ fontWeight: 700, borderRadius: '8px', bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' }, textTransform: 'none', px: 2.5 }}
              >
                {mode === 'modify' ? 'Apply & Build' : 'Approve & Build'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<IconEdit size={16} />}
                onClick={() => setMode(mode === 'modify' ? 'review' : 'modify')}
                sx={{ fontWeight: 700, borderRadius: '8px', borderColor: '#F97316', color: '#F97316', '&:hover': { bgcolor: '#F9731610' }, textTransform: 'none' }}
              >
                {mode === 'modify' ? 'Cancel Edit' : 'Request Changes'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </motion.div>
  );
};

const BriefField: React.FC<{ icon: React.ReactNode; label: string; value?: string; color: string }> = ({ icon, label, value, color }) => (
  <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
    <Stack direction="row" spacing={1} alignItems="center" mb={0.5} sx={{ color }}>
      {icon}
      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.06em' }}>
        {label}
      </Typography>
    </Stack>
    <Typography variant="body2" sx={{ color: '#CBD5E1', fontSize: '13px', lineHeight: 1.4 }}>
      {value || '—'}
    </Typography>
  </Box>
);
