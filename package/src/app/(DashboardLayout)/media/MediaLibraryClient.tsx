'use client';
import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, CardMedia, 
  Pagination, CircularProgress, Chip 
} from '@mui/material';
import { auth, db } from '@/utils/firebase';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';

interface MediaItem {
  id: string;
  imageUrl?: string;
  imageUrls?: string[];
  text?: string;
  content?: string;
  createdAt: any;
  status: string;
}

export default function MediaLibraryClient() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) setUserId(user.uid);
      else {
        setUserId(null);
        setItems([]);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const fetchMedia = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, 'Drafts'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const docsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MediaItem[];

        // Filter only drafts that have images
        const mediaDocs = docsData.filter(doc => doc.imageUrl || (doc.imageUrls && doc.imageUrls.length > 0));
        setItems(mediaDocs);
      } catch (error) {
        console.error("Error fetching media:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMedia();
  }, [userId]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const getTruncatedText = (text: string = '') => {
    const words = text.split(' ');
    if (words.length <= 40) return text;
    return words.slice(0, 40).join(' ') + '...';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  const paginatedItems = items.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(items.length / itemsPerPage);

  return (
    <Box mt={3}>
      <Typography variant="h4" fontWeight={800} color="primary" mb={4}>
        Media & Gallery
      </Typography>

      {items.length === 0 ? (
        <Box p={4} textAlign="center" border="1px dashed" borderColor="divider" borderRadius="20px">
          <Typography color="textSecondary" fontWeight={600}>No media found.</Typography>
          <Typography variant="caption" color="textSecondary">Images you generate will appear here.</Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {paginatedItems.map((item) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                <Card 
                  sx={{ 
                    borderRadius: '16px', 
                    border: '1px solid', 
                    borderColor: 'divider',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <CardMedia
                    component="img"
                    height="240"
                    image={item.imageUrl || (item.imageUrls ? item.imageUrls[0] : '')}
                    alt="Generated Content"
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="textSecondary" fontWeight={600}>
                        {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Just now'}
                      </Typography>
                      <Chip 
                        label={item.status} 
                        size="small" 
                        color={item.status.includes('Published') ? 'success' : 'default'}
                        sx={{ fontWeight: 600, fontSize: '0.7rem' }} 
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {getTruncatedText(item.text || item.content)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box display="flex" justifyItems="center" justifyContent="center" mt={6}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
