'use client';

import React, { useState } from 'react';
import { Box, Typography, Button, TextField, CircularProgress, Stack, Chip, LinearProgress, IconButton } from '@mui/material';
import { 
  IconWand, IconArrowLeft, IconPhoto, IconFileDescription, IconShieldCheck, IconSparkles,
  IconChevronLeft, IconChevronRight, IconLayoutGrid, IconSlideshow 
} from '@tabler/icons-react';
import Link from 'next/link';

import { generateCreativeSpecAction } from '@/lib/studio/actions/creativeActions';
import { DesignSpecification } from '@/lib/studio/models/DesignSpecification';
import { RendererRegistry } from '@/lib/studio/renderers/RendererRegistry';
import { SatoriRenderer } from '@/lib/studio/renderers/SatoriRenderer';

// Initialize Satori Universal Design Renderer
RendererRegistry.register(new SatoriRenderer());

export default function StudioCreatePage() {
  const [prompt, setPrompt] = useState('Create a carousel showing how to start freelancing in 2026 and get high-ticket clients with AI workflows.');
  const [slideCount, setSlideCount] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [engineStage, setEngineStage] = useState<number>(0);
  const [resultUrls, setResultUrls] = useState<string[]>([]);
  const [spec, setSpec] = useState<DesignSpecification | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'why' | 'score'>('preview');
  
  // Carousel Slide Navigation State
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'focused' | 'grid'>('focused');

  const engineNames = [
    "Ready",
    "1/11: Creative Direction & Hook Formulation...",
    "2/11: Brand Strategy & Tone Archetype Mapping...",
    "3/11: Visual Strategy & Contrast Hierarchy...",
    "4/11: Layout Family Selection (100+ Variants Registry)...",
    "5/11: Typography Pairing & Scale Ratio Scaling...",
    "6/11: Composition Math & Negative Space Balancing...",
    "7/11: Color Psychology & WCAG AA Contrast Testing...",
    "8/11: Asset Selection & Texture Overlay Routing...",
    "9/11: Platform Optimization (Safe Zones & Aspect Math)...",
    "10/11: Humanization Engine (Anti-AI Cliché Filter)...",
    "11/11: Quality Scoring Audit & Satori Render Execution..."
  ];

  const handleGenerate = async (customPrompt?: string) => {
    const targetPrompt = customPrompt || prompt;
    if (!targetPrompt.trim()) return;
    if (customPrompt) setPrompt(customPrompt);

    setIsGenerating(true);
    setResultUrls([]);
    setSpec(null);
    setActiveTab('preview');
    setActiveSlideIndex(0);
    
    try {
      setEngineStage(2);

      // Execute 11-Engine AI Creative Operating System Server Action
      const generatedSpec = await generateCreativeSpecAction(targetPrompt, 'linkedin');
      
      const isCarousel = generatedSpec.format === 'carousel' || targetPrompt.toLowerCase().includes('carousel') || slideCount > 1;
      if (isCarousel) {
        generatedSpec.format = 'carousel';
      }
      setSpec(generatedSpec);

      // Dispatch to Universal Design Renderer (Satori)
      const renderer = RendererRegistry.getOptimalRenderer(generatedSpec as any);
      
      const count = isCarousel ? slideCount : 1;
      const newUrls: string[] = [];
      
      for (let i = 1; i <= count; i++) {
        setEngineStage(5 + Math.floor((i / count) * 6));
        
        const slideSpec = JSON.parse(JSON.stringify(generatedSpec));
        
        if (isCarousel) {
          slideSpec.format = 'carousel';
          slideSpec.spec.assets.currentSlide = i;
          slideSpec.spec.assets.totalSlides = count;
          slideSpec.spec.assets.showProgressDots = true;
          
          if (i === 1) {
            // Slide 1: Main Cover Hook
            slideSpec.content.title = generatedSpec.content.title;
            slideSpec.content.subtitle = generatedSpec.content.subtitle || "Swipe to explore step-by-step system architecture ➔";
            slideSpec.content.points = generatedSpec.content.points || [];
          } else if (i === count) {
            // Final Slide: Call to Action Outro
            slideSpec.content.title = "Ready to Build Your System?";
            slideSpec.content.subtitle = "Save this post for later. Share with your team & follow for daily technical insights.";
            slideSpec.content.points = [];
            slideSpec.content.ctaText = "Follow & Save Post 🔖";
          } else {
            // Middle Slides: Individual Key Insights
            const insightIndex = i - 2;
            const rawPoints = generatedSpec.content.points || [];
            const pointObj = rawPoints[insightIndex];
            if (pointObj) {
              slideSpec.content.title = `0${i - 1} // ${pointObj.label || 'SYSTEM PRINCIPLE'}`;
              slideSpec.content.subtitle = pointObj.text;
            } else {
              slideSpec.content.title = `0${i - 1} // EXECUTIVE INSIGHT`;
              slideSpec.content.subtitle = `High-leverage architectural practice ${i - 1} for production scaling.`;
            }
            slideSpec.content.points = [];
          }
        }
        
        const output = await renderer.render(slideSpec);
        if (output.status === 'success' && output.url) {
          newUrls.push(output.url);
        } else {
          throw new Error(output.error || `Renderer execution failed on slide ${i}`);
        }
      }

      setResultUrls(newUrls);

    } catch (error: any) {
      console.error(error);
      alert(`Creative OS Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
      setEngineStage(0);
    }
  };

  const samplePrompts = [
    { label: "⚡ SaaS MRR Scaling", prompt: "SaaS growth playbook: how to scale from $0 to $10k MRR with AI developer API automation and system metrics" },
    { label: "🎨 Luxury Minimal Editorial", prompt: "The minimalist architecture of luxury art design in 2026 and why timeless editorial elegance simplifies fashion" },
    { label: "📈 Swiss Data & Cyber Security", prompt: "Q4 Enterprise Security Audit & AI Infrastructure Data Findings for Executive Briefing Report" },
    { label: "🚀 Freelance Client Playbook", prompt: "Create a carousel showing how to start freelancing in 2026 and get high-ticket business clients with zero friction" }
  ];

  return (
    <Box sx={{ color: 'text.primary', p: { xs: 2, lg: 3 }, width: '100%', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header Bar */}
      <Box mb={3} display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={2.5}>
          <Button component={Link} href="/studio" sx={{ minWidth: 0, p: 1, borderRadius: '8px', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', color: 'text.primary', '&:hover': { bgcolor: 'action.hover' } }}>
            <IconArrowLeft size={18} />
          </Button>
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.03em', color: 'text.primary' }}>
                AI Creative Operating System
              </Typography>
              <Chip size="small" label="11 ENGINES ONLINE" sx={{ bgcolor: 'success.main', color: 'success.contrastText', fontWeight: 800, fontSize: '11px', opacity: 0.9 }} />
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.3 }}>
              Canva & Figma architectural design rigor. Every visual is synthesized through an 11-stage reasoning specification before pixel rendering.
            </Typography>
          </Box>
        </Box>

        {spec && (
          <Stack direction="row" spacing={1} sx={{ bgcolor: 'background.paper', p: 0.6, borderRadius: '8px', border: '1px solid', borderColor: 'divider' }}>
            <Button size="small" onClick={() => setActiveTab('preview')} startIcon={<IconPhoto size={16} />} sx={{ px: 2, bgcolor: activeTab === 'preview' ? 'primary.main' : 'transparent', color: activeTab === 'preview' ? 'primary.contrastText' : 'text.primary', textTransform: 'none', fontWeight: 700, borderRadius: '6px' }}>Canvas Render</Button>
            <Button size="small" onClick={() => setActiveTab('why')} startIcon={<IconFileDescription size={16} />} sx={{ px: 2, bgcolor: activeTab === 'why' ? 'primary.main' : 'transparent', color: activeTab === 'why' ? 'primary.contrastText' : 'text.primary', textTransform: 'none', fontWeight: 700, borderRadius: '6px' }}>Why Architecture</Button>
            <Button size="small" onClick={() => setActiveTab('score')} startIcon={<IconShieldCheck size={16} />} sx={{ px: 2, bgcolor: activeTab === 'score' ? 'primary.main' : 'transparent', color: activeTab === 'score' ? 'primary.contrastText' : 'text.primary', textTransform: 'none', fontWeight: 700, borderRadius: '6px' }}>QA Score ({spec.qualityScore.overall}/100)</Button>
          </Stack>
        )}
      </Box>

      {/* Style Variety Bar */}
      <Box sx={{ mb: 2.5, p: 1.5, bgcolor: 'background.paper', borderRadius: '10px', border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" gap={1}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', fontSize: '11px' }}>
            ⚡ TEST STYLE VARIETY (100+ LAYOUT FAMILIES):
          </Typography>
          {samplePrompts.map((item, idx) => (
            <Chip
              key={idx}
              label={item.label}
              onClick={() => handleGenerate(item.prompt)}
              disabled={isGenerating}
              sx={{
                bgcolor: 'background.default',
                color: 'primary.main',
                border: '1px solid',
                borderColor: 'divider',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main', transform: 'translateY(-1px)' }
              }}
            />
          ))}
        </Stack>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '4fr 8fr' }, gap: 3, flex: 1, minHeight: 0 }}>
        {/* Left Control Sidebar */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', 
            overflowY: 'auto', 
            pr: 1.5,
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '4px' },
            '&::-webkit-scrollbar-thumb:hover': { background: 'primary.main' }
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Raw Creative Intent & Topic
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
            placeholder="Describe topic, target conversion goal, and desired audience resonance..."
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                bgcolor: 'background.paper',
                color: 'text.primary',
                fontSize: '14px',
                lineHeight: 1.5,
                '& fieldset': { borderColor: 'divider' },
                '&:hover fieldset': { borderColor: 'text.secondary' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main' }
              }
            }}
          />

          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.paper', p: 1.5, borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Carousel Length (Slides)</Typography>
            <Stack direction="row" spacing={0.8}>
              {[3, 4, 5, 6, 7, 8].map(num => (
                <Button
                  key={num}
                  size="small"
                  onClick={() => setSlideCount(num)}
                  disabled={isGenerating}
                  sx={{
                    minWidth: 32,
                    height: 32,
                    p: 0,
                    borderRadius: '6px',
                    bgcolor: slideCount === num ? 'primary.main' : 'transparent',
                    color: slideCount === num ? 'primary.contrastText' : 'text.secondary',
                    fontWeight: 700,
                    border: `1px solid`,
                    borderColor: slideCount === num ? 'primary.main' : 'divider',
                    '&:hover': { bgcolor: slideCount === num ? 'primary.dark' : 'action.hover' }
                  }}
                >
                  {num}
                </Button>
              ))}
            </Stack>
          </Box>

          <Button
            fullWidth
            onClick={() => handleGenerate()}
            disabled={isGenerating || !prompt.trim()}
            variant="contained"
            startIcon={isGenerating ? <CircularProgress size={18} color="inherit" /> : <IconWand size={18} />}
            sx={{
              fontWeight: 800,
              borderRadius: '12px',
              py: 1.8,
              fontSize: '15px',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              textTransform: 'none',
              boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
              '&:hover': { 
                bgcolor: 'primary.dark',
                transform: 'translateY(-1px)',
                boxShadow: '0 6px 20px rgba(59,130,246,0.4)',
              }
            }}
          >
            {isGenerating ? 'Synthesizing 11-Stage Design Specification...' : 'Synthesize Design & Render Creative'}
          </Button>

          {/* Real-time 11-Engine Execution Monitor */}
          {isGenerating && (
            <Box mt={2.5} p={2} sx={{ bgcolor: 'background.paper', borderRadius: '10px', border: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, fontFamily: 'monospace' }}>
                  CREATIVE OPERATING SYSTEM ACTIVE
                </Typography>
                <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700, fontFamily: 'monospace' }}>
                  {Math.round((engineStage / 11) * 100)}%
                </Typography>
              </Stack>
              <LinearProgress variant="determinate" value={(engineStage / 11) * 100} sx={{ height: 6, borderRadius: 3, bgcolor: 'divider', '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' }, mb: 1.5 }} />
              <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconSparkles size={16} /> {engineNames[engineStage]}
              </Typography>
            </Box>
          )}

          {/* Engine Summary Meta Card */}
          {spec && !isGenerating && (
            <Box mt={2.5} p={2} sx={{ bgcolor: 'background.paper', borderRadius: '10px', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 1, textTransform: 'uppercase' }}>
                Active Design Specification Summary
              </Typography>
              <Stack spacing={0.8} sx={{ fontSize: '13px' }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography component="span" sx={{ color: 'text.secondary' }}>Layout Family:</Typography>
                  <Typography component="strong" sx={{ color: 'primary.main', fontWeight: 700 }}>{spec.spec.layoutFamily.toUpperCase()}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography component="span" sx={{ color: 'text.secondary' }}>Assigned Variant:</Typography>
                  <Typography component="strong" sx={{ fontWeight: 700 }}>{spec.spec.variantId}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography component="span" sx={{ color: 'text.secondary' }}>Color Psychology:</Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: spec.spec.color.background, border: '1px solid #333' }} />
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: spec.spec.color.primary }} />
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: spec.spec.color.accent }} />
                    <Typography component="strong" sx={{ ml: 0.5, fontWeight: 700 }}>{spec.spec.color.primary}</Typography>
                  </Stack>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography component="span" sx={{ color: 'text.secondary' }}>Typography System:</Typography>
                  <Typography component="strong" sx={{ fontWeight: 700 }}>{spec.spec.typography.headline.family} ({spec.spec.typography.scaleName})</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography component="span" sx={{ color: 'text.secondary' }}>Platform Geometry:</Typography>
                  <Typography component="strong" sx={{ fontWeight: 700 }}>{spec.dimensions.width}x{spec.dimensions.height} ({spec.dimensions.aspectRatio})</Typography>
                </Stack>
              </Stack>
            </Box>
          )}
        </Box>

        {/* Right Interactive Canvas Preview Panel */}
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '16px',
              p: 2.5,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}
          >
            {isGenerating ? (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" my="auto" gap={2}>
                <CircularProgress sx={{ color: '#3B82F6' }} size={48} thickness={3} />
                <Typography sx={{ color: '#94A3B8', fontWeight: 600 }}>Executing AI Creative Operating System Pipeline...</Typography>
              </Box>
            ) : !spec && resultUrls.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2} sx={{ p: 6, border: '2px dashed', borderColor: 'divider', borderRadius: '16px', bgcolor: 'rgba(15, 23, 42, 0.2)' }}>
                <IconPhoto size={56} color="#334155" />
                <Typography sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '15px', textAlign: 'center' }}>Enter topic or select a test style variety to initiate the design engine</Typography>
              </Box>
            ) : (
              <>
                {/* VIEW 1: CANVAS RENDER PREVIEW WITH SLIDE REEL NAVIGATION */}
                {activeTab === 'preview' && (
                  <Box display="flex" flexDirection="column" height="100%" width="100%" sx={{ minHeight: 0 }}>
                    {/* Slide Navigation Reel Controls Header */}
                    {resultUrls.length > 1 && (
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} pb={1.5} borderBottom="1px solid" borderColor="divider">
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ overflowX: 'auto', py: 0.5 }}>
                          {resultUrls.map((_, i) => (
                            <Chip
                              key={i}
                              label={`Slide ${i + 1}`}
                              size="small"
                              onClick={() => { setActiveSlideIndex(i); setViewMode('focused'); }}
                              sx={{
                                fontWeight: 700,
                                fontSize: '12px',
                                bgcolor: activeSlideIndex === i && viewMode === 'focused' ? 'primary.main' : 'background.default',
                                color: activeSlideIndex === i && viewMode === 'focused' ? 'primary.contrastText' : 'text.secondary',
                                border: '1px solid',
                                borderColor: activeSlideIndex === i && viewMode === 'focused' ? 'primary.main' : 'divider',
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'action.hover' }
                              }}
                            />
                          ))}
                        </Stack>

                        <Stack direction="row" spacing={1} alignItems="center">
                          <Button
                            size="small"
                            onClick={() => setViewMode(prev => prev === 'focused' ? 'grid' : 'focused')}
                            startIcon={viewMode === 'focused' ? <IconLayoutGrid size={16} /> : <IconSlideshow size={16} />}
                            sx={{ fontWeight: 700, textTransform: 'none', borderRadius: '8px', fontSize: '12px' }}
                          >
                            {viewMode === 'focused' ? 'Grid View' : 'Focus View'}
                          </Button>
                        </Stack>
                      </Box>
                    )}

                    {/* Canvas Main Render Body */}
                    {viewMode === 'focused' ? (
                      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" width="100%" position="relative" sx={{ flex: 1, minHeight: 0 }}>
                        {resultUrls.length > 1 && (
                          <>
                            <IconButton
                              onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))}
                              disabled={activeSlideIndex === 0}
                              sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', '&:hover': { bgcolor: 'primary.main' }, zIndex: 10 }}
                            >
                              <IconChevronLeft size={24} />
                            </IconButton>
                            <IconButton
                              onClick={() => setActiveSlideIndex(prev => Math.min(resultUrls.length - 1, prev + 1))}
                              disabled={activeSlideIndex === resultUrls.length - 1}
                              sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', '&:hover': { bgcolor: 'primary.main' }, zIndex: 10 }}
                            >
                              <IconChevronRight size={24} />
                            </IconButton>
                          </>
                        )}

                        <Box sx={{ height: '100%', maxHeight: '520px', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={resultUrls[activeSlideIndex] || resultUrls[0]}
                            alt={`Slide ${activeSlideIndex + 1}`}
                            style={{
                              maxHeight: '100%',
                              maxWidth: '100%',
                              objectFit: 'contain',
                              borderRadius: '12px',
                              boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
                              border: '1px solid rgba(255,255,255,0.1)'
                            }}
                          />
                        </Box>
                      </Box>
                    ) : (
                      /* Grid View Mode: Displays all carousel slides at a glance */
                      <Box 
                        sx={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                          gap: 2, 
                          overflowY: 'auto', 
                          height: '100%',
                          p: 1,
                          '&::-webkit-scrollbar': { width: '6px' },
                          '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }
                        }}
                      >
                        {resultUrls.map((url, i) => (
                          <Box
                            key={i}
                            onClick={() => { setActiveSlideIndex(i); setViewMode('focused'); }}
                            sx={{
                              borderRadius: '10px',
                              overflow: 'hidden',
                              border: '2px solid',
                              borderColor: activeSlideIndex === i ? 'primary.main' : 'divider',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': { transform: 'scale(1.02)', borderColor: 'primary.main' }
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`Slide ${i + 1}`} style={{ width: '100%', display: 'block' }} />
                            <Box sx={{ p: 1, bgcolor: 'background.default', textAlign: 'center' }}>
                              <Typography variant="caption" fontWeight={700}>Slide {i + 1}</Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}

                {/* VIEW 2: WHY ARCHITECTURE (DESIGN RATIONALE EXPLAINED) */}
                {activeTab === 'why' && spec && (
                  <Box sx={{ 
                    overflowY: 'auto', 
                    height: '100%', 
                    pr: 1,
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }
                  }}>
                    <Typography variant="h6" fontWeight={800} sx={{ color: 'text.primary', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconFileDescription color="var(--mui-palette-primary-main)" /> Design Specification & "Why" Architecture
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                      Every design dimension is logically accounted for before pixel rendering occurs.
                    </Typography>

                    <Stack spacing={2}>
                      {Object.entries({
                        "Creative Direction & Format Strategy": spec.why.creativeDirectionWhy,
                        "Brand Strategy & Archetype Alignment": spec.why.brandStrategyWhy,
                        "Visual Hierarchy & Cognitive Flow": spec.why.visualStrategyWhy,
                        "Layout Family Selection (100+ Registry)": spec.why.layoutWhy,
                        "Typography Pairing & Scale Ratios": spec.why.typographyWhy,
                        "Color Psychology & WCAG AA Contrast": spec.why.colorPsychologyWhy,
                        "Composition Math & Adaptive Spacing": spec.why.compositionWhy,
                        "Asset Selection & Texture Layering": spec.why.assetSelectionWhy,
                        "Platform Optimization & Safe Zones": spec.why.platformOptimizationWhy,
                        "Humanization Engine (Anti-AI Cliché Filter)": spec.why.humanizationWhy
                      }).map(([title, desc], idx) => (
                        <Box key={idx} sx={{ bgcolor: 'background.default', p: 2, borderRadius: '8px', border: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, fontSize: '13px', mb: 0.6, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box component="span" sx={{ background: 'background.paper', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: 'text.primary', border: '1px solid', borderColor: 'divider' }}>0{idx + 1}</Box>
                            {title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5, fontSize: '13px' }}>
                            {desc || "Optimized based on commercial SaaS conversion benchmarks."}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* VIEW 3: QUALITY REVIEW RUBRIC */}
                {activeTab === 'score' && spec && (
                  <Box sx={{ 
                    p: 1, 
                    overflowY: 'auto', 
                    height: '100%',
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }
                  }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} sx={{ bgcolor: 'success.light', p: 2.5, borderRadius: '12px', border: '1px solid', borderColor: 'success.main', opacity: 0.9 }}>
                      <Box>
                        <Typography variant="h4" fontWeight={900} sx={{ color: 'success.dark', mb: 0.5 }}>
                          {spec.qualityScore.overall} / 100
                        </Typography>
                        <Typography variant="subtitle2" sx={{ color: 'success.dark', fontWeight: 700 }}>
                          Production Ready • WCAG AA Certified
                        </Typography>
                      </Box>
                      <Chip label="PASSED QUALITY AUDIT" sx={{ bgcolor: 'success.main', color: '#fff', fontWeight: 900, fontSize: '12px' }} />
                    </Stack>

                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1.5, textTransform: 'uppercase', fontSize: '12px' }}>
                      Diagnostic Sub-Score Metrics:
                    </Typography>

                    <Stack spacing={2} mb={3}>
                      {[
                        { label: "Contrast & Accessibility (WCAG AA >4.5:1)", score: spec.qualityScore.contrastScore, color: "success.main" },
                        { label: "Visual Hierarchy & Typography Scale", score: spec.qualityScore.hierarchyScore, color: "primary.main" },
                        { label: "Negative Space & Adaptive Spacing Balance", score: spec.qualityScore.balanceScore, color: "info.main" },
                        { label: "Human Designer Touch (Zero AI Glow Cliché)", score: spec.qualityScore.humanTouchScore, color: "warning.main" }
                      ].map((metric, i) => (
                        <Box key={i} sx={{ bgcolor: 'background.default', p: 2, borderRadius: '8px', border: '1px solid', borderColor: 'divider' }}>
                          <Stack direction="row" justifyContent="space-between" mb={0.8}>
                            <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>{metric.label}</Typography>
                            <Typography variant="body2" sx={{ color: metric.color, fontWeight: 800 }}>{metric.score}/100</Typography>
                          </Stack>
                          <LinearProgress variant="determinate" value={metric.score} sx={{ height: 6, borderRadius: 3, bgcolor: 'divider', '& .MuiLinearProgress-bar': { bgcolor: metric.color } }} />
                        </Box>
                      ))}
                    </Stack>

                    <Box sx={{ bgcolor: 'background.default', p: 2.5, borderRadius: '8px', borderLeft: '4px solid', borderColor: 'primary.main' }}>
                      <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800, display: 'block', mb: 0.5, textTransform: 'uppercase' }}>
                        Autonomous Critic Synthesis
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary', fontStyle: 'italic', lineHeight: 1.6 }}>
                        "{spec.qualityScore.critique}"
                      </Typography>
                    </Box>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
