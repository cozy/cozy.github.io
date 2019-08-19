package cache

import (
	"testing"
	"time"

	"github.com/go-redis/redis/v7"
)

func TestRedis(t *testing.T) {
	key := Key("toto")
	value := []byte("toto")

	testClient := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	})
	redisCache := NewRedisCache(100*time.Millisecond, testClient)
	redisCache.Add(key, value)

	if _, ok := redisCache.Get(key); !ok {
		t.Fatal("should have key", key)
	}

	time.Sleep(121 * time.Millisecond)

	if _, ok := redisCache.Get(key); ok {
		t.Fatal("should not have key", key)
	}

	redisCache.Add(key, value)

	if _, ok := redisCache.Get(key); !ok {
		t.Fatal("should have key", key)
	}
}
