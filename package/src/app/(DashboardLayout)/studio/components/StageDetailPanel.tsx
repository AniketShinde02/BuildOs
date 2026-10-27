'use client';

/**
 * StageDetailPanel — Shows full metadata for any clicked stage.
 * In developer mode, shows provider/model/latency/trace details.
 */
import React from 'react';
import { Box, Typography, Stack, Chip, Divider } from '@mui/material';
import { IconX } from '@tabler/icons-react';
import { ContentExecutionEvent } from '@/lib/studio/engine/v2/models/ContentExecutionEvent';

interface StageDetailPanelProps {
  event: ContentExecutionEvent | null;
  devMode: boolean;
  onClose: () => void;
}

const formatMs = (ms?: number): string => {
  if (!ms) return 'N/A';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

const statusColor = (status: string): string => {
  switch (status) {
    case 'COMPLETED':           return '#10B981';
    case 'FAILED':              return '#EF4444';
    case 'RUNNING':             return '#3B82F6';
    case 'WAITING_FOR_APPROVAL':return '#F97316';
    default:                    return '#64748B';
  }
};

export const StageDetailPanel: React.FC<StageDetailPanelProps> = ({ event, devMode, onClose }) => {
  if (!event) return null;

  return (
    <Box sx={{
      bgcolor: 'rgba(0,0,0,0.4)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.08em' }}>
          Stage Detail
        </Typography>
        <Box component="button" onClick={onClose} sx={{ cursor: 'pointer', bgcolor: 'transparent', border: 'none', color: '#64748B', '&:hover': { color: 'white' }, display: 'flex', alignItems: 'center', p: 0.5 }}>
          <IconX size={14} />
        </Box>
      </Stack>

      <Box sx={{ p: 2 }}>
        <Stack spacing={2}>
          {/* Stage + Status */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 0.5, fontSize: '16px' }}>
                {event.label}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                {event.agent || 'BuildOS'}
              </Typography>
            </Box>
            <Chip
              size="small"
              label={event.status}
              sx={{ bgcolor: `${statusColor(event.status)}20`, color: statusColor(event.status), fontWeight: 700, fontSize: '10px' }}
            />
          </Stack>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

          {/* Timing */}
          <DetailRow label="Stage" value={event.stage} mono />
          <DetailRow label="Duration" value={formatMs(event.durationMs)} />
          <DetailRow label="Started" value={new Date(event.timestamp).toLocaleTimeString()} />

          {/* Output */}
          {event.outputSummary && (
            <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.5 }}>Output</Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '12px', lineHeight: 1.5 }}>
                {event.outputSummary}
              </Typography>
            </Box>
          )}

          {/* Error info */}
          {event.status === 'FAILED' && (
            <Box sx={{ p: 1.5, bgcolor: '#EF444410', borderRadius: '8px', border: '1px solid #EF444430' }}>
              <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 700, display: 'block', mb: 0.5 }}>
                {event.errorCategory || 'ERROR'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#FCA5A5', fontSize: '12px', lineHeight: 1.5, fontFamily: 'monospace' }}>
                {event.errorMessage}
              </Typography>
              {event.retryable && (
                <Chip size="small" label="RETRYABLE" sx={{ mt: 1, bgcolor: '#F9731615', color: '#F97316', fontSize: '10px', fontWeight: 700 }} />
              )}
            </Box>
          )}

          {/* Developer trace */}
          {devMode && (
            <>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
              <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.06em', display: 'block' }}>
                Developer Trace
              </Typography>
              <Stack spacing={0.8}>
                <DetailRow label="jobId" value={event.jobId} mono small />
                <DetailRow label="eventId" value={event.id} mono small />
                <DetailRow label="sequence" value={String(event.sequence)} mono small />
                <DetailRow label="timestamp" value={String(event.timestamp)} mono small />
                {event.capability && <DetailRow label="capability" value={event.capability} mono small />}
                {event.provider && <DetailRow label="provider" value={event.provider} mono small />}
                {event.model && <DetailRow label="model" value={event.model} mono small />}
                {event.errorCategory && <DetailRow label="errorCategory" value={event.errorCategory} mono small />}
              </Stack>
            </>
          )}

          {/* Sources */}
          {event.sources && event.sources.length > 0 && (
            <>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
              <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.06em', display: 'block' }}>
                Sources ({event.sources.length})
              </Typography>
              <Stack spacing={1}>
                {event.sources.map((src, i) => (
                  <Box key={i} sx={{ p: 1, bgcolor: 'rgba(245, 158, 11, 0.05)', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                    <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 600, display: 'block', fontSize: '11px' }}>
                      {src.domain}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', fontSize: '11px' }}>
                      {src.title?.substring(0, 80)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

const DetailRow: React.FC<{ label: string; value: string; mono?: boolean; small?: boolean }> = ({ label, value, mono, small }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, flexShrink: 0, fontSize: small ? '10px' : '11px' }}>
      {label}
    </Typography>
    <Typography variant="caption" sx={{ color: '#94A3B8', fontFamily: mono ? 'monospace' : undefined, fontSize: small ? '10px' : '11px', textAlign: 'right', wordBreak: 'break-all' }}>
      {value}
    </Typography>
  </Stack>
);
