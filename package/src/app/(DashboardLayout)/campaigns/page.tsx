"use client";

import React, { useState, useEffect } from "react";
import { Box, Typography, Card, CardContent, Grid, Button, CircularProgress, Skeleton, TextField, Divider } from "@mui/material";
import { IconWand, IconTarget, IconSparkles } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { useToast } from "@/app/GlobalToastProvider";
import { useRouter } from "next/navigation";

interface Suggestion {
  topic: string;
  audience: string;
  reason: string;
}

export default function CampaignsPage() {
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<number | 'manual' | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  
  // Manual Campaign State
  const [topicInput, setTopicInput] = useState("");
  const [audienceInput, setAudienceInput] = useState("");
  const [enhancing, setEnhancing] = useState(false);
  
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns/suggest");
      if (!res.ok) throw new Error("Failed to load suggestions");
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (_err: any) {
      console.error(_err);
      showToast("Could not load AI suggestions", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEnhanceQuery = async () => {
    if (!topicInput) {
      showToast("Enter a basic topic first", "error");
      return;
    }
    setEnhancing(true);
    try {
      const res = await fetch("/api/campaigns/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: topicInput, audience: audienceInput })
      });
      if (!res.ok) throw new Error("Enhancement failed");
      const data = await res.json();
      setTopicInput(data.enhancedQuery);
      setAudienceInput(data.enhancedAudience || audienceInput);
      showToast("Query enhanced with AI", "success");
    } catch (_err: any) {
      showToast("Failed to enhance query", "error");
    } finally {
      setEnhancing(false);
    }
  };

  const handleCreateDraft = async (topic: string, audience: string, id: number | 'manual') => {
    if (!topic || !audience) {
      showToast("Topic and audience are required", "error");
      return;
    }
    setGeneratingId(id);
    try {
      const res = await fetch("/api/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, audience })
      });
      if (!res.ok) throw new Error("Failed to generate draft");
      showToast("Draft generated successfully! Redirecting to queue...", "success");
      setTimeout(() => router.push("/"), 1500);
    } catch (_err: any) {
      showToast("Failed to generate campaign", "error");
      setGeneratingId(null);
    }
  };

  return (
    <PageContainer title="Campaigns" description="Smart Content Campaigns">
      <Box sx={{ maxWidth: 1200, margin: "0 auto" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h3" fontWeight={800} color="primary.main">Smart Campaigns</Typography>
        </Box>

        {/* Manual Campaign Creation */}
        <Card sx={{ mb: 6, borderRadius: "16px", border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={700} mb={3}>Create Custom Campaign</Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField 
                  fullWidth 
                  label="Detailed Topic or Context" 
                  placeholder="e.g. How I built a fast local queue using SQLite instead of Redis..."
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  variant="outlined"
                  multiline
                  rows={2}
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField 
                  fullWidth 
                  label="Target Audience" 
                  placeholder="e.g. Senior Backend Engineers"
                  value={audienceInput}
                  onChange={(e) => setAudienceInput(e.target.value)}
                  variant="outlined"
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />
              </Grid>
            </Grid>
            
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={handleEnhanceQuery}
                disabled={enhancing || generatingId !== null}
                startIcon={enhancing ? <CircularProgress size={16} /> : <IconSparkles />}
                sx={{ fontWeight: 700, borderRadius: "10px" }}
              >
                {enhancing ? "Enhancing..." : "Improve with AI"}
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => handleCreateDraft(topicInput, audienceInput, 'manual')}
                disabled={generatingId !== null}
                sx={{ fontWeight: 700, borderRadius: "10px", px: 4 }}
              >
                {generatingId === 'manual' ? <CircularProgress size={20} color="inherit" /> : "Generate Draft"}
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Divider sx={{ mb: 6 }} />

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight={700}>AI Suggestions based on your DNA</Typography>
          <Button 
            variant="text" 
            color="primary" 
            onClick={fetchSuggestions}
            disabled={loading || generatingId !== null}
            startIcon={<IconWand />}
            sx={{ fontWeight: 700 }}
          >
            Refresh
          </Button>
        </Box>
        
        <Grid container spacing={3}>
          {loading ? (
             Array.from({ length: 3 }).map((_, idx) => (
              <Grid size={{ xs: 12, md: 4 }} key={idx}>
                <Card sx={{ borderRadius: "12px", border: '1px solid', borderColor: 'divider', boxShadow: 'none', p: 2 }}>
                  <Skeleton variant="text" width="80%" height={32} />
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="rectangular" width="100%" height={100} sx={{ my: 2, borderRadius: '8px' }} />
                  <Skeleton variant="rounded" width="100%" height={40} sx={{ borderRadius: '8px' }} />
                </Card>
              </Grid>
             ))
          ) : suggestions.length > 0 ? (
            suggestions.map((sug, idx) => (
              <Grid size={{ xs: 12, md: 4 }} key={idx}>
                <Card sx={{ borderRadius: "12px", border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ p: 3, flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight={700} mb={1}>{sug.topic}</Typography>
                    
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <IconTarget size={16} color="#888" />
                      <Typography variant="caption" color="textSecondary" fontWeight={600}>{sug.audience}</Typography>
                    </Box>

                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3, opacity: 0.9 }}>
                      {sug.reason}
                    </Typography>

                  </CardContent>
                  <Box p={3} pt={0}>
                    <Button 
                      fullWidth 
                      variant="contained" 
                      color="primary" 
                      onClick={() => handleCreateDraft(sug.topic, sug.audience, idx)}
                      disabled={generatingId !== null}
                      sx={{ fontWeight: 700, borderRadius: '8px' }}
                    >
                      {generatingId === idx ? <CircularProgress size={24} color="inherit" /> : 'Generate Content'}
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid size={12}>
              <Box p={4} textAlign="center" border="1px dashed" borderColor="divider" borderRadius="20px">
                <Typography color="textSecondary" fontWeight={600}>No suggestions available.</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>
    </PageContainer>
  );
}
