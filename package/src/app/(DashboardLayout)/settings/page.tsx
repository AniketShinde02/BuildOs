'use client'
import { Box, Typography, Card, CardContent, TextField, Button, Grid, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import { useState, useEffect } from 'react';
import { auth, db } from '@/utils/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/app/GlobalToastProvider';

const SettingsPage = () => {
  const { showToast } = useToast();
  const [tone, setTone] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasLinkedIn, setHasLinkedIn] = useState(false);
  
  // Environment Variables UI State
  const [envOpenRouterKey, setEnvOpenRouterKey] = useState('');
  const [envGeminiKey, setEnvGeminiKey] = useState('');
  
  // LinkedIn Modal State
  const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false);
  const [linkedinToken, setLinkedinToken] = useState("");
  const [verifyingToken, setVerifyingToken] = useState(false);
  const [tokenError, setTokenError] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const docRef = doc(db, 'settings', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setTone(docSnap.data().tone || '');
          } else {
            setTone('Professional but authentic, focus on technical learnings.');
          }

          const accRef = doc(db, 'connected_accounts', user.uid);
          const accSnap = await getDoc(accRef);
          if (accSnap.exists() && accSnap.data().linkedin?.accessToken) {
            setHasLinkedIn(true);
          }
        } catch (error) {
          console.error("Error fetching settings:", error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', userId), { tone }, { merge: true });
      showToast("Settings saved successfully!", "success");
    } catch (error) {
      console.error("Error saving settings:", error);
      showToast("Failed to save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyLinkedIn = async () => {
    if (!linkedinToken) return;
    setVerifyingToken(true);
    setTokenError("");
    try {
      const res = await fetch("/api/auth/linkedin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: linkedinToken })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify token");
      
      setHasLinkedIn(true);
      setIsLinkedInModalOpen(false);
      setLinkedinToken("");
      showToast("LinkedIn connected successfully!", "success");
    } catch (error: any) {
      setTokenError(error.message);
    } finally {
      setVerifyingToken(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Settings" description="Configure BuildOS">
         <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
           <CircularProgress />
         </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Settings" description="Configure BuildOS">
      <Box>
        <Typography variant="h4" mb={3} color="primary.main">Settings</Typography>
        
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: "12px", border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" fontWeight={700} mb={1}>AI Generation Tone</Typography>
                <Typography variant="body2" color="textSecondary" mb={3}>
                  This controls how the AI writes your drafts. Describe your personal brand voice.
                </Typography>
                <TextField 
                  fullWidth 
                  multiline 
                  rows={4} 
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  sx={{ mb: 3 }}
                  disabled={saving}
                />
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ fontWeight: 700, borderRadius: '8px' }}
                >
                  {saving ? "Saving..." : "Save Preferences"}
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: "12px", border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" fontWeight={700} mb={1}>Connected Accounts</Typography>
                <Typography variant="body2" color="textSecondary" mb={3}>
                  Connect your social accounts for automated publishing.
                </Typography>
                
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} p={2} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}>
                  <Typography>LinkedIn</Typography>
                  {hasLinkedIn ? (
                    <Button variant="contained" color="success">Connected</Button>
                  ) : (
                    <Button variant="outlined" color="primary" onClick={() => setIsLinkedInModalOpen(true)}>Connect</Button>
                  )}
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} p={2} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}>
                  <Typography>X (Twitter)</Typography>
                  <Button variant="outlined" color="primary" disabled>Coming Soon</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Environment Variables Card */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ borderRadius: "12px", border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" fontWeight={700} mb={1}>Environment Variables (AI Models)</Typography>
                <Typography variant="body2" color="textSecondary" mb={3}>
                  Manage your private API keys for external providers. These will be injected securely at runtime.
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField 
                      fullWidth 
                      label="OpenRouter API Key"
                      type="password"
                      placeholder="sk-or-v1-..."
                      value={envOpenRouterKey}
                      onChange={(e) => setEnvOpenRouterKey(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField 
                      fullWidth 
                      label="Google Gemini API Key"
                      type="password"
                      placeholder="AIzaSy..."
                      value={envGeminiKey}
                      onChange={(e) => setEnvGeminiKey(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                  </Grid>
                </Grid>
                
                <Box mt={3} display="flex" justifyContent="flex-end">
                  <Button 
                    variant="contained" 
                    color="primary" 
                    disabled={saving}
                    onClick={() => showToast("API Keys will be wired up later", "info")}
                    sx={{ fontWeight: 700, borderRadius: '8px' }}
                  >
                    Save API Keys
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* LinkedIn Token Modal */}
      <Dialog 
        open={isLinkedInModalOpen} 
        onClose={() => !verifyingToken && setIsLinkedInModalOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle fontWeight={800} variant="h5">Connect LinkedIn</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" mb={3} mt={1}>
            Paste your LinkedIn Access Token below. We will make a test API call to verify it before saving it securely to your account.
          </Typography>
          
          {tokenError && (
            <Box mb={2} p={1.5} bgcolor="error.light" borderRadius={1}>
                <Typography color="error.dark" variant="body2" fontWeight={500}>
                    {tokenError}
                </Typography>
            </Box>
          )}

          <TextField
            fullWidth
            label="LinkedIn Access Token"
            variant="outlined"
            placeholder="AQA..."
            value={linkedinToken}
            onChange={(e) => setLinkedinToken(e.target.value)}
            sx={{ mb: 1, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setIsLinkedInModalOpen(false)} disabled={verifyingToken} sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button 
            onClick={handleVerifyLinkedIn} 
            variant="contained" 
            color="primary"
            disabled={verifyingToken || !linkedinToken}
            startIcon={verifyingToken ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{ fontWeight: 700, borderRadius: '10px', px: 3 }}
          >
            {verifyingToken ? 'Verifying...' : 'Verify & Connect'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}

export default SettingsPage;
