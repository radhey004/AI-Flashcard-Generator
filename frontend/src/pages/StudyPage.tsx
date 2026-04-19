import React, { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Flashcard, ReviewRating, Deck } from '../types';
import { flashcardsApi, decksApi } from '../services/api';
import FlipCard from '../components/flashcard/FlipCard';
import Layout from '../components/layout/Layout';

const StudyPage: React.FC = () => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const [finished, setFinished] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const deckId = searchParams.get('deckId');
    if (deckId) setSelectedDeck(deckId);
    decksApi.getAll().then((res) => {
      const d = (res.data as { decks: Deck[] }).decks;
      setDecks(d);
    }).catch(console.error);
  }, [searchParams]);

  const loadCards = useCallback(() => {
    setLoading(true);
    setFinished(false);
    setCurrentIndex(0);
    setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
    const params = { dueOnly: true, ...(selectedDeck !== 'all' && { deckId: selectedDeck }) };
    flashcardsApi.getAll(params).then((res) => {
      const fc = (res.data as { flashcards: Flashcard[] }).flashcards;
      setCards(fc.sort(() => Math.random() - 0.5));
    }).catch(() => setError('Failed to load cards')).finally(() => setLoading(false));
  }, [selectedDeck]);

  useEffect(() => { loadCards(); }, [loadCards]);

  const handleRate = async (cardId: string, rating: ReviewRating) => {
    setSubmitting(true);
    try {
      await flashcardsApi.review(cardId, rating);
      setSessionStats((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));
      if (currentIndex < cards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setFinished(true);
      }
    } catch {
      setError('Failed to record review');
    } finally {
      setSubmitting(false);
    }
  };

  const progress = cards.length > 0 ? (currentIndex / cards.length) * 100 : 0;
  const totalReviewed = sessionStats.again + sessionStats.hard + sessionStats.good + sessionStats.easy;

  return (
    <Layout dueCount={cards.length - currentIndex}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <SchoolIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h4">Study Session</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 4, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filter by deck</InputLabel>
          <Select
            value={selectedDeck}
            label="Filter by deck"
            onChange={(e) => setSelectedDeck(e.target.value)}
          >
            <MenuItem value="all">All decks</MenuItem>
            {decks.map((d) => (
              <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="outlined" onClick={loadCards} size="small">Refresh</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : finished || cards.length === 0 ? (
        <Card sx={{ maxWidth: 500, mx: 'auto', textAlign: 'center' }}>
          <CardContent sx={{ p: 6 }}>
            <CheckCircleIcon sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              {cards.length === 0 ? 'No cards due!' : 'Session complete!'}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
              {cards.length === 0
                ? 'All caught up. Check back later or browse your decks.'
                : `You reviewed ${totalReviewed} cards in this session.`}
            </Typography>
            {totalReviewed > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4, flexWrap: 'wrap' }}>
                {[
                  { label: 'Again', value: sessionStats.again, color: 'error.main' },
                  { label: 'Hard', value: sessionStats.hard, color: 'warning.main' },
                  { label: 'Good', value: sessionStats.good, color: 'success.main' },
                  { label: 'Easy', value: sessionStats.easy, color: 'primary.main' },
                ].map((s) => (
                  <Box key={s.label} sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: s.color }}>{s.value}</Typography>
                    <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                  </Box>
                ))}
              </Box>
            )}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
              {cards.length > 0 && (
                <Button variant="contained" onClick={loadCards}>Study More</Button>
              )}
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Box>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Progress: {currentIndex}/{cards.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Math.round(progress)}%
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 1, height: 6 }} />
          </Box>
          <FlipCard
            card={cards[currentIndex]}
            cardNumber={currentIndex + 1}
            totalCards={cards.length}
            onRate={handleRate}
            isSubmitting={submitting}
          />
        </Box>
      )}
    </Layout>
  );
};

export default StudyPage;
