'use client';
import React, { useState } from 'react';
import { Box, Typography, Grid, Button, Card, CircularProgress, Chip } from '@mui/material';
import { IconPalette, IconWand, IconLayoutDashboard } from '@tabler/icons-react';
import Link from 'next/link';

export default function StudioDashboard() {
  const [designs, setDesigns] = useState<any[]>([]); // Will fetch from Firestore
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={4}>
        <Box>
          <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: '-0.02em', mb: 1 }}>
            Visual Studio
          </Typography>
          <Typography variant="body1" color="text.secondary">
            AI-powered creative operating system. Manage, edit, and generate your brand assets.
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/studio/create"
          variant="contained"
          startIcon={<IconWand size={20} />}
          sx={{ 
            borderRadius: '12px', 
            fontWeight: 700, 
            px: 3, 
            py: 1,
            background: 'linear-gradient(135deg, #FF5C00, #e04000)',
            boxShadow: '0 4px 20px rgba(255,92,0,0.4)',
          }}
        >
          Create New
        </Button>
      </Box>

      {/* Grid of Designs */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" p={5}><CircularProgress sx={{ color: '#FF5C00' }} /></Box>
      ) : designs.length === 0 ? (
        /* Empty State */
        <Box 
          display="flex" flexDirection="column" alignItems="center" justifyContent="center" 
          py={10} 
          sx={{ 
            border: '2px dashed rgba(255,255,255,0.1)', 
            borderRadius: '16px',
            bgcolor: 'rgba(255,255,255,0.02)'
          }}
        >
          <IconPalette size={48} color="rgba(255,255,255,0.2)" />
          <Typography variant="h6" fontWeight={700} mt={2} mb={1}>No designs yet</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Your generated creatives, carousels, and banners will appear here.
          </Typography>
          <Button 
            component={Link} href="/studio/create"
            variant="outlined" 
            sx={{ borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '10px' }}
          >
            Start your first design
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Card list will go here. Following card density rules: max 200px equivalent sizing logic */}
        </Grid>
      )}
    </Box>
  );
}
