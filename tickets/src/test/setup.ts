process.env.JWT_KEY = 'test-jwt-key';
process.env.NODE_ENV = 'test';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from "jsonwebtoken"
declare global {
    var signin: () => string[];
}

let mongo: MongoMemoryServer;

beforeAll(async () => {

    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
});

beforeEach(async () => {
    // clear all mock call counts between tests
    jest.clearAllMocks();

    const collections = await mongoose.connection.db!.collections();
    for (let collection of collections) {
        await collection.deleteMany({});
    }
});

afterAll(async () => {
    if (mongo) await mongo.stop();
    await mongoose.connection.close();
});

global.signin = () => {
    const payload = {
        id: new mongoose.Types.ObjectId().toHexString(),
        email: 'test@test.com',
    };

    const token = jwt.sign(payload, process.env.JWT_KEY!);
    const session = JSON.stringify({ jwt: token });
    const base64 = Buffer.from(session).toString('base64');

    return [`session=${base64}`];
};