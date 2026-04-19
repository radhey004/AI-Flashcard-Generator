import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SchoolIcon from '@mui/icons-material/School';
import { useNavigate } from 'react-router-dom';
import type { Deck } from '../types';
import { decksApi } from '../services/api';
import Layout from '../components/layout/Layout';

const DecksPage: React.FC = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadDecks = () => {
    setLoading(true);
    decksApi.getAll({ search: search || undefined }).then((res) => {
      setDecks((res.data as { decks: Deck[] }).decks);
    }).catch(() => setError('Failed to load decks')).finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(loadDecks, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await decksApi.delete(deleteId);
      setDecks((prev) => prev.filter((d) => d._id !== deleteId));
      setDeleteId(null);
    } catch {
      setError('Failed to delete deck');
    } finally {
      setDeleting(false);
    }
  };

  const totalDue = decks.reduce((sum, d) => sum + (d.dueCount || 0), 0);

  return (
    <Layout dueCount={totalDue}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <LibraryBooksIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h4">My Decks</Typography>
            <Chip label={decks.length} size="small" />
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/decks/new')}>
            New Deck
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <TextField
          placeholder="Search decks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          fullWidth
          sx={{ maxWidth: 400 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
          }}
        />
      </Box>

      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card><CardContent><Skeleton /><Skeleton /><Skeleton width="60%" /></CardContent></Card>
            </Grid>
          ))}
        </Grid>
      ) : decks.length === 0 ? (
        <Card>
          <CardContent sx={{ p: 8, textAlign: 'center' }}>
            <LibraryBooksIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 1 }}>No decks found</Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
              {search ? 'No decks match your search.' : 'Create your first deck to start learning!'}
            </Typography>
            {!search && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/decks/new')}>
                Create First Deck
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {decks.map((deck) => (
            <Grid key={deck._id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardActionArea sx={{ flexGrow: 1 }} onClick={() => navigate(`/decks/${deck._id}`)}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.75 }} noWrap>{deck.name}</Typography>
                    <Typography
                      color="text.secondary"
                      variant="body2"
                      sx={{
                        mb: 2, minHeight: 40,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}
                    >
                      {deck.description || 'No description'}
                    </Typography>
                    {deck.tags.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                        {deck.tags.slice(0, 4).map((tag) => (
                          <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                        ))}
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">{deck.cardCount} cards</Typography>
                      {deck.dueCount > 0 ? (
                        <Chip label={`${deck.dueCount} due`} size="small" color="warning" />
                      ) : (
                        <Chip label="All caught up" size="small" color="success" variant="outlined" />
                      )}
                    </Box>
                    {deck.cardCount > 0 && (
                      <LinearProgress
                        variant="determinate"
                        value={deck.dueCount > 0 ? Math.max(0, 100 - (deck.dueCount / deck.cardCount) * 100) : 100}
                        sx={{ borderRadius: 1 }}
                        color={deck.dueCount > 0 ? 'warning' : 'success'}
                      />
                    )}
                  </CardContent>
                </CardActionArea>
                <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1 }}>
                  {deck.dueCount > 0 && (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<SchoolIcon />}
                      onClick={(e) => { e.stopPropagation(); navigate(`/study?deckId=${deck._id}`); }}
                    >
                      Study ({deck.dueCount})
                    </Button>
                  )}
                  <Box sx={{ flexGrow: 1 }} />
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/decks/${deck._id}/edit`); }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteId(deck._id); }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>Delete Deck?</DialogTitle>
        <DialogContent>
          <Typography>This will permanently delete the deck and all its flashcards. This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteId(null)} color="inherit">Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default DecksPage;
