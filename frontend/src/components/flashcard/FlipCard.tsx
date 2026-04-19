import React, { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import ReplayIcon from '@mui/icons-material/Replay';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import CheckIcon from '@mui/icons-material/Check';
import StarIcon from '@mui/icons-material/Star';
import type { Flashcard, ReviewRating } from '../../types';
import { useTheme } from '@mui/material/styles';

interface FlipCardProps {
  card: Flashcard;
  cardNumber: number;
  totalCards: number;
  onRate: (id: string, rating: ReviewRating) => void;
  isSubmitting?: boolean;
}

const RATING_BUTTONS: { rating: ReviewRating; label: string; color: 'error' | 'warning' | 'success' | 'primary'; icon: React.ReactNode; shortcut: string; tooltip: string }[] = [
  { rating: 'again', label: 'Again', color: 'error', icon: <ReplayIcon />, shortcut: '1', tooltip: 'Forgot completely (1)' },
  { rating: 'hard', label: 'Hard', color: 'warning', icon: <ThumbDownIcon />, shortcut: '2', tooltip: 'Difficult to recall (2)' },
  { rating: 'good', label: 'Good', color: 'success', icon: <CheckIcon />, shortcut: '3', tooltip: 'Correct with effort (3)' },
  { rating: 'easy', label: 'Easy', color: 'primary', icon: <StarIcon />, shortcut: '4', tooltip: 'Perfect recall (4)' },
];

const difficultyColor: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  easy: 'success',
  medium: 'warning',
  hard: 'error',
};

const FlipCard: React.FC<FlipCardProps> = ({ card, cardNumber, totalCards, onRate, isSubmitting }) => {
  const [flipped, setFlipped] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    setFlipped(false);
  }, [card._id]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!flipped) setFlipped(true);
    }
    if (flipped && !isSubmitting) {
      const btn = RATING_BUTTONS.find((b) => b.shortcut === e.key);
      if (btn) onRate(card._id, btn.rating);
    }
  }, [flipped, isSubmitting, card._id, onRate]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: '100%', maxWidth: 680, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <Typography color="text.secondary" variant="body2">
          Card {cardNumber} of {totalCards}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip label={card.difficulty} size="small" color={difficultyColor[card.difficulty] || 'default'} />
          {card.tags.slice(0, 2).map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" />
          ))}
        </Box>
      </Box>

      <Box
        onClick={() => setFlipped(!flipped)}
        sx={{
          width: '100%',
          minHeight: 320,
          perspective: '1000px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            minHeight: 320,
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <Box
            sx={{
              position: 'absolute',
              width: '100%',
              minHeight: 320,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              bgcolor: 'background.paper',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: theme.shadows[4],
            }}
          >
            <Typography variant="overline" color="primary.main" sx={{ mb: 2, letterSpacing: 2 }}>
              Question
            </Typography>
            <Typography variant="h5" align="center" sx={{ fontWeight: 500, lineHeight: 1.6 }}>
              {card.question}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 4 }}>
              Click or press Space to reveal answer
            </Typography>
          </Box>

          {/* Back */}
          <Box
            sx={{
              position: 'absolute',
              width: '100%',
              minHeight: 320,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              bgcolor: 'background.paper',
              borderRadius: 3,
              border: '2px solid',
              borderColor: 'primary.main',
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: theme.shadows[8],
            }}
          >
            <Typography variant="overline" color="primary.main" sx={{ mb: 2, letterSpacing: 2 }}>
              Answer
            </Typography>
            <Typography variant="h6" align="center" sx={{ fontWeight: 400, lineHeight: 1.7 }}>
              {card.answer}
            </Typography>
          </Box>
        </Box>
      </Box>

      {flipped && (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
          {RATING_BUTTONS.map((btn) => (
            <Tooltip key={btn.rating} title={btn.tooltip} placement="top">
              <Button
                variant="contained"
                color={btn.color}
                startIcon={btn.icon}
                onClick={() => onRate(card._id, btn.rating)}
                disabled={isSubmitting}
                sx={{ minWidth: 110, py: 1.25 }}
              >
                {btn.label}
              </Button>
            </Tooltip>
          ))}
        </Box>
      )}

      {!flipped && (
        <Button variant="outlined" onClick={() => setFlipped(true)} size="large" sx={{ px: 4 }}>
          Show Answer
        </Button>
      )}

      <Typography variant="caption" color="text.secondary">
        Keyboard: Space/Enter to flip • 1-4 to rate
      </Typography>
    </Box>
  );
};

export default FlipCard;
