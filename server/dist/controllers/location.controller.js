import redisClient from "../lib/redis.js";
const GEO_KEY = "location_lobby_geo";
const DETAILS_PREFIX = "location_lobby_details:";
/**
 * Update user location and matchmaking preferences in Redis
 */
export const updateLobby = async (req, res) => {
    try {
        if (!req.session.user?.id) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const userId = String(req.session.user.id);
        const userName = req.session.user.name;
        const { lat, lon, timeControl, side } = req.body;
        if (lat === undefined || lon === undefined) {
            res.status(400).json({ message: "Latitude and Longitude are required" });
            return;
        }
        // 1. Add user to geospatial index
        await redisClient.geoadd(GEO_KEY, Number(lon), Number(lat), userId);
        // 2. Store details as a JSON string with 120-second expiration (TTL)
        const details = {
            id: req.session.user.id,
            name: userName,
            timeControl: timeControl || "10+0",
            side: side || "random",
            lat,
            lon,
            updatedAt: Date.now()
        };
        // EX 120 sets TTL to 2 minutes
        await redisClient.set(`${DETAILS_PREFIX}${userId}`, JSON.stringify(details), "EX", 120);
        res.status(200).json({ message: "Lobby position updated" });
    }
    catch (err) {
        console.error("updateLobby error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
/**
 * Get active players in the geolocation pool within the specified radius
 */
export const getNearby = async (req, res) => {
    try {
        if (!req.session.user?.id) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const userId = String(req.session.user.id);
        const { lat, lon, radius = 5 } = req.query; // Radius in km (default 5km)
        if (lat === undefined || lon === undefined) {
            res.status(400).json({ message: "Latitude and Longitude are required" });
            return;
        }
        // Find users within geospatial radius (returns [ [userId, distance], ... ] if WITHDIST)
        const nearbyMembers = await redisClient.georadius(GEO_KEY, Number(lon), Number(lat), Number(radius), "km", "WITHDIST");
        const players = [];
        for (const item of nearbyMembers) {
            const memberId = Array.isArray(item) ? item[0] : item;
            const distance = Array.isArray(item) ? item[1] : "0";
            // Exclude current user from scan list
            if (memberId === userId)
                continue;
            const detailStr = await redisClient.get(`${DETAILS_PREFIX}${memberId}`);
            if (detailStr) {
                const details = JSON.parse(detailStr);
                players.push({
                    ...details,
                    distance: Number(distance)
                });
            }
        }
        res.status(200).json({ players });
    }
    catch (err) {
        console.error("getNearby error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
/**
 * Remove user from matchmaking pool
 */
export const removeLobby = async (req, res) => {
    try {
        if (!req.session.user?.id) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const userId = String(req.session.user.id);
        // Delete keys and let geospatial clean up
        await redisClient.del(`${DETAILS_PREFIX}${userId}`);
        res.status(200).json({ message: "Left location lobby" });
    }
    catch (err) {
        console.error("removeLobby error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
