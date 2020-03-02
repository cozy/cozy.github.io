package base

import "time"

// DefaultCacheTTL is the default duration for caching items before they are
// expired and removed from the cache.
const DefaultCacheTTL = 5 * time.Minute

// Cache is an interface for a key-value caching service.
type Cache interface {
	// Status check if the cache is up, and returns an error if it is not.
	Status() error
	// Add adds a value to the cache.
	Add(Key, Value)
	// Get looks up a key's value from the cache.
	Get(Key) (Value, bool)
	// MGet looks up several keys at once from the cache.
	MGet([]Key) []interface{}
	// Remove removes the provided key from the cache.
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
