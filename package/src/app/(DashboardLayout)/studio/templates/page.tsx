'use client';
import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Chip, Button } from '@mui/material';
import { IconTemplate, IconArrowLeft, IconWand } from '@tabler/icons-react';
import Link from 'next/link';

interface TemplateSpec {
  id: string;
  name: string;
  category: string;
  format: string;
}

export default function StudioTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateSpec[]>([]);

  useEffect(() => {
    setTemplates([
      { id: 'cyberpunk-quote-01', name: 'Neon Grid', category: 'cyberpunk', format: 'quote' },
      { id: 'editorial-split-01', name: 'Magazine Split', category: 'editorial', format: 'banner' },
      { id: 'apple-minimal-01', name: 'Cupertino Base', category: 'minimal', format: 'infographic' }
    ]);
  }, []);

  return (
    <Box>
      <Box mb={4} display="flex" alignItems="center" gap={2}>
        <Button component={Link} href="/studio" color="inherit" sx={{ minWidth: 0, p: 1, borderRadius: '50%' }}>
          <IconArrowLeft size={20} />
        </Button>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
            Template Library
          </Typography>
          <Typography color="text.secondary">
            AI-driven, dynamically populated Canva-level templates.
          </Typography>
        </Box>
      </Box>

      <Box display="flex" flexWrap="wrap" gap={3}>
        {templates.map(tpl => (
          <Box key={tpl.id} sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 30%' } }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                bgcolor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: '#FF5C00',
                  transform: 'translateY(-4px)',
                }
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Typography variant="h6" fontWeight={700}>
                  {tpl.name}
                </Typography>
                <Chip size="small" label={tpl.category} sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: '#a1a1aa' }} />
              </Box>

              <Typography variant="body2" color="text.secondary" mb={3}>
                Format: <strong style={{ color: '#FAFAFA' }}>{tpl.format.toUpperCase()}</strong>
              </Typography>

              <Box
                sx={{
                  width: '100%',
                  aspectRatio: tpl.format === 'banner' ? '1200/628' : '1/1',
                  bgcolor: 'rgba(0,0,0,0.4)',
                  borderRadius: '8px',
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px dashed rgba(255,255,255,0.1)'
                }}
              >
                <IconTemplate size={40} color="rgba(255,255,255,0.1)" />
              </Box>

              <Button
                component={Link}
                href="/studio/create"
                fullWidth
                variant="outlined"
                startIcon={<IconWand size={18} />}
                sx={{
                  borderRadius: '8px',
                  color: '#FF5C00',
                  borderColor: 'rgba(255,92,0,0.3)',
                  '&:hover': { borderColor: '#FF5C00', bgcolor: 'rgba(255,92,0,0.1)' }
                }}
              >
                Use with AI
              </Button>
            </Paper>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
