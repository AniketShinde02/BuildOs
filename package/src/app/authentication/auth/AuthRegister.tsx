import React, { useState } from 'react';
import { Box, Typography, Button, IconButton, InputAdornment, Stack } from '@mui/material';
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/utils/firebase";

import CustomTextField from '@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField';

interface registerType {
    title?: string;
    subtitle?: React.ReactNode;
    subtext?: React.ReactNode;
}

const AuthRegister = ({ title, subtitle, subtext }: registerType) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Save user profile in Firestore
            await setDoc(doc(db, "Users", user.uid), {
                name: name,
                email: email,
                createdAt: new Date().toISOString()
            });

            // Mint session cookie so Server Components authenticate the user
            const idToken = await user.getIdToken();
            const res = await fetch("/api/auth/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create secure session");
            }

            router.push("/");
        } catch (err: any) {
            setError(err.message || "Failed to register");
        } finally {
            setLoading(false);
        }
    };

    const handleClickShowPassword = () => setShowPassword(!showPassword);
    const handleMouseDownPassword = (e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault();

    return (
        <Box component="form" onSubmit={handleRegister}>
            {title ? (
                <Typography fontWeight="700" variant="h2" mb={1}>
                    {title}
                </Typography>
            ) : null}

            {subtext}

            {error && (
                <Box mb={2} p={1.5} bgcolor="error.light" borderRadius={1}>
                    <Typography color="error.dark" variant="body2" fontWeight={500}>
                        {error}
                    </Typography>
                </Box>
            )}

            <Box mt={error ? 1 : 3}>
                <Stack spacing={3}>
                    <Box>
                        <Typography variant="subtitle1"
                            fontWeight={600} component="label" htmlFor='name' mb="5px" display="block">Name</Typography>
                        <CustomTextField 
                            id="name" 
                            variant="outlined" 
                            fullWidth 
                            value={name}
                            onChange={(e: any) => setName(e.target.value)}
                            required
                            placeholder="Your full name"
                        />
                    </Box>

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

                    <Box>
                        <Typography variant="subtitle1"
                            fontWeight={600} component="label" htmlFor='password' mb="5px" display="block">Password</Typography>
                        <CustomTextField 
                            id="password" 
                            type={showPassword ? "text" : "password"}
                            variant="outlined" 
                            fullWidth 
                            value={password}
                            onChange={(e: any) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleClickShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                            Must be at least 8 characters.
                        </Typography>
                    </Box>
                </Stack>
                
                <Box mt={4}>
                    <Button 
                        color="primary" 
                        variant="contained" 
                        size="large" 
                        fullWidth 
                        type="submit"
                        disabled={loading}
                        sx={{ py: 1.5, fontWeight: 700 }}
                    >
                        {loading ? "Signing Up..." : "Sign Up"}
                    </Button>
                </Box>
            </Box>
            {subtitle}
        </Box>
    );
};

export default AuthRegister;
