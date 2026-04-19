import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';

import Navbar from './Navbar';
import Sidebar from './Sidebar';

const DRAWER_WIDTH = 240;

interface LayoutProps {
  children: React.ReactNode;
  dueCount?: number;
}

const Layout: React.FC<LayoutProps> = ({ children, dueCount }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>

      {/* 🔥 Navbar */}
      <Navbar
        sidebarOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* 🔥 Sidebar */}
      <Sidebar
        open={sidebarOpen}
        dueCount={dueCount}
      />

      {/* 🔥 Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: {
            md: sidebarOpen
              ? `calc(100% - ${DRAWER_WIDTH}px)`
              : '100%',
          },
          transition: 'all 0.3s ease',
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar />

        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {children}
        </Box>
      </Box>

    </Box>
  );
};

export default Layout;