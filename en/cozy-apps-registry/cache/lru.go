/*
Copyright 2013 Google Inc.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
     http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// Package cache implements an LRU cache and a redis cache.
package cache

import (
	"container/list"
	"sync"
	"time"

	"github.com/cozy/cozy-apps-registry/base"
)

type entry struct {
	key   base.Key
	value base.Value
	date  time.Time
}

// LRUCache is an LRU cache.
type LRUCache struct {
	// MaxEntries is the maximum number of cache entries before
	// an item is evicted. Zero means no limit.
	MaxEntries int
	// TTL is the time-to-live of each entries in the cache.
	TTL time.Duration

	mu    sync.Mutex
	ll    *list.List
	cache map[base.Key]*list.Element
}

// New creates a new Cache.
// If maxEntries is zero, the cache has no limit and it's assumed
// that eviction is done by the caller.
func NewLRUCache(maxEntries int, ttl time.Duration) *LRUCache {
	return &LRUCache{
		MaxEntries: maxEntries,
		TTL:        ttl,
		ll:         list.New(),
		cache:      make(map[base.Key]*list.Element),
	}
}

// Add adds a value to the cache.
func (c *LRUCache) Add(key base.Key, value base.Value) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if ele, hit := c.cache[key]; hit {
		c.ll.MoveToFront(ele)
		ele.Value.(*entry).date = time.Now()
		ele.Value.(*entry).value = value
	} else {
		ele := c.ll.PushFront(&entry{key, value, time.Now()})
		c.cache[key] = ele
		if c.MaxEntries != 0 && c.ll.Len() > c.MaxEntries {
			c.removeOldest()
		}
	}
}

// Get looks up a key's value from the cache.
func (c *LRUCache) Get(key base.Key) (value base.Value, ok bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if ele, hit := c.cache[key]; hit {
		if c.TTL == 0 || time.Since(ele.Value.(*entry).date) <= c.TTL {
			c.ll.MoveToFront(ele)
			return ele.Value.(*entry).value, true
		}
		c.removeElement(ele)
	}
	return
}

// MGet looks up several keys at once from the cache.
func (c *LRUCache) MGet(keys []base.Key) []interface{} {
	values := make([]interface{}, len(keys))
	for i, key := range keys {
		if val, ok := c.Get(key); ok {
			values[i] = []byte(val)
		}
	}
	return values
}

// Remove removes the provided key from the cache.
func (c *LRUCache) Remove(key base.Key) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if ele, hit := c.cache[key]; hit {
		c.removeElement(ele)
	}
}

func (c *LRUCache) removeOldest() {
	if ele := c.ll.Back(); ele != nil {
		c.removeElement(ele)
	}
}

func (c *LRUCache) removeElement(e *list.Element) {
	c.ll.Remove(e)
	kv := e.Value.(*entry)
	delete(c.cache, kv.key)
}

var _ base.Cache = (*LRUCache)(nil)
