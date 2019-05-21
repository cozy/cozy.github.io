package cache

import (
	"time"

	"github.com/cozy/cozy-apps-registry/utils"
	"github.com/go-redis/redis"
)

// Cache is an redis cache.
type RedisCache struct {
	TTL   time.Duration
	cache redis.UniversalClient
}

// New creates a new Cache.
func NewRedisCache(ttl time.Duration, client redis.UniversalClient) *RedisCache {
	return &RedisCache{
		TTL:   ttl,
		cache: client,
	}
}

// Add adds a value to the cache.
func (c *RedisCache) Add(key Key, value Value) {
	ttl := utils.DurationFuzzing(c.TTL, 0.2)
	c.cache.Set(key.String(), []byte(value), ttl)
}

// Get looks up a key's value from the cache.
func (c *RedisCache) Get(key Key) (value Value, ok bool) {
	if val, err := c.cache.Get(key.String()).Result(); err == nil {
		return []byte(val), true
	}
	return nil, false
}

// MGet looks up several keys at once from the cache.
func (c *RedisCache) MGet(keys []Key) []interface{} {
	strs := make([]string, len(keys))
	for i, k := range keys {
		strs[i] = k.String()
	}
	if values, err := c.cache.MGet(strs...).Result(); err == nil {
		for i, v := range values {
			if s, ok := v.(string); ok {
				if s == "" {
					values[i] = nil
				} else {
					values[i] = []byte(s)
				}
			}
		}
		return values
	}
	return make([]interface{}, len(keys))
}

// Remove removes the provided key from the cache.
func (c *RedisCache) Remove(key Key) {
	c.cache.Del(key.String())
}

var _ Cache = (*RedisCache)(nil)
