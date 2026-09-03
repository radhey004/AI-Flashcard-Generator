import request from 'supertest';
import createApp from '../src/app';
import User from '../src/models/User';

describe('Auth API', () => {
    const app = createApp as any;

    test('signup -> login -> getMe', async () => {
        const signupRes = await request(app).post('/api/auth/signup').send({ email: 'a@example.com', password: 'pass1234', name: 'Alice' });
        expect(signupRes.status).toBe(201);
        expect(signupRes.body.token).toBeDefined();

        const loginRes = await request(app).post('/api/auth/login').send({ email: 'a@example.com', password: 'pass1234' });
        expect(loginRes.status).toBe(200);
        expect(loginRes.body.token).toBeDefined();

        const token = loginRes.body.token;
        const meRes = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
        expect(meRes.status).toBe(200);
        expect(meRes.body.user.email).toBe('a@example.com');
    });

    test('signup duplicate email returns 409', async () => {
        await User.create({ email: 'dup@example.com', password: 'password123', name: 'Dup' });
        const res = await request(app).post('/api/auth/signup').send({ email: 'dup@example.com', password: 'password123', name: 'Dup2' });
        expect(res.status).toBe(409);
    });
});
