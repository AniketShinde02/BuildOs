'use client'
import React, { useEffect, useState } from 'react';
import { 
  Grid, Box, Typography, Card, CardContent, Button, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, Skeleton
} from '@mui/material';
import { Add, Edit, Check, Send, DeleteOutline, RestoreFromTrash, DeleteForever, Delete, WarningAmber, ClearAll, ChevronLeft, ChevronRight, Schedule } from '@mui/icons-material';
import { auth, db } from '@/utils/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { useToast } from '@/app/GlobalToastProvider';

interface Draft {
  id: string;
  text: string;
  content?: string;
  platform: string;
  status: string;
  createdAt: any;
  imageUrl?: string;
  imageUrls?: string[];
  layers?: any;
  source?: string;
  userId?: string;
  trashedAt?: string;
}

function DraftCarouselViewer({ urls }: { urls: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (!urls || urls.length === 0) return null;
  
  return (
    <Box mb={2} sx={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: '10px', overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={urls[currentIndex]} alt={`Slide ${currentIndex + 1}`} style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} />
      {urls.length > 1 && (
        <>
          <IconButton 
            size="small"
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => Math.max(0, prev - 1)); }}
            disabled={currentIndex === 0}
            sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.6)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }, '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)', bgcolor: 'rgba(0,0,0,0.4)' } }}
          >
            <ChevronLeft />
          </IconButton>
          <IconButton 
            size="small"
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => Math.min(urls.length - 1, prev + 1)); }}
            disabled={currentIndex === urls.length - 1}
            sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.6)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }, '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)', bgcolor: 'rgba(0,0,0,0.4)' } }}
          >
            <ChevronRight />
          </IconButton>
          <Box sx={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 0.5 }}>
            {urls.map((_, i) => (
              <Box key={i} sx={{ width: i === currentIndex ? 16 : 6, height: 6, borderRadius: 3, bgcolor: i === currentIndex ? 'primary.main' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }} />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}

export default function DraftsClient() {
  const { showToast } = useToast();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [fetchLimit, setFetchLimit] = useState(10);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);
  const [promptText, setPromptText] = useState('');

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteActionType, setDeleteActionType] = useState<'trash' | 'permanent' | 'empty_trash' | 'empty_pending' | 'empty_approved'>('trash');

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setDrafts([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'Drafts'), 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'), 
      limit(fetchLimit)
    );
    
    const unsubscribeDb = onSnapshot(q, (snapshot) => {
      const docsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Draft[];
      setDrafts(docsData);
      setLoading(false);
    });

    return () => unsubscribeDb();
  }, [userId, fetchLimit]);

  // Auto-delete trash items older than 30 days
  useEffect(() => {
    if (!drafts.length) return;
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    drafts.forEach(async (d) => {
      if (d.status === 'trashed' && d.trashedAt) {
        const trashedTime = new Date(d.trashedAt).getTime();
        if (now - trashedTime > THIRTY_DAYS_MS) {
          try {
            await deleteDoc(doc(db, 'Drafts', d.id));
          } catch (err) {
            console.error('Auto-delete error:', err);
          }
        }
      }
    });
  }, [drafts]);

  const handleLoadMore = () => setFetchLimit(prev => prev + 10);

  const handleApprove = async (id: string, content: string) => {
    await updateDoc(doc(db, 'Drafts', id), { 
      status: 'Approved',
      text: content
    });
    setEditingId(null);
  };

  const handlePublish = async (id: string, text: string, isSchedule: boolean = false) => {
    try {
      const draft = drafts.find(d => d.id === id);
      const platforms = isSchedule ? ['postiz'] : (draft?.platform ? [draft.platform] : ['linkedin']);
      
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId: id,
          text: text,
          imageUrl: draft?.imageUrl,
          imageUrls: draft?.imageUrls,
          platforms: platforms,
          stage: isSchedule ? 'Scheduled' : 'Publishing',
          options: isSchedule ? { scheduled: true, autoQueue: true } : {}
        })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Publish failed details:", errorData);
        
        let errorMsg = 'Failed to publish';
        if (errorData?.results?.linkedin?.error) {
           errorMsg = typeof errorData.results.linkedin.error === 'string' 
             ? errorData.results.linkedin.error 
             : errorData.results.linkedin.error.message || JSON.stringify(errorData.results.linkedin.error);
        } else if (errorData?.error?.message) {
           errorMsg = errorData.error.message;
        }
        throw new Error(errorMsg);
      }
      showToast(isSchedule ? 'Successfully added to Auto-Queue!' : 'Successfully published!', 'success');
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Error publishing. Please check console.', 'error');
    }
  };

  const openDeleteModal = (id: string | null, type: 'trash' | 'permanent' | 'empty_trash' | 'empty_pending' | 'empty_approved') => {
    setDeleteTargetId(id);
    setDeleteActionType(type);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteAction = async () => {
    setDeleteConfirmOpen(false);
    if (deleteActionType === 'trash' && deleteTargetId) {
      try {
        await updateDoc(doc(db, 'Drafts', deleteTargetId), { 
          status: 'trashed',
          trashedAt: new Date().toISOString()
        });
        showToast('Moved to Trash (auto-deletes in 30 days)', 'info');
      } catch (error) {
        console.error(error);
        showToast('Error moving draft to trash', 'error');
      }
    } else if (deleteActionType === 'permanent' && deleteTargetId) {
      try {
        await deleteDoc(doc(db, 'Drafts', deleteTargetId));
        showToast('Permanently deleted draft', 'success');
      } catch (error) {
        console.error(error);
        showToast('Error deleting draft permanently', 'error');
      }
    } else if (deleteActionType === 'empty_trash') {
      try {
        const trashed = drafts.filter(d => d.status === 'trashed');
        await Promise.all(trashed.map(d => deleteDoc(doc(db, 'Drafts', d.id))));
        showToast('Trash emptied successfully', 'success');
      } catch (error) {
        console.error(error);
        showToast('Error emptying trash', 'error');
      }
    } else if (deleteActionType === 'empty_pending') {
      try {
        const pending = drafts.filter(d => ['Idea', 'Draft', 'Pending Review'].includes(d.status));
        await Promise.all(pending.map(d => updateDoc(doc(db, 'Drafts', d.id), { status: 'trashed', trashedAt: new Date().toISOString() })));
        showToast('Pending drafts moved to trash', 'success');
      } catch (error) {
        console.error(error);
        showToast('Error deleting pending drafts', 'error');
      }
    } else if (deleteActionType === 'empty_approved') {
      try {
        const approved = drafts.filter(d => ['Approved', 'Scheduled', 'Published', 'Approved / Published', 'published'].includes(d.status));
        await Promise.all(approved.map(d => updateDoc(doc(db, 'Drafts', d.id), { status: 'trashed', trashedAt: new Date().toISOString() })));
        showToast('Approved drafts moved to trash', 'success');
      } catch (error) {
        console.error(error);
        showToast('Error deleting approved drafts', 'error');
      }
    }
    setDeleteTargetId(null);
  };

  const handleRestoreFromTrash = async (id: string) => {
    try {
      await updateDoc(doc(db, 'Drafts', id), { 
        status: 'Draft',
        trashedAt: null
      });
      showToast('Restored draft back to queue', 'success');
    } catch (error) {
      console.error(error);
      showToast('Error restoring draft', 'error');
    }
  };

  const getDaysRemainingInTrash = (trashedAt?: string) => {
    if (!trashedAt) return 30;
    const elapsedMs = Date.now() - new Date(trashedAt).getTime();
    const daysLeft = Math.max(0, Math.ceil(30 - elapsedMs / (1000 * 60 * 60 * 24)));
    return daysLeft;
  };

  const GENERATING_STEPS = [
    '🔍 Researching topic...',
    '✍️ Drafting LinkedIn post...',
    '🎨 Generating visual...',
    '💾 Saving to queue...'
  ];

  const handleCreateCampaign = async () => {
    if (!userId) {
      showToast("Session active via middleware, but Firebase Client Auth not fully synced yet. Please wait 1s.", "warning");
      return;
    }
    if (!promptText.trim()) {
      showToast("Please describe what you want to post about.", "warning");
      return;
    }

    setIsGenerating(true);
    setGeneratingStep(0);
    
    const topicGuess = promptText.trim();
    const audienceGuess = promptText.toLowerCase().includes('for') 
      ? promptText.substring(promptText.toLowerCase().lastIndexOf('for') + 4, promptText.length).trim().split('.')[0]
      : 'Founders, Engineers, and Indie Hackers';

    const stepTimer = setInterval(() => {
      setGeneratingStep(prev => (prev < GENERATING_STEPS.length - 1 ? prev + 1 : prev));
    }, 4500);
    
    try {
      const res = await fetch('/api/generate-post', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicGuess, audience: audienceGuess })
      });
      
      if (!res.ok) throw new Error('Failed to generate campaign');
      
      setIsModalOpen(false);
      setPromptText('');
      showToast('✨ AI Draft generated! Check your queue.', 'success');
    } catch (error) {
      console.error(error);
      showToast('Error generating campaign. Try again.', 'error');
    } finally {
      clearInterval(stepTimer);
      setIsGenerating(false);
      setGeneratingStep(0);
    }
  };

  const pendingDrafts = drafts.filter(d => ['Idea', 'Draft', 'Pending Review'].includes(d.status));
  const approvedDrafts = drafts.filter(d => ['Approved', 'Scheduled', 'Published', 'Approved / Published', 'published'].includes(d.status));
  const trashedDrafts = drafts.filter(d => d.status === 'trashed');

  return (
    <Box mt={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight={800} color="primary">Content Queue</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => setIsModalOpen(true)}
          startIcon={<Add />}
          sx={{ fontWeight: 700, borderRadius: '12px', textTransform: 'none', px: 3, py: 1 }}
        >
          Create Campaign
        </Button>
      </Box>

      {/* Pending Drafts Section */}
      <Box mb={6}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Typography variant="h5" fontWeight={700}>Pending Review</Typography>
            <Chip label={pendingDrafts.length} size="small" sx={{ fontWeight: 800, bgcolor: 'rgba(255,167,38,0.2)', color: '#ed6c02' }} />
          </Box>
          {pendingDrafts.length > 0 && (
            <Button
              size="small"
              variant="outlined"
              color="warning"
              onClick={() => openDeleteModal(null, 'empty_pending')}
              startIcon={<ClearAll />}
              sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none' }}
            >
              Clear All Pending
            </Button>
          )}
        </Box>
        
        <Grid container spacing={3}>
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4, xl: 3 }} key={`skeleton-pending-${idx}`}>
                <Card sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', boxShadow: 'none', p: 3 }}>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: '8px' }} />
                    <Skeleton variant="text" width={60} />
                  </Box>
                  <Skeleton variant="rounded" width="100%" height={160} sx={{ borderRadius: '10px', mb: 2 }} />
                  <Skeleton variant="text" width="100%" />
                  <Skeleton variant="text" width="80%" />
                  <Box display="flex" justifyContent="space-between" pt={2} mt={2} borderTop="1px solid" borderColor="divider">
                    <Skeleton variant="rounded" width={70} height={32} sx={{ borderRadius: '8px' }} />
                    <Skeleton variant="rounded" width={90} height={32} sx={{ borderRadius: '8px' }} />
                  </Box>
                </Card>
              </Grid>
            ))
          ) : pendingDrafts.map((draft) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4, xl: 3 }} key={draft.id}>
              <Card 
                sx={{ 
                  borderRadius: '12px', 
                  border: '1px solid', 
                  borderColor: 'divider',
                  boxShadow: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }
                }}
              >
                <CardContent sx={{ p: 2.5, flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Chip label={draft.source || 'AI Generation'} color="primary" variant="outlined" size="small" sx={{ fontWeight: 600, borderRadius: '8px' }} />
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography variant="caption" color="textSecondary" fontWeight={600}>
                        {draft.createdAt?.toDate ? draft.createdAt.toDate().toLocaleDateString() : 'Just now'}
                      </Typography>
                      <IconButton 
                        size="small" 
                        color="default" 
                        onClick={() => openDeleteModal(draft.id, 'trash')}
                        sx={{ ml: 0.5, color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                        title="Move to Trash"
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  {draft.imageUrl && (
                    <Box mb={2} sx={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid', borderColor: 'divider', position: 'relative', height: 180 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={draft.imageUrl} alt="Generated UI" style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} />
                    </Box>
                  )}
                  {draft.imageUrls && draft.imageUrls.length > 0 && (
                    <DraftCarouselViewer urls={draft.imageUrls} />
                  )}
                  
                  {editingId === draft.id ? (
                    <Box 
                      component="textarea" 
                      value={editContent}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditContent(e.target.value)}
                      sx={{ 
                        width: '100%', minHeight: '120px', p: 1.5, mb: 1, 
                        bgcolor: 'background.default', color: 'text.primary', 
                        border: '1px solid', borderColor: 'primary.main', 
                        borderRadius: '8px', fontFamily: 'inherit', resize: 'vertical', fontSize: '0.875rem',
                        outline: 'none', '&:focus': { boxShadow: '0 0 0 2px rgba(25,118,210,0.2)' }
                      }}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1, color: 'text.secondary', lineHeight: 1.6, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical' }}>
                      {draft.text || draft.content || (draft.layers && JSON.stringify(draft.layers, null, 2))}
                    </Typography>
                  )}
                </CardContent>

                <Box display="flex" justifyContent="flex-end" gap={1} p={2} pt={0} borderTop="1px solid" borderColor="divider" mt="auto">
                  {editingId === draft.id ? (
                    <>
                      <Button size="small" variant="text" color="inherit" onClick={() => setEditingId(null)}>Cancel</Button>
                      <Button size="small" variant="contained" color="success" sx={{ borderRadius: '8px', fontWeight: 600 }} onClick={() => handleApprove(draft.id, editContent)}>
                        Save
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="small" variant="text" color="primary" onClick={() => { setEditingId(draft.id); setEditContent(draft.text || draft.content || ''); }} startIcon={<Edit fontSize="small"/>}>
                        Edit
                      </Button>
                      <Button size="small" variant="contained" color="success" sx={{ borderRadius: '8px', fontWeight: 600 }} onClick={() => handleApprove(draft.id, draft.text || draft.content || '')} startIcon={<Check fontSize="small"/>}>
                        Approve
                      </Button>
                    </>
                  )}
                </Box>
              </Card>
            </Grid>
          ))}
          {pendingDrafts.length === 0 && !loading && (
            <Grid size={{ xs: 12 }}>
              <Box p={6} textAlign="center" border="1px dashed" borderColor="divider" borderRadius="16px">
                <Typography color="textSecondary" fontWeight={600} mb={1}>No pending drafts.</Typography>
                <Typography variant="caption" color="textSecondary">Create a campaign to see drafts here.</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Approved Drafts Section */}
      <Box mb={6}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Typography variant="h5" fontWeight={700}>Approved & Published</Typography>
            <Chip label={approvedDrafts.length} size="small" sx={{ fontWeight: 800, bgcolor: 'rgba(76,175,80,0.2)', color: '#2e7d32' }} />
          </Box>
          {approvedDrafts.length > 0 && (
            <Button
              size="small"
              variant="outlined"
              color="success"
              onClick={() => openDeleteModal(null, 'empty_approved')}
              startIcon={<ClearAll />}
              sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none' }}
            >
              Clear All Approved
            </Button>
          )}
        </Box>

        <Grid container spacing={3}>
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4, xl: 3 }} key={`skeleton-approved-${idx}`}>
                <Card sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', boxShadow: 'none', p: 3 }}>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: '8px' }} />
                    <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: '6px' }} />
                  </Box>
                  <Skeleton variant="text" width="100%" />
                  <Skeleton variant="text" width="90%" />
                  <Skeleton variant="text" width="60%" sx={{ mb: 2 }} />
                  <Box display="flex" justifyContent="flex-end" pt={2} mt={2} borderTop="1px solid" borderColor="divider">
                    <Skeleton variant="rounded" width={140} height={32} sx={{ borderRadius: '8px' }} />
                  </Box>
                </Card>
              </Grid>
            ))
          ) : approvedDrafts.map((draft) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4, xl: 3 }} key={draft.id}>
              <Card 
                sx={{ 
                  borderRadius: '12px', 
                  border: '1px solid', 
                  borderColor: 'divider',
                  bgcolor: draft.status === 'published' ? 'background.default' : 'background.paper',
                  opacity: draft.status === 'published' ? 0.8 : 1,
                  boxShadow: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  '&:hover': { borderColor: 'primary.main', opacity: 1 }
                }}
              >
                <CardContent sx={{ p: 2.5, flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Chip label={draft.source || 'AI Generation'} color="primary" variant="outlined" size="small" sx={{ fontWeight: 600, borderRadius: '8px' }} />
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Chip 
                        label={draft.status === 'published' ? 'Published' : 'Approved'} 
                        color={draft.status === 'published' ? 'default' : 'success'} 
                        size="small" 
                        sx={{ fontWeight: 700, borderRadius: '6px' }}
                      />
                      <IconButton 
                        size="small" 
                        color="default" 
                        onClick={() => openDeleteModal(draft.id, 'trash')}
                        sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                        title="Move to Trash"
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  {draft.imageUrl && (
                    <Box mb={2} sx={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid', borderColor: 'divider', position: 'relative', height: 180 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={draft.imageUrl} alt="Generated UI" style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} />
                    </Box>
                  )}
                  {draft.imageUrls && draft.imageUrls.length > 0 && (
                    <DraftCarouselViewer urls={draft.imageUrls} />
                  )}
                  
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1, color: 'text.secondary', lineHeight: 1.6, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical' }}>
                    {draft.text || draft.content || (draft.layers && JSON.stringify(draft.layers, null, 2))}
                  </Typography>
                </CardContent>

                <Box display="flex" justifyContent="flex-end" gap={1} p={2} pt={0} borderTop="1px solid" borderColor="divider" mt="auto">
                  <Button 
                    size="small"
                    variant="outlined" 
                    color="secondary" 
                    onClick={() => handlePublish(draft.id, draft.text || draft.content || '', true)}
                    sx={{ borderRadius: '8px', fontWeight: 600 }}
                    startIcon={<Schedule fontSize="small" />}
                  >
                    Auto-Queue
                  </Button>
                  <Button 
                    size="small"
                    variant={draft.status === 'published' ? 'outlined' : 'contained'} 
                    color="primary" 
                    onClick={() => handlePublish(draft.id, draft.text || draft.content || '', false)}
                    sx={{ borderRadius: '8px', fontWeight: 700 }}
                    startIcon={<Send fontSize="small" />}
                  >
                    {draft.status === 'published' ? 'Publish Again' : 'Publish'}
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
          {approvedDrafts.length === 0 && !loading && (
            <Grid size={{ xs: 12 }}>
              <Box p={6} textAlign="center" border="1px dashed" borderColor="divider" borderRadius="16px">
                <Typography color="textSecondary" fontWeight={600}>No approved drafts.</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Trash Section */}
      {trashedDrafts.length > 0 && (
        <Box mb={6} sx={{ pt: 4, borderTop: '1px dashed', borderColor: 'divider' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Delete color="error" />
              <Typography variant="h5" fontWeight={700} color="error.main">Trash</Typography>
              <Chip label={trashedDrafts.length} size="small" sx={{ fontWeight: 800, bgcolor: 'rgba(211,47,47,0.15)', color: '#ef5350' }} />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                (Auto-cleans in 30 days)
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => openDeleteModal(null, 'empty_trash')}
              startIcon={<ClearAll />}
              sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none' }}
            >
              Empty Trash
            </Button>
          </Box>

          <Grid container spacing={3}>
            {trashedDrafts.map((draft) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4, xl: 3 }} key={draft.id}>
                <Card 
                  sx={{ 
                    borderRadius: '12px', 
                    border: '1px solid', 
                    borderColor: 'rgba(211,47,47,0.3)',
                    bgcolor: 'rgba(211,47,47,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    opacity: 0.85,
                    '&:hover': { opacity: 1, borderColor: 'error.main' }
                  }}
                >
                  <CardContent sx={{ p: 2.5, flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Chip 
                        label={`Auto-deletes in ${getDaysRemainingInTrash(draft.trashedAt)} days`} 
                        color="error" 
                        variant="outlined" 
                        size="small" 
                        sx={{ fontWeight: 700, borderRadius: '8px', fontSize: '0.7rem' }} 
                      />
                    </Box>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1, color: 'text.secondary', lineHeight: 1.6, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
                      {draft.text || draft.content || (draft.layers && JSON.stringify(draft.layers, null, 2))}
                    </Typography>
                  </CardContent>

                  <Box display="flex" justifyContent="space-between" p={2} pt={0} borderTop="1px solid" borderColor="divider" mt="auto">
                    <Button 
                      size="small"
                      variant="outlined" 
                      color="inherit" 
                      onClick={() => handleRestoreFromTrash(draft.id)}
                      sx={{ borderRadius: '8px', fontWeight: 600, textTransform: 'none' }}
                      startIcon={<RestoreFromTrash fontSize="small" />}
                    >
                      Restore
                    </Button>
                    <Button 
                      size="small"
                      variant="contained" 
                      color="error" 
                      onClick={() => openDeleteModal(draft.id, 'permanent')}
                      sx={{ borderRadius: '8px', fontWeight: 600, textTransform: 'none' }}
                      startIcon={<DeleteForever fontSize="small" />}
                    >
                      Delete
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
      
      {!loading && drafts.length >= fetchLimit && (
        <Box display="flex" justifyItems="center" justifyContent="center" mt={5}>
            <Button variant="outlined" color="primary" onClick={handleLoadMore} sx={{ borderRadius: '20px', fontWeight: 700, px: 4 }}>
                Load More
            </Button>
        </Box>
      )}

      {/* Contextual Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: 'blur(12px)',
              backgroundColor: 'rgba(0, 0, 0, 0.75)'
            }
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: '20px',
            p: 1,
            backgroundImage: 'linear-gradient(145deg, rgba(26,26,26,1) 0%, rgba(16,16,16,1) 100%)',
            border: '1px solid rgba(255, 92, 0, 0.2)',
            boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.9)'
          }
        }}
      >
        <DialogTitle display="flex" alignItems="center" gap={1.5} fontWeight={800}>
          <WarningAmber color="warning" />
          {deleteActionType === 'trash' && 'Move to Trash?'}
          {deleteActionType === 'permanent' && 'Delete Permanently?'}
          {deleteActionType === 'empty_trash' && 'Empty Trash?'}
          {deleteActionType === 'empty_pending' && 'Clear All Pending?'}
          {deleteActionType === 'empty_approved' && 'Clear All Approved?'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            {deleteActionType === 'trash' && 'This draft will be moved to Trash. It will be kept for 30 days before automatic permanent deletion. You can restore it anytime.'}
            {deleteActionType === 'permanent' && 'This action cannot be undone. This content draft will be permanently removed from your BuildOS database.'}
            {deleteActionType === 'empty_trash' && `Are you sure you want to permanently delete all ${trashedDrafts.length} items in your Trash? This cannot be undone.`}
            {deleteActionType === 'empty_pending' && `Are you sure you want to move all ${pendingDrafts.length} pending drafts to Trash?`}
            {deleteActionType === 'empty_approved' && `Are you sure you want to move all ${approvedDrafts.length} approved/published drafts to Trash?`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDeleteAction} 
            variant="contained"
            color={(deleteActionType === 'trash' || deleteActionType === 'empty_pending' || deleteActionType === 'empty_approved') ? 'warning' : 'error'}
            sx={{ fontWeight: 700, borderRadius: '10px', px: 3 }}
          >
            {deleteActionType === 'trash' && 'Move to Trash'}
            {deleteActionType === 'permanent' && 'Delete Permanently'}
            {deleteActionType === 'empty_trash' && 'Empty Trash'}
            {deleteActionType === 'empty_pending' && 'Move All to Trash'}
            {deleteActionType === 'empty_approved' && 'Move All to Trash'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Campaign Modal */}
      <Dialog 
        open={isModalOpen} 
        onClose={() => !isGenerating && setIsModalOpen(false)} 
        maxWidth="sm" 
        fullWidth
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: 'blur(12px)',
              backgroundColor: 'rgba(0, 0, 0, 0.7)'
            }
          }
        }}
        PaperProps={{ 
          sx: { 
            borderRadius: '24px', 
            p: 0,
            backgroundImage: 'linear-gradient(145deg, rgba(22,22,22,1) 0%, rgba(14,14,14,1) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.9)'
          } 
        }}
      >
        {/* Orange accent line */}
        <Box sx={{ height: 3, background: 'linear-gradient(90deg, #FF5C00, #ff8c40, #FF5C00)', borderRadius: '24px 24px 0 0' }} />
        
        <DialogTitle fontWeight={900} variant="h5" sx={{ pb: 1, px: 4, pt: 3, letterSpacing: '-0.02em' }}>
          ✨ Create AI Content
        </DialogTitle>
        
        <DialogContent sx={{ px: 4, pb: 0 }}>
          {isGenerating ? (
            /* ── Premium Loading State ── */
            <Box py={4} display="flex" flexDirection="column" alignItems="center" gap={3}>
              {/* Pulsing ring */}
              <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress 
                  size={72} 
                  thickness={2}
                  sx={{ 
                    color: '#FF5C00',
                    animation: 'spin 1.5s linear infinite',
                    '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } }
                  }} 
                />
                <Box sx={{ position: 'absolute', fontSize: '28px' }}>🤖</Box>
              </Box>
              {/* Animated step text */}
              <Typography variant="h6" fontWeight={700} textAlign="center" sx={{ 
                animation: 'fadeSlide 0.5s ease-in-out',
                '@keyframes fadeSlide': { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } }
              }}>
                {GENERATING_STEPS[generatingStep]}
              </Typography>
              {/* Step indicators */}
              <Box display="flex" gap={1}>
                {GENERATING_STEPS.map((_, i) => (
                  <Box key={i} sx={{ 
                    width: i === generatingStep ? 24 : 8, 
                    height: 8, 
                    borderRadius: 4, 
                    bgcolor: i <= generatingStep ? '#FF5C00' : 'rgba(255,255,255,0.1)',
                    transition: 'all 0.3s ease'
                  }} />
                ))}
              </Box>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                This takes 15–20 seconds. AI is doing real research.
              </Typography>
            </Box>
          ) : (
            /* ── Input Form ── */
            <Box mt={1} mb={3}>
              <Typography variant="body2" color="text.secondary" mb={2} sx={{ lineHeight: 1.6 }}>
                Describe what you want to post about. Be specific — mention the topic, your angle, who it's for. AI will handle the rest.
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={5}
                variant="outlined"
                placeholder={`e.g. "I rebuilt a client's portfolio and cut load time from 8s to 0.9s using Next.js static export + image optimization. For frontend developers and freelancers."

or: "Controversial take: Most AI tools for LinkedIn are designed to spam, not connect. For founders and engineers tired of robotic outreach."`}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) handleCreateCampaign();
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: '14px', 
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    bgcolor: 'rgba(255,255,255,0.03)',
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#FF5C00',
                      borderWidth: 2,
                    }
                  } 
                }}
              />
              <Typography variant="caption" color="text.disabled" mt={1} display="block">
                Ctrl + Enter to generate
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        {!isGenerating && (
          <DialogActions sx={{ p: 4, pt: 2 }}>
            <Button 
              onClick={() => { setIsModalOpen(false); setPromptText(''); }} 
              sx={{ fontWeight: 600, color: 'text.secondary', borderRadius: '10px' }}
            >Cancel</Button>
            <Button 
              onClick={handleCreateCampaign} 
              variant="contained" 
              disabled={!promptText.trim()}
              sx={{ 
                fontWeight: 700, 
                borderRadius: '12px', 
                px: 4, py: 1.2,
                background: 'linear-gradient(135deg, #FF5C00, #e04000)',
                boxShadow: '0 4px 20px rgba(255,92,0,0.4)',
                '&:hover': { boxShadow: '0 6px 28px rgba(255,92,0,0.55)' }
              }}
            >
              Generate Magic ✨
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
}
