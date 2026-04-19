import React, { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SchoolIcon from '@mui/icons-material/School';
import SearchIcon from '@mui/icons-material/Search';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import StyleIcon from '@mui/icons-material/Style';
import { useNavigate, useParams } from 'react-router-dom';
import type { Deck, Flashcard } from '../types';
import { decksApi, flashcardsApi } from '../services/api';
import FlashcardEditor from '../components/flashcard/FlashcardEditor';
import AIGenerateDialog from '../components/ai/AIGenerateDialog';
import Layout from '../components/layout/Layout';

const difficultyColor: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  easy: 'success',
  medium: 'warning',
  hard: 'error',
};

const DeckDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editCard, setEditCard] = useState<Flashcard | undefined>(undefined);
  const [showEditor, setShowEditor] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadData = useCallback(() => {
    if (!id) return;
    Promise.all([
      decksApi.getOne(id),
      flashcardsApi.getAll({ deckId: id }),
    ]).then(([deckRes, cardsRes]) => {
      setDeck((deckRes.data as { deck: Deck }).deck);
      setCards((cardsRes.data as { flashcards: Flashcard[] }).flashcards);
    }).catch(() => setError('Failed to load deck')).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredCards = cards.filter((c) =>
    !search || c.question.toLowerCase().includes(search.toLowerCase()) || c.answer.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteCard = async () => {
    if (!deleteCardId) return;
    setDeleting(true);
    try {
      await flashcardsApi.delete(deleteCardId);
      setCards((prev) => prev.filter((c) => c._id !== deleteCardId));
      setDeleteCardId(null);
    } catch {
      setError('Failed to delete card');
    } finally {
      setDeleting(false);
    }
  };

  const dueCount = cards.filter((c) => new Date(c.nextReviewDate) <= new Date()).length;

  if (loading) {
    return (
      <Layout>
        <Skeleton variant="text" height={50} width="40%" />
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 3 }} />
      </Layout>
    );
  }

  if (!deck) return <Layout><Alert severity="error">Deck not found</Alert></Layout>;

  return (
    <Layout dueCount={dueCount}>
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/decks')} sx={{ mb: 2 }} color="inherit">
          Back to Decks
        </Button>

        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>{deck.name}</Typography>
                {deck.description && (
                  <Typography color="text.secondary" sx={{ mb: 1.5 }}>{deck.description}</Typography>
                )}
                {deck.tags.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                    {deck.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                <Tooltip title="Edit deck">
                  <IconButton onClick={() => navigate(`/decks/${id}/edit`)} size="small">
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {[
                { label: 'Total Cards', value: cards.length },
                { label: 'Due Now', value: dueCount, color: dueCount > 0 ? 'warning.main' : undefined },
                { label: 'Reviewed', value: cards.filter((c) => c.reviewCount > 0).length },
              ].map((stat) => (
                <Box key={stat.label}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: stat.color }}>{stat.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                </Box>
              ))}
            </Box>

            {dueCount > 0 && (
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<SchoolIcon />}
                  onClick={() => navigate(`/study?deckId=${id}`)}
                >
                  Study {dueCount} Due Card{dueCount !== 1 ? 's' : ''}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StyleIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6">Flashcards</Typography>
            <Chip label={cards.length} size="small" />
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<AutoAwesomeIcon />}
              onClick={() => setShowAI(true)}
              color="primary"
            >
              Generate with AI
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => { setEditCard(undefined); setShowEditor(true); }}
            >
              Add Card
            </Button>
          </Box>
        </Box>

        <TextField
          placeholder="Search cards..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          fullWidth
          sx={{ maxWidth: 400, mb: 3 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
          }}
        />

        {filteredCards.length === 0 ? (
          <Card>
            <CardContent sx={{ p: 6, textAlign: 'center' }}>
              <StyleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                {search ? 'No cards match your search' : 'No flashcards yet'}
              </Typography>
              {!search && (
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  Add cards manually or generate them with AI
                </Typography>
              )}
              {!search && (
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button variant="outlined" startIcon={<AutoAwesomeIcon />} onClick={() => setShowAI(true)}>
                    Generate with AI
                  </Button>
                  <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditCard(undefined); setShowEditor(true); }}>
                    Add Manually
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {filteredCards.map((card) => {
              const isDue = new Date(card.nextReviewDate) <= new Date();
              return (
                <Grid key={card._id} size={{ xs: 12, md: 6 }}>
                  <Card sx={{ height: '100%', borderLeft: `3px solid`, borderLeftColor: isDue ? 'warning.main' : 'success.main' }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                          <Chip label={card.difficulty} size="small" color={difficultyColor[card.difficulty]} />
                          {isDue && <Chip label="Due" size="small" color="warning" />}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => { setEditCard(card); setShowEditor(true); }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => setDeleteCardId(card._id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>Q</Typography>
                      <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.6 }}>{card.question}</Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: 'success.main' }}>A</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{card.answer}</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Reviewed {card.reviewCount}x
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Interval: {card.interval}d
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      <FlashcardEditor
        open={showEditor}
        onClose={() => { setShowEditor(false); setEditCard(undefined); }}
        deckId={id!}
        card={editCard}
        onSuccess={() => { loadData(); setShowEditor(false); setEditCard(undefined); }}
      />

      <AIGenerateDialog
        open={showAI}
        onClose={() => setShowAI(false)}
        deckId={id!}
        onSuccess={() => { loadData(); setShowAI(false); }}
      />

      <Dialog open={!!deleteCardId} onClose={() => setDeleteCardId(null)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>Delete Flashcard?</DialogTitle>
        <DialogContent>
          <Typography>This will permanently delete this flashcard and its review history.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteCardId(null)} color="inherit">Cancel</Button>
          <Button onClick={handleDeleteCard} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default DeckDetailPage;
