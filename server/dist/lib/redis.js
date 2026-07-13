import { Redis } from "ioredis";
// Haversine formula to compute distance between two coordinates in km
function getHaversineDistance(lon1, lat1, lon2, lat2) {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
// In-Memory fallback class replicating Redis key-value & geospatial commands
class InMemoryRedisMock {
    constructor() {
        this.store = new Map();
        this.geoStore = new Map();
    }
    async get(key) {
        const item = this.store.get(key);
        if (!item)
            return null;
        if (item.expiry && Date.now() > item.expiry) {
            this.store.delete(key);
            return null;
        }
        return item.value;
    }
    async set(key, value, mode, duration) {
        let expiry = undefined;
        if (mode === "EX" && duration) {
            expiry = Date.now() + duration * 1000;
        }
        else if (mode === "PX" && duration) {
            expiry = Date.now() + duration;
        }
        this.store.set(key, { value, expiry });
        return "OK";
    }
    async del(key) {
        const deleted = this.store.delete(key) ? 1 : 0;
        this.geoStore.delete(key);
        return deleted;
    }
    async geoadd(key, longitude, latitude, member) {
        if (!this.geoStore.has(key)) {
            this.geoStore.set(key, new Map());
        }
        const keyMap = this.geoStore.get(key);
        const isNew = !keyMap.has(member);
        keyMap.set(member, { lon: Number(longitude), lat: Number(latitude) });
        return isNew ? 1 : 0;
    }
    async georadius(key, longitude, latitude, radius, unit, ...args) {
        const keyMap = this.geoStore.get(key);
        if (!keyMap)
            return [];
        const results = [];
        const targetLon = Number(longitude);
        const targetLat = Number(latitude);
        for (const [member, coords] of keyMap.entries()) {
            let distKm = getHaversineDistance(targetLon, targetLat, coords.lon, coords.lat);
            // Convert distance based on unit requested
            let distance = distKm;
            if (unit === "m")
                distance = distKm * 1000;
            else if (unit === "mi")
                distance = distKm * 0.621371;
            else if (unit === "ft")
                distance = distKm * 3280.84;
            if (distance <= Number(radius)) {
                results.push({ member, distance });
            }
        }
        // Sort by distance (closest first)
        results.sort((a, b) => a.distance - b.distance);
        const withDist = args.includes("WITHDIST");
        if (withDist) {
            return results.map((r) => [r.member, String(r.distance.toFixed(4))]);
        }
        return results.map((r) => r.member);
    }
}
let redisClient;
const redisUrl = process.env.REDIS_URL;
if (redisUrl) {
    console.log("Connecting to Redis at", redisUrl);
    const redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        lazyConnect: true
    });
    redis.connect().then(() => {
        console.log("Redis connected successfully.");
    }).catch((err) => {
        console.warn("Failed to connect to Redis, switching to in-memory fallback. Error:", err.message);
        redisClient = new InMemoryRedisMock();
    });
    redisClient = redis;
}
else {
    console.warn("REDIS_URL not configured. Running with in-memory Redis fallback.");
    redisClient = new InMemoryRedisMock();
}
export default redisClient;
