import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';

import DashboardIcon from '@mui/icons-material/Dashboard';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import SchoolIcon from '@mui/icons-material/School';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import { useNavigate, useLocation } from 'react-router-dom';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'My Decks', icon: <LibraryBooksIcon />, path: '/decks' },
  { label: 'Study', icon: <SchoolIcon />, path: '/study', badge: true },
  { label: 'Create Deck', icon: <AddCircleIcon />, path: '/decks/new' },
];

interface SidebarProps {
  open: boolean;
  dueCount?: number;
}

const SidebarContent: React.FC<{ dueCount?: number }> = ({ dueCount }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* 🔹 Logo */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AutoAwesomeIcon sx={{ color: 'white', fontSize: 20 }} />
        </Box>

        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
            FlashAI
          </Typography>
          <Typography variant="caption" color="text.secondary">
            AI Flashcard Generator
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* 🔹 Navigation */}
      <List sx={{ px: 1, pt: 1, flexGrow: 1 }}>
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path === '/decks' &&
              location.pathname.startsWith('/decks') &&
              location.pathname !== '/decks/new');

          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '& .MuiListItemIcon-root': { color: 'white' },
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>

                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 400,
                  }}
                />

                {item.badge && dueCount && dueCount > 0 && (
                  <Chip
                    label={dueCount}
                    size="small"
                    color="error"
                    sx={{
                      height: 20,
                      '& .MuiChip-label': {
                        px: 0.75,
                        fontSize: 11,
                      },
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      {/* 🔹 Footer */}
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Powered by Google Gemini
        </Typography>
      </Box>
    </Box>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ open, dueCount }) => {
  return (
    <Drawer
      variant="persistent"   // 🔥 key change
      open={open}
      sx={{
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      <SidebarContent dueCount={dueCount} />
    </Drawer>
  );
};

export default Sidebar;