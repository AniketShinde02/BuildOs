import React, { useState } from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/utils/firebase";
import Link from 'next/link';

import CustomTextField from '@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField';

const AuthForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess("Password reset email sent! Please check your inbox.");
        } catch (err: any) {
            setError(err.message || "Failed to send reset email");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleReset}>
            <Typography fontWeight="700" variant="h2" mb={1}>
                Forgot your password?
            </Typography>
            <Typography variant="subtitle1" color="textSecondary" mb={3}>
                Please enter the email address associated with your account and we will email you a link to reset your password.
            </Typography>

            {error && (
                <Box mb={2} p={1.5} bgcolor="error.light" borderRadius={1}>
                    <Typography color="error.dark" variant="body2" fontWeight={500}>
                        {error}
                    </Typography>
                </Box>
            )}

            {success && (
                <Box mb={2} p={1.5} bgcolor="success.light" borderRadius={1}>
                    <Typography color="success.dark" variant="body2" fontWeight={500}>
                        {success}
                    </Typography>
                </Box>
            )}

            <Stack spacing={3}>
                <Box>
                    <Typography variant="subtitle1"
                        fontWeight={600} component="label" htmlFor='email' mb="5px" display="block">Email Address</Typography>
                    <CustomTextField 
                        id="email" 
                        type="email"
                        variant="outlined" 
                        fullWidth 
                        value={email}
                        onChange={(e: any) => setEmail(e.target.value)}
                        required
                        placeholder="name@company.com"
                    />
                </Box>
            </Stack>
            
            <Box mt={4}>
                <Button 
                    color="primary" 
                    variant="contained" 
                    size="large" 
                    fullWidth 
                    type="submit"
                    disabled={loading || !!success}
                    sx={{ py: 1.5, fontWeight: 700 }}
                >
                    {loading ? "Sending..." : "Send Reset Link"}
                </Button>
            </Box>
            <Box mt={3} display="flex" justifyContent="center">
                <Typography component={Link} href="/authentication/login" fontWeight="500" sx={{ textDecoration: "none", color: "primary.main" }}>
                    Back to Login
                </Typography>
            </Box>
        </Box>
    );
};

export default AuthForgotPassword;
