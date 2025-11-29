// models/refreshModel.js
const { client } = require("../services/redisService");

function keyFor(jti) {
  return `refresh:${jti}`;
}

function userSetKey(userId) {
  return `user_refreshs:${userId}`;
}

const RefreshModel = {
  async storeToken(jti, userId, ttlSeconds) {
    const key = keyFor(jti);
    await client.set(key, String(userId), { EX: ttlSeconds });
    // also track in a user-specific set for "revoke all" features
    await client.sAdd(userSetKey(userId), jti);
    await client.expire(userSetKey(userId), ttlSeconds);
  },

  async isValid(jti) {
    const key = keyFor(jti);
    return await client.get(key); // returns userId or null
  },

  async revoke(jti) {
    const key = keyFor(jti);
    const userId = await client.get(key);
    await client.del(key);
    if (userId) {
      await client.sRem(userSetKey(userId), jti);
    }
  },

  async revokeAllForUser(userId) {
    const setKey = userSetKey(userId);
    const jtis = await client.sMembers(setKey);
    if (jtis && jtis.length) {
      const pipeline = client.multi();
      for (const j of jtis) pipeline.del(keyFor(j));
      pipeline.del(setKey);
      await pipeline.exec();
    }
  },
};

module.exports = RefreshModel;
