import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';

import MenuIcon from '@mui/icons-material/Menu';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LogoutIcon from '@mui/icons-material/Logout';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

import { useThemeMode } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const DRAWER_WIDTH = 240;

interface NavbarProps {
  sidebarOpen: boolean;
  onToggle: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, onToggle }) => {
  const { mode, toggleMode } = useThemeMode();
  const { user, logout } = useAuth();

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: {
          md: sidebarOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%',
        },
        ml: {
          md: sidebarOpen ? `${DRAWER_WIDTH}px` : 0,
        },
        transition: 'all 0.3s ease', // smooth animation
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
      }}
    >
      <Toolbar>

        {/* 🔥 Sidebar Toggle Button */}
        <IconButton
          onClick={onToggle}
          edge="start"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        {/* 🔹 Logo / Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, display: { md: 'none' } }}
          >
            FlashAI
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* 🔥 Streak */}
        {user && user.streak > 0 && (
          <Tooltip title={`${user.streak} day streak!`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
              <LocalFireDepartmentIcon sx={{ color: '#ff6d00', fontSize: 20 }} />
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, color: '#ff6d00' }}
              >
                {user.streak}
              </Typography>
            </Box>
          </Tooltip>
        )}

        {/* 🔥 Theme Toggle */}
        <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
          <IconButton onClick={toggleMode} size="small" sx={{ mr: 1 }}>
            {mode === 'dark' ? (
              <LightModeIcon fontSize="small" />
            ) : (
              <DarkModeIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>

        {/* 🔥 User Avatar */}
        <Tooltip title={user?.name || 'User'}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'primary.main',
              fontSize: 14,
              mr: 1,
            }}
          >
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
        </Tooltip>

        {/* 🔥 Logout */}
        <Tooltip title="Logout">
          <IconButton onClick={logout} size="small">
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>

      </Toolbar>
    </AppBar>
  );
};

export default Navbar;