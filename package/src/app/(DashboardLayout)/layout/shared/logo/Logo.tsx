import Link from "next/link";
import { styled, Box, Typography } from "@mui/material";

const LinkStyled = styled(Link)(() => ({
  height: "70px",
  width: "180px",
  overflow: "hidden",
  display: "block",
  textDecoration: "none"
}));

const Logo = () => {
  return (
    <LinkStyled href="/">
      <Box display="flex" alignItems="center" justifyContent="center" height="100%" sx={{ userSelect: 'none' }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 800, 
            letterSpacing: '-0.04em',
            background: 'linear-gradient(90deg, #FAFAFA 0%, #A1A1AA 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}
        >
          Build
        </Typography>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 800, 
            letterSpacing: '-0.04em',
            color: '#FF5C00',
            display: 'inline-block'
          }}
        >
          OS
        </Typography>
      </Box>
    </LinkStyled>
  );
};

export default Logo;
  