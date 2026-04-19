import React, { useState, useRef } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Slider from '@mui/material/Slider';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SmartDisplayIcon from '@mui/icons-material/SmartDisplay';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { aiApi, flashcardsApi } from '../../services/api';
import type { GeneratedFlashcard, AIGenerationResult } from '../../types';

interface AIGenerateDialogProps {
  open: boolean;
  onClose: () => void;
  deckId: string;
  onSuccess: () => void;
}

const AIGenerateDialog: React.FC<AIGenerateDialogProps> = ({ open, onClose, deckId, onSuccess }) => {
  const [tab, setTab] = useState(0);
  const [text, setText] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AIGenerationResult | null>(null);
  const [editingCard, setEditingCard] = useState<{ index: number; question: string; answer: string } | null>(null);
  const [cards, setCards] = useState<GeneratedFlashcard[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setResult(null);
    setCards([]);
    setText('');
    setYoutubeUrl('');
    setPdfFile(null);
    setError('');
    setTab(0);
    onClose();
  };

  const handleGenerate = async () => {
    setError('');
    setLoading(true);
    try {
      let res;
      if (tab === 0) {
        if (!text.trim() || text.trim().length < 50) { setError('Please enter at least 50 characters of text'); setLoading(false); return; }
        res = await aiApi.generateFromText({ text, difficulty, count });
      } else if (tab === 1) {
        if (!pdfFile) { setError('Please select a PDF file'); setLoading(false); return; }
        res = await aiApi.generateFromPDF(pdfFile, difficulty, count);
      } else {
        if (!youtubeUrl.trim()) { setError('Please enter a YouTube URL'); setLoading(false); return; }
        res = await aiApi.generateFromYouTube({ url: youtubeUrl, difficulty, count });
      }
      const data = res.data as AIGenerationResult;
      setResult(data);
      setCards(data.flashcards);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string; detail?: string } } })?.response?.data?.message
        || (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        || 'AI generation failed. Check that the AI service is running.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await flashcardsApi.bulkCreate({ deckId, flashcards: cards });
      onSuccess();
      handleClose();
    } catch {
      setError('Failed to save flashcards');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSave = () => {
    if (!editingCard) return;
    setCards((prev) => prev.map((c, i) =>
      i === editingCard.index ? { ...c, question: editingCard.question, answer: editingCard.answer } : c
    ));
    setEditingCard(null);
  };

  const handleDeleteCard = (index: number) => {
    setCards((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AutoAwesomeIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {result ? `Generated ${cards.length} Flashcards` : 'Generate Flashcards with AI'}
          </Typography>
        </Box>
        {result && (
          <Typography variant="body2" color="text.secondary">
            Topic: {result.topic} — {result.summary}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent dividers>
        {!result ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab icon={<TextFieldsIcon />} label="Text" iconPosition="start" />
              <Tab icon={<PictureAsPdfIcon />} label="PDF" iconPosition="start" />
              <Tab icon={<SmartDisplayIcon />} label="YouTube" iconPosition="start" />
            </Tabs>

            {tab === 0 && (
              <TextField
                label="Paste your text content"
                multiline
                rows={8}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste a textbook chapter, article, notes, or any educational content here..."
                fullWidth
                helperText={`${text.length} characters (minimum 50)`}
              />
            )}

            {tab === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                />
                <Box
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    width: '100%', p: 6, border: '2px dashed', borderColor: 'divider',
                    borderRadius: 2, textAlign: 'center', cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                  }}
                >
                  <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography>{pdfFile ? pdfFile.name : 'Click to upload PDF'}</Typography>
                  <Typography variant="caption" color="text.secondary">Max 20MB · Up to 50 pages</Typography>
                </Box>
                {pdfFile && (
                  <Chip label={pdfFile.name} onDelete={() => setPdfFile(null)} color="primary" />
                )}
              </Box>
            )}

            {tab === 2 && (
              <TextField
                label="YouTube URL"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                fullWidth
                helperText="The video must have English captions/transcript available"
              />
            )}

            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
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
              <Box sx={{ minWidth: 200 }}>
                <Typography variant="caption" color="text.secondary">Number of cards: {count}</Typography>
                <Slider
                  value={count}
                  onChange={(_, v) => setCount(v as number)}
                  min={3}
                  max={30}
                  step={1}
                  size="small"
                />
              </Box>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <Typography variant="body2" color="text.secondary">
              Review and edit the generated flashcards before saving. Click the edit icon to modify any card.
            </Typography>
            {cards.map((card, i) => (
              <Box key={i}>
                {editingCard?.index === i ? (
                  <Box sx={{ border: '2px solid', borderColor: 'primary.main', borderRadius: 2, p: 2 }}>
                    <TextField
                      label="Question"
                      value={editingCard.question}
                      onChange={(e) => setEditingCard({ ...editingCard, question: e.target.value })}
                      fullWidth
                      multiline
                      rows={2}
                      sx={{ mb: 1.5 }}
                    />
                    <TextField
                      label="Answer"
                      value={editingCard.answer}
                      onChange={(e) => setEditingCard({ ...editingCard, answer: e.target.value })}
                      fullWidth
                      multiline
                      rows={3}
                      sx={{ mb: 1.5 }}
                    />
                    <Button startIcon={<CheckIcon />} variant="contained" size="small" onClick={handleEditSave}>
                      Save
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, '&:hover': { borderColor: 'primary.light' } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flexGrow: 1, pr: 2 }}>
                        <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>Q{i + 1}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>{card.question}</Typography>
                        <Typography variant="body2" color="text.secondary">{card.answer}</Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                          <Chip label={card.difficulty} size="small" sx={{ height: 18, fontSize: 10 }} />
                          {card.tags.slice(0, 3).map((t) => (
                            <Chip key={t} label={t} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                          ))}
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                        <IconButton size="small" onClick={() => setEditingCard({ index: i, question: card.question, answer: card.answer })}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteCard(i)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                )}
                {i < cards.length - 1 && <Divider sx={{ my: 1 }} />}
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button onClick={handleClose} color="inherit">Cancel</Button>
        {!result ? (
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate'}
          </Button>
        ) : (
          <>
            <Button onClick={() => setResult(null)} color="inherit">Regenerate</Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
              onClick={handleSave}
              disabled={saving || cards.length === 0}
            >
              {saving ? 'Saving...' : `Save ${cards.length} Cards`}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AIGenerateDialog;
