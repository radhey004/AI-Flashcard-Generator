import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import StyleIcon from '@mui/icons-material/Style';
import Typography from '@mui/material/Typography';
import { flashcardsApi } from '../../services/api';
import type { Flashcard } from '../../types';

interface FlashcardEditorProps {
  open: boolean;
  onClose: () => void;
  deckId: string;
  card?: Flashcard;
  onSuccess: () => void;
}

const FlashcardEditor: React.FC<FlashcardEditorProps> = ({ open, onClose, deckId, card, onSuccess }) => {
  const isEdit = Boolean(card);
  const [question, setQuestion] = useState(card?.question || '');
  const [answer, setAnswer] = useState(card?.answer || '');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(card?.difficulty || 'medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setQuestion(card?.question || '');
    setAnswer(card?.answer || '');
    setDifficulty(card?.difficulty || 'medium');
    setError('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      setError('Question and answer are required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (isEdit && card) {
        await flashcardsApi.update(card._id, { question: question.trim(), answer: answer.trim(), difficulty });
      } else {
        await flashcardsApi.create({ deckId, question: question.trim(), answer: answer.trim(), difficulty });
      }
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save flashcard';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <StyleIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {isEdit ? 'Edit Flashcard' : 'Add Flashcard'}
          </Typography>
        </Box>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              fullWidth
              multiline
              rows={3}
              autoFocus
              placeholder="What is the capital of France?"
            />
            <TextField
              label="Answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
              fullWidth
              multiline
              rows={4}
              placeholder="Paris is the capital and largest city of France..."
            />
            <FormControl size="small">
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={difficulty}
                label="Difficulty"
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              >
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleClose} color="inherit">Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading} sx={{ minWidth: 100 }}>
            {loading ? <CircularProgress size={20} color="inherit" /> : isEdit ? 'Save' : 'Add Card'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default FlashcardEditor;
