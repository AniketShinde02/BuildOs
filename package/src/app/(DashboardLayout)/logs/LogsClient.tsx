"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography, Card, CardContent, Chip, CircularProgress, Stack } from "@mui/material";
import { auth, db } from "@/utils/firebase";
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";

interface PublishLog {
  id: string;
  userId: string;
  draftId: string;
  platform: string;
  adapterName: string;
  success: boolean;
  durationMs: number;
  error: string;
  timestamp: string;
}

export default function LogsClient() {
  const [logs, setLogs] = useState<PublishLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setLogs([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "PublishLogs"), 
      where("userId", "==", userId),
      orderBy("timestamp", "desc"), 
      limit(50)
    );
    
    const unsubscribeDb = onSnapshot(q, (snapshot) => {
      const docsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PublishLog[];
      setLogs(docsData);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Firestore onSnapshot error:", err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribeDb();
  }, [userId]);

  return (
    <Box sx={{ maxWidth: 1000, margin: "0 auto", p: { xs: 2, md: 4 } }}>
      <Typography variant="h1" mb={4}>Publishing Logs</Typography>

      {error && (
        <Box p={3} mb={4} bgcolor="rgba(239, 68, 68, 0.1)" color="error.main" borderRadius={2}>
          <Typography fontWeight={700}>Database Error:</Typography>
          <Typography variant="body2">{error}</Typography>
          {error.includes("index") && (
            <Typography variant="body2" mt={1}>
              Open your Browser Developer Console (F12) and click the link in the error to create the required Firestore index.
            </Typography>
          )}
        </Box>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress size={24} color="primary" />
        </Box>
      ) : (
        <Stack spacing={2}>
          {logs.length === 0 ? (
            <Box p={4} textAlign="center" border="1px dashed" borderColor="divider" borderRadius="6px">
              <Typography color="textSecondary" fontWeight={600}>No publish logs found.</Typography>
            </Box>
          ) : (
            logs.map(log => (
              <Card key={log.id} sx={{ borderRadius: "6px", border: "1px solid", borderColor: "divider", boxShadow: "none" }}>
                <CardContent sx={{ p: "16px !important", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={2} mb={0.5}>
                      <Typography variant="h6" fontWeight={600}>{log.platform.toUpperCase()}</Typography>
                      <Chip 
                        label={log.success ? "Success" : "Failed"} 
                        color={log.success ? "success" : "error"} 
                        size="small" 
                        variant="filled" 
                      />
                    </Stack>
                    <Typography variant="body2" color="textSecondary">
                      Adapter: {log.adapterName} &bull; Duration: {log.durationMs}ms &bull; Draft ID: {log.draftId.slice(0, 8)}...
                    </Typography>
                    {!log.success && (
                      <Typography variant="body2" color="error" mt={1} sx={{ bgcolor: "rgba(239, 68, 68, 0.1)", p: 1, borderRadius: 1 }}>
                        {log.error}
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {new Date(log.timestamp).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            ))
          )}
        </Stack>
      )}
    </Box>
  );
}
