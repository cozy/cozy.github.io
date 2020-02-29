package base

import "time"

// DefaultCacheTTL is the default duration for caching items before they are
// expired and removed from the cache.
const DefaultCacheTTL = 5 * time.Minute

// Cache is an interface for a key-value caching service.
type Cache interface {
	Add(Key, Value)
	Get(Key) (Value, bool)
	MGet([]Key) []interface{}
	Remove(Key)
}

type (
	// Key is a type used for the keys in the cache.
	Key string
	// Value is the type used for the values in the cache.
	Value []byte
)

// String returns the key as a string.
func (k Key) String() string {
	return string(k)
}
