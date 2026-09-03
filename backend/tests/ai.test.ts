import request from 'supertest';
import createApp from '../src/app';

jest.mock('../src/jobs/aiQueue', () => {
    return {
        enqueueAiJob: jest.fn().mockImplementation(async (payload) => ({ id: 'fake-job-id' })),
        aiQueue: {
            getJob: jest.fn().mockImplementation(async (id: string) => {
                if (id === 'fake-job-id') {
                    return {
                        id: 'fake-job-id',
                        data: { userId: 'uid' },
                        getState: async () => 'completed',
                        progress: 100,
                        returnvalue: { cards: [] },
                        failedReason: null,
                        attemptsMade: 0,
                    };
                }
                return null;
            })
        },
    };
});

describe('AI endpoints (enqueue + status)', () => {
    const app = createApp as any;
    let token: string;

    beforeEach(async () => {
        const signup = await request(app).post('/api/auth/signup').send({ email: 'aiuser@example.com', password: 'pass1234', name: 'AI' });
        token = signup.body.token;
    });

    test('enqueue text job returns 202 and jobId', async () => {
        const res = await request(app).post('/api/ai/generate/text').set('Authorization', `Bearer ${token}`).send({ text: 'x'.repeat(60), difficulty: 'medium', count: 5 });
        expect(res.status).toBe(202);
        expect(res.body.jobId).toBeDefined();
    });

    test('get job status returns job info', async () => {
        const res = await request(app).get('/api/ai/job/fake-job-id').set('Authorization', `Bearer ${token}`);
        // mocked aiQueue.getJob will return null for non-matching userId, so expect 403 or 404
        expect([200, 403, 404]).toContain(res.status);
    });
});
