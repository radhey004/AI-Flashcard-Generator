import request from 'supertest';
import createApp from '../src/app';

describe('Decks and Flashcards', () => {
    const app = createApp as any;
    let token: string;

    beforeEach(async () => {
        const signup = await request(app).post('/api/auth/signup').send({ email: 'u1@example.com', password: 'pass1234', name: 'User1' });
        token = signup.body.token;
    });

    test('create deck and add flashcard', async () => {
        const deckRes = await request(app).post('/api/decks').set('Authorization', `Bearer ${token}`).send({ name: 'My Deck', description: 'desc' });
        expect(deckRes.status).toBe(201);
        const deckId = deckRes.body.deck._id || deckRes.body.deck.id;

        const cardRes = await request(app).post('/api/flashcards').set('Authorization', `Bearer ${token}`).send({ deckId, question: 'Q?', answer: 'A.' });
        expect(cardRes.status).toBe(201);
        expect(cardRes.body.flashcard.question).toBe('Q?');
    });
});
