"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  Box, Typography, Button, Stack, Chip, Divider, CircularProgress, Tooltip
} from "@mui/material";
import { useToast } from "@/app/GlobalToastProvider";
import { 
  IconCalendarEvent, IconRefresh, IconPlayerPlay, IconClock, IconCheck, IconShare
} from "@tabler/icons-react";

export default function ScheduleClient() {
  const [loading, setLoading] = useState(true);
  const [queuing, setQueuing] = useState(false);
  const [items, setItems] = useState<Array<any>>([]);
  const [stats, setStats] = useState<{ totalDrafts: number; activeScheduled: number; pendingUnscheduled: number }>({
    totalDrafts: 0,
    activeScheduled: 0,
    pendingUnscheduled: 0
  });
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [lastSlaMs, setLastSlaMs] = useState<number>(0);
  const { showToast } = useToast();

  const fetchQueue = async () => {
    setLoading(true);
    const start = Date.now();
    try {
      const res = await fetch("/api/schedule/bulk-queue");
      const data = await res.json();
      const duration = Date.now() - start;
      setLastSlaMs(duration);
      
      if (res.ok) {
        setItems(data.items || []);
        if (data.stats) setStats(data.stats);
      } else {
        showToast(data.error || "Failed to load schedule timeline", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Network error loading schedule", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleExecuteAutoQueue = async () => {
    setQueuing(true);
    const start = Date.now();
    try {
      const res = await fetch("/api/schedule/bulk-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intervalDays: 2, postHourUtc: 14 })
      });
      const data = await res.json();
      const duration = Date.now() - start;
      setLastSlaMs(duration);

      if (res.ok) {
        showToast(data.message || `Scheduled ${data.scheduledCount} items!`, "success");
        setItems(data.items || []);
        fetchQueue();
      } else {
        showToast(data.error || "Failed to execute auto-queue pipeline", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to initiate Postiz queue", "error");
    } finally {
      setQueuing(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (selectedFilter === "Scheduled") return items.filter(i => Boolean(i.scheduledTime));
    if (selectedFilter === "Pending") return items.filter(i => !i.scheduledTime || i.status !== "scheduled");
    return items;
  }, [items, selectedFilter]);

  return (
    <Box sx={{ maxWidth: 1240, margin: "0 auto", p: { xs: 2, md: 4 }, color: "text.primary" }}>
      {/* Premium Executive Header */}
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} mb={4} gap={2}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: "-0.5px", color: "text.primary" }}>
              30-Day Auto-Queue Engine
            </Typography>
            <Chip 
              size="small" 
              label={`Postiz SLA: ${lastSlaMs}ms`} 
              sx={{ bgcolor: "primary.dark", color: "primary.contrastText", fontWeight: 700, fontSize: "11px", border: "1px solid", borderColor: "primary.main" }} 
            />
          </Stack>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, maxWidth: 680 }}>
            Automated multi-channel content spacing orchestrated via Postiz Docker microservice. Drafts are distributed chronologically across optimal 30-day engagement windows.
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={1.5}>
          <Button 
            variant="outlined" 
            size="medium" 
            onClick={fetchQueue} 
            disabled={loading || queuing}
            startIcon={<IconRefresh size={16} />}
            sx={{ borderColor: "divider", color: "text.secondary", "&:hover": { bgcolor: "action.hover", borderColor: "text.primary" }, textTransform: "none", fontWeight: 600 }}
          >
            Sync Queue
          </Button>

          <Tooltip title="Space out all unscheduled drafts evenly across the next 30 days at 14:00 UTC">
            <Button 
              variant="contained" 
              size="medium" 
              color="primary"
              onClick={handleExecuteAutoQueue} 
              disabled={loading || queuing}
              startIcon={queuing ? <CircularProgress size={16} color="inherit" /> : <IconPlayerPlay size={16} />}
              sx={{ textTransform: "none", fontWeight: 700, boxShadow: "0 4px 14px rgba(255, 140, 64, 0.2)" }}
            >
              {queuing ? "Orchestrating Queue..." : "Execute 30-Day Auto-Queue"}
            </Button>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Metrics Bar */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2, mb: 4 }}>
        <Box sx={{ bgcolor: "background.paper", p: 2.5, borderRadius: "8px", border: "1px solid", borderColor: "divider" }}>
          <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>Total Pool Drafts</Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", mt: 0.5 }}>{stats.totalDrafts}</Typography>
        </Box>
        <Box sx={{ bgcolor: "background.paper", p: 2.5, borderRadius: "8px", border: "1px solid", borderColor: "divider" }}>
          <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>Postiz Active Queued</Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "success.main", mt: 0.5 }}>{stats.activeScheduled}</Typography>
        </Box>
        <Box sx={{ bgcolor: "background.paper", p: 2.5, borderRadius: "8px", border: "1px solid", borderColor: "divider" }}>
          <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>Unscheduled / Pending</Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "warning.main", mt: 0.5 }}>{stats.pendingUnscheduled}</Typography>
        </Box>
      </Box>

      {/* Filter Tabs */}
      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        {["All", "Scheduled", "Pending"].map((cat) => (
          <Chip
            key={cat}
            label={cat}
            size="small"
            color={selectedFilter === cat ? "primary" : "default"}
            onClick={() => setSelectedFilter(cat)}
            sx={{
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "13px",
              px: 1.5, py: 1.8,
              border: "1px solid",
              borderColor: selectedFilter === cat ? "primary.main" : "divider",
            }}
          />
        ))}
      </Stack>

      {/* Timeline List */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" p={8}>
          <CircularProgress size={36} color="primary" />
        </Box>
      ) : filteredItems.length === 0 ? (
        <Box sx={{ bgcolor: "background.paper", border: "1px dashed", borderColor: "divider", borderRadius: "10px", p: 6, textAlign: "center" }}>
          <IconCalendarEvent size={48} style={{ margin: "0 auto 16px", color: "gray" }} />
          <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 700, mb: 1 }}>No queue items found for current filter</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>Generate content in Content Engine or Visual Studio to populate your 30-day Postiz execution pipeline.</Typography>
          <Button variant="outlined" size="small" href="/studio" color="primary" sx={{ textTransform: "none", fontWeight: 700 }}>
            Open Visual Studio
          </Button>
        </Box>
      ) : (
        <Stack spacing={2}>
          {filteredItems.map((item, idx) => {
            const isScheduled = Boolean(item.scheduledTime) && item.status === "scheduled";
            const dateStr = isScheduled ? new Date(item.scheduledTime).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Unscheduled Pending Draft";

            return (
              <Box 
                key={item.id || idx}
                sx={{
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: isScheduled ? "primary.dark" : "divider",
                  borderRadius: "8px",
                  p: 2.5,
                  transition: "all 0.15s ease-in-out",
                  "&:hover": {
                    borderColor: isScheduled ? "primary.main" : "text.secondary",
                    bgcolor: "action.hover"
                  }
                }}
              >
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} mb={1.5} gap={1}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ 
                      px: 1.2, py: 0.4, borderRadius: "4px", 
                      bgcolor: isScheduled ? "success.dark" : "warning.dark",
                      color: isScheduled ? "success.contrastText" : "warning.contrastText",
                      fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: 0.5
                    }}>
                      {isScheduled ? <IconCheck size={14} /> : <IconClock size={14} />}
                      {dateStr}
                    </Box>
                    <Chip 
                      size="small"
                      color="secondary"
                      label={(item.platform || item.platformTarget || "LINKEDIN").toUpperCase()} 
                      sx={{ fontSize: "10px", fontWeight: 700, height: 22 }}
                    />
                    {item.format && (
                      <Chip 
                        size="small"
                        color="default"
                        label={item.format.toUpperCase()} 
                        sx={{ fontSize: "10px", fontWeight: 600, height: 22 }}
                      />
                    )}
                  </Stack>

                  {item.postizJobId && (
                    <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace", fontSize: "11px" }}>
                      ID: {item.postizJobId}
                    </Typography>
                  )}
                </Stack>

                <Typography variant="subtitle1" sx={{ color: "text.primary", fontWeight: 700, mb: 1, fontSize: "16px", lineHeight: 1.3 }}>
                  {item.name || item.title || item.topic || "Untitled Content Unit"}
                </Typography>

                <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, fontSize: "13px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {item.idea || item.postText || item.subtitle || "No textual body description provided."}
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "12px", display: "flex", alignItems: "center", gap: 0.5 }}>
                    <IconShare size={14} />
                    Targeting {item.audience || "Software Engineers & Founders"}
                  </Typography>

                  <Stack direction="row" spacing={1}>
                    {item.imageUrl && (
                      <Button 
                        size="small" 
                        variant="text" 
                        color="primary"
                        href={item.imageUrl} 
                        target="_blank"
                        sx={{ textTransform: "none", fontSize: "12px", fontWeight: 600 }}
                      >
                        Preview Visual
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
