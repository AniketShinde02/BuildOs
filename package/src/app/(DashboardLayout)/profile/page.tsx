"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography, Card, CardContent, Grid, Stack, Avatar } from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { auth } from "@/utils/firebase";

export default function ProfilePage() {
  const [userEmail, setUserEmail] = useState("");
  const [userInitials, setUserInitials] = useState("?");
  const [userName, setUserName] = useState("Aniket Shinde"); // Default to known profile

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email || "");
        if (user.displayName) {
          setUserName(user.displayName);
          const parts = user.displayName.trim().split(" ");
          setUserInitials(parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : parts[0][0].toUpperCase());
        } else if (user.email) {
          setUserInitials(user.email[0].toUpperCase());
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <PageContainer title="My Profile" description="User Profile and Biography">
      <Box sx={{ maxWidth: 1000, margin: "0 auto", p: { xs: 2, md: 4 } }}>
        <Typography variant="h1" mb={4}>My Profile</Typography>

        <Grid container spacing={4}>
          {/* Identity Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: "12px", border: "1px solid", borderColor: "divider", boxShadow: "none", textAlign: "center", p: 3 }}>
              <Box display="flex" justifyContent="center" mb={2}>
                <Avatar sx={{ width: 100, height: 100, bgcolor: "primary.main", fontSize: "32px", fontWeight: 700 }}>
                  {userInitials}
                </Avatar>
              </Box>
              <Typography variant="h4" fontWeight={700} mb={1}>{userName}</Typography>
              <Typography variant="body2" color="textSecondary">{userEmail}</Typography>
            </Card>
          </Grid>

          {/* Biography Card */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ borderRadius: "12px", border: "1px solid", borderColor: "divider", boxShadow: "none" }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" fontWeight={700} mb={3}>Biography & Vision</Typography>
                
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="subtitle2" color="primary.main" fontWeight={700} textTransform="uppercase" letterSpacing={1} mb={1}>
                      Current Position
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Final-year AIML student. Freelancer specializing in Shopify, custom systems, and n8n AI integrations. 
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="primary.main" fontWeight={700} textTransform="uppercase" letterSpacing={1} mb={1}>
                      The BuildOS Mission
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Building systems to become independent from traditional freelancing. The immediate goal is to build a reliable freelance income while documenting everything built. Long term, transitioning to a product founder building AI-first developer tools and automation software.
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="primary.main" fontWeight={700} textTransform="uppercase" letterSpacing={1} mb={1}>
                      The Content OS Concept
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      BuildOS is the first serious internal product being built. It serves as a personal Content Operating System, designed to be significantly better than Upload-Post, Buffer, or Hootsuite. Eventually, BuildOS will become a product other builders can use, and Nexus will integrate BuildOS as one of its core capabilities.
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
}
