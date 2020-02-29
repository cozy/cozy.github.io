package cache

import (
	"testing"
	"time"

	"github.com/cozy/cozy-apps-registry/base"
)

func TestLRU(t *testing.T) {
	key := base.Key("toto")
	value := []byte("toto")

	lru := NewLRUCache(32, 100*time.Millisecond)
	lru.Add(key, value)

	if _, ok := lru.Get(key); !ok {
		t.Fatal("should have key", key)
	}

	time.Sleep(101 * time.Millisecond)

	if _, ok := lru.Get(key); ok {
		t.Fatal("should not have key", key)
	}

	lru.Add(key, value)

	if _, ok := lru.Get(key); !ok {
		t.Fatal("should have key", key)
	}
}
