package cache

import (
	"math/rand"
	"time"

	"github.com/cozy/cozy-apps-registry/base"
	"github.com/go-redis/redis/v7"
)

// RedisCache is a cache based on Redis.
type RedisCache struct {
	TTL   time.Duration
	cache redis.UniversalClient
}

// NewRedisCache creates a new cache.
func NewRedisCache(ttl time.Duration, client redis.UniversalClient) *RedisCache {
	return &RedisCache{
		TTL:   ttl,
		cache: client,
	}
}

// Add adds a value to the cache.
func (c *RedisCache) Add(key base.Key, value base.Value) {
	ttl := DurationFuzzing(c.TTL, 0.2)
	c.cache.Set(key.String(), []byte(value), ttl)
}

// DurationFuzzing returns a duration that is near the given duration, but
// randomized to avoid patterns like several cache entries that expires at the
// same time.
func DurationFuzzing(d time.Duration, variation float64) time.Duration {
	if variation > 1.0 || variation < 0.0 {
		panic("DurationRandomized: variation should be between 0.0 and 1.0")
	}
	return time.Duration(float64(d) * (1.0 + variation*(2.0*rand.Float64()-1.0)))
}

// Get looks up a key's value from the cache.
func (c *RedisCache) Get(key base.Key) (value base.Value, ok bool) {
	if val, err := c.cache.Get(key.String()).Result(); err == nil {
		return []byte(val), true
	}
	return nil, false
}

// MGet looks up several keys at once from the cache.
func (c *RedisCache) MGet(keys []base.Key) []interface{} {
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
func (c *RedisCache) Remove(key base.Key) {
	c.cache.Del(key.String())
}

var _ base.Cache = (*RedisCache)(nil)
