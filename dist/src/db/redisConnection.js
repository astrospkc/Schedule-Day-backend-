import { Redis } from 'ioredis';
const redisConnection = new Redis({
    host: "127.0.0.1", // or your Redis host
    port: 6379, // default Redis port
    maxRetriesPerRequest: null
});
export default redisConnection;
//# sourceMappingURL=redisConnection.js.map