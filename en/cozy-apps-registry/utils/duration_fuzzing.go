package utils

import (
	"math/rand"
	"time"
)

// DurationFuzzing returns a duration that is near the given duration, but
// randomized to avoid patterns like several cache entries that expires at the
// same time.
func DurationFuzzing(d time.Duration, variation float64) time.Duration {
	if variation > 1.0 || variation < 0.0 {
		panic("DurationRandomized: variation should be between 0.0 and 1.0")
	}
	return time.Duration(float64(d) * (1.0 + variation*(2.0*rand.Float64()-1.0)))
}
