import React, { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import StyleIcon from '@mui/icons-material/Style';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import type { DashboardStats } from '../types';
import { decksApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; color: string; subtitle?: string }> = ({
  title, value, icon, color, subtitle,
}) => (
  <Card>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 0.5 }}>{title}</Typography>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>{value}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}20` }}>
          <Box sx={{ color }}>{icon}</Box>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    decksApi.getDashboardStats().then((res) => {
      setStats(res.data as DashboardStats);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { title: 'Total Decks', value: stats?.totalDecks || 0, icon: <LibraryBooksIcon />, color: '#2196f3', subtitle: 'Flashcard collections' },
    { title: 'Total Cards', value: stats?.totalCards || 0, icon: <StyleIcon />, color: '#4caf50', subtitle: 'In all decks' },
    { title: 'Due Today', value: stats?.dueCards || 0, icon: <SchoolIcon />, color: '#ff9800', subtitle: 'Cards to review' },
    { title: 'Day Streak', value: user?.streak || 0, icon: <LocalFireDepartmentIcon />, color: '#ff5722', subtitle: 'Keep it going!' },
  ];

  return (
    <Layout dueCount={stats?.dueCards}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <DashboardIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h4">Dashboard</Typography>
        </Box>
        <Typography color="text.secondary">
          Welcome back, {user?.name?.split(' ')[0] || 'Learner'}!
          {stats?.dueCards && stats.dueCards > 0
            ? ` You have ${stats.dueCards} card${stats.dueCards === 1 ? '' : 's'} due for review.`
            : ' Great job staying on top of your reviews!'}
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card) => (
          <Grid key={card.title} size={{ xs: 12, sm: 6, lg: 3 }}>
            {loading ? (
              <Card><CardContent sx={{ p: 3 }}><Skeleton variant="text" /><Skeleton variant="text" width="60%" /></CardContent></Card>
            ) : (
              <StatCard {...card} />
            )}
          </Grid>
        ))}
      </Grid>

      {stats?.dueCards && stats.dueCards > 0 && (
        <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'white' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {stats.dueCards} card{stats.dueCards === 1 ? '' : 's'} ready for review
                </Typography>
                <Typography sx={{ opacity: 0.85 }}>Stay consistent to maintain your streak!</Typography>
              </Box>
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/study')}
                sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
              >
                Start Review
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6">Recent Decks</Typography>
          </Box>
          <Button size="small" onClick={() => navigate('/decks')} endIcon={<ArrowForwardIcon />}>
            View all
          </Button>
        </Box>

        {loading ? (
          <Grid container spacing={2}>
            {[1, 2, 3].map((i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card><CardContent><Skeleton /><Skeleton width="60%" /></CardContent></Card>
              </Grid>
            ))}
          </Grid>
        ) : stats?.recentDecks?.length ? (
          <Grid container spacing={2}>
            {stats.recentDecks.map((deck) => (
              <Grid key={deck._id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card>
                  <CardActionArea onClick={() => navigate(`/decks/${deck._id}`)}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" noWrap sx={{ fontWeight: 600, mb: 0.5 }}>
                        {deck.name}
                      </Typography>
                      <Typography color="text.secondary" variant="body2" sx={{ mb: 2, minHeight: 40,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {deck.description || 'No description'}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">{deck.cardCount} cards</Typography>
                        {deck.dueCount > 0 && (
                          <Chip label={`${deck.dueCount} due`} size="small" color="warning" />
                        )}
                      </Box>
                      {deck.cardCount > 0 && (
                        <LinearProgress
                          variant="determinate"
                          value={deck.dueCount > 0 ? Math.max(0, 100 - (deck.dueCount / deck.cardCount) * 100) : 100}
                          sx={{ mt: 1.5, borderRadius: 1 }}
                          color={deck.dueCount > 0 ? 'warning' : 'success'}
                        />
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Card>
            <CardContent sx={{ p: 6, textAlign: 'center' }}>
              <LibraryBooksIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>No decks yet</Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>Create your first deck to get started</Typography>
              <Button variant="contained" onClick={() => navigate('/decks/new')}>Create Deck</Button>
            </CardContent>
          </Card>
        )}
      </Box>
    </Layout>
  );
};

export default DashboardPage;
