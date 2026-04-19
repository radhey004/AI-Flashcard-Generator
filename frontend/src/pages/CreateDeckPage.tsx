import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import { useNavigate, useParams } from 'react-router-dom';
import { decksApi } from '../services/api';
import Layout from '../components/layout/Layout';

const CreateDeckPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isEdit && id) {
      decksApi.getOne(id).then((res) => {
        const deck = (res.data as { deck: { name: string; description: string; tags: string[] } }).deck;
        setName(deck.name);
        setDescription(deck.description || '');
        setTags(deck.tags || []);
      }).catch(() => setError('Failed to load deck')).finally(() => setFetchLoading(false));
    }
  }, [id, isEdit]);

  const handleAddTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
    }
    setTagInput('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Deck name is required'); return; }
    setError('');
    setLoading(true);
    try {
      if (isEdit && id) {
        await decksApi.update(id, { name: name.trim(), description: description.trim(), tags });
        navigate(`/decks/${id}`);
      } else {
        const res = await decksApi.create({ name: name.trim(), description: description.trim(), tags });
        const deck = (res.data as { deck: { _id: string } }).deck;
        navigate(`/decks/${deck._id}`);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save deck';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return <Layout><Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box></Layout>;
  }

  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/decks')} sx={{ mb: 2 }} color="inherit">
          Back to Decks
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LibraryBooksIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h4">{isEdit ? 'Edit Deck' : 'Create New Deck'}</Typography>
        </Box>
      </Box>

      <Card sx={{ maxWidth: 600 }}>
        <CardContent sx={{ p: 4 }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Deck Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              autoFocus
              inputProps={{ maxLength: 100 }}
              helperText={`${name.length}/100`}
            />

            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              inputProps={{ maxLength: 500 }}
              helperText="Optional: describe what this deck covers"
            />

            <Box>
              <TextField
                label="Add Tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                fullWidth
                helperText="Press Enter or comma to add a tag"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button size="small" onClick={handleAddTag} disabled={!tagInput.trim()}>
                        <AddIcon fontSize="small" />
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
              {tags.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1.5 }}>
                  {tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => setTags((prev) => prev.filter((t) => t !== tag))}
                      size="small"
                    />
                  ))}
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 1 }}>
              <Button onClick={() => navigate(isEdit && id ? `/decks/${id}` : '/decks')} color="inherit">
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={loading} sx={{ minWidth: 120 }}>
                {loading ? <CircularProgress size={22} color="inherit" /> : isEdit ? 'Save Changes' : 'Create Deck'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default CreateDeckPage;
