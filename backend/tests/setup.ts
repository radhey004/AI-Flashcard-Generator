import fs from 'fs';
import os from 'os';
import path from 'path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

jest.setTimeout(300000);

let mongod: MongoMemoryServer | null = null;

beforeAll(async () => {
    // Clear any stale mongodb binary locks that can cause mongodb-memory-server to fail
    try {
        const cacheDir = path.join(os.homedir(), '.cache', 'mongodb-binaries');
        if (fs.existsSync(cacheDir)) {
            // remove lock files only
            const files = fs.readdirSync(cacheDir);
            for (const f of files) {
                if (f.endsWith('.lock')) {
                    try { fs.unlinkSync(path.join(cacheDir, f)); } catch { }
                }
            }
        }
    } catch {
        // ignore cache cleanup errors
    }

    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    process.env.MONGODB_URI = uri;
    process.env.JWT_SECRET = 'test-secret';
    await mongoose.connect(uri, { dbName: 'test' });
});

afterAll(async () => {
    try { await mongoose.disconnect(); } catch { }
    if (mongod) await mongod.stop();
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        try { await collection.deleteMany({}); } catch { }
    }
});
