import { Redis } from 'ioredis';
import dotenv from 'dotenv';

const env = process.env.NODE_ENV || 'local'

dotenv.config({ path: `.env.${env}` });

// Use REDIS_URI from environment variables or fallback to default localhost
const redisUri = process.env.AIVEN_SERVICE_URI || "";

// console.log("redisUri: ", redisUri)

const redisConnection = new Redis(redisUri, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false, // Disable ready check if you're using Redis Sentinel or Cluster
    // Add other options as needed
});

// Optional: Add error handling
redisConnection.on('error', (err) => {
    console.error('Redis error:', err);
});

redisConnection.on('connect', () => {
    console.log('Connected to Redis');
});

export default redisConnection;