import Redis from 'ioredis';

let redis = null;
let isRedisAvailable = false;

// Initialize Redis with fallback
const initializeRedis = () => {
    try {
        redis = new Redis({
            host: process.env.REDIS_HOST || '127.0.0.1',
            port: process.env.REDIS_PORT || 6379,
            maxRetriesPerRequest: 1,
            retryStrategy: (times) => {
                if (times > 3) {
                    isRedisAvailable = false;
                    return null; // stop retrying
                }
                return Math.min(times * 50, 2000); // exponential backoff
            },
            lazyConnect: true // Don't connect immediately
        });

        // Handle connection events
        redis.on('connect', () => {
            console.log('Redis connected successfully');
            isRedisAvailable = true;
        });

        redis.on('error', (error) => {
            console.warn('Redis connection error:', error);
            isRedisAvailable = false;
        });

    } catch (error) {
        console.error('Redis initialization error:', error);
        isRedisAvailable = false;
    }
};

// Get from cache with fallback
const getFromCache = async (key) => {
    if (!isRedisAvailable) return null;
    
    try {
        return await redis.get(key);
    } catch (error) {
        console.warn('Redis get error:', error);
        return null;
    }
};

// Set in cache with fallback
const setInCache = async (key, value, ttl) => {
    if (!isRedisAvailable) return false;
    
    try {
        await redis.setex(key, ttl, value);
        return true;
    } catch (error) {
        console.warn('Redis set error:', error);
        return false;
    }
};

// In-memory fallback cache
const memoryCache = new Map();

// Memory cache with TTL
const setInMemoryCache = (key, value, ttl) => {
    const expiresAt = Date.now() + (ttl * 1000);
    memoryCache.set(key, { value, expiresAt });
    
    // Clean up after TTL
    setTimeout(() => {
        memoryCache.delete(key);
    }, ttl * 1000);
};

const getFromMemoryCache = (key) => {
    const item = memoryCache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
        memoryCache.delete(key);
        return null;
    }
    
    return item.value;
};

// Unified cache interface
export const cacheManager = {
    async get(key) {
        // Try Redis first
        if (isRedisAvailable) {
            const redisValue = await getFromCache(key);
            if (redisValue) return redisValue;
        }
        
        // Fallback to memory cache
        return getFromMemoryCache(key);
    },
    
    async set(key, value, ttl = 3600) {
        // Try Redis first
        if (isRedisAvailable) {
            await setInCache(key, value, ttl);
        }
        
        // Always set in memory cache as backup
        setInMemoryCache(key, value, ttl);
    }
};

// Initialize Redis on module load
initializeRedis();

export default cacheManager;
