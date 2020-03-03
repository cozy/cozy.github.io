package registry

import "strings"

// Channel is a way to regroup versions of an application, in function of the
// expected stability.
type Channel int

// There are currently 3 channels: stable, beta, and dev.
const (
	Stable Channel = iota + 1
	Beta
	Dev
)

const (
	devSuffix  = "-dev."
	betaSuffix = "-beta."
)

// GetVersionChannel returns the channel in which a version is published.
func GetVersionChannel(version string) Channel {
	if strings.Contains(version, devSuffix) {
		return Dev
	}
	if strings.Contains(version, betaSuffix) {
		return Beta
	}
	return Stable
}

func versionMatch(ver1, ver2 string) bool {
	v1 := splitVersion(ver1)
	v2 := splitVersion(ver2)
	return v1[0] == v2[0] && v1[1] == v2[1] && v1[2] == v2[2]
}

func splitVersion(version string) (v [3]string) {
	switch GetVersionChannel(version) {
	case Beta:
		version = version[:strings.Index(version, betaSuffix)]
	case Dev:
		version = version[:strings.Index(version, devSuffix)]
	}
	s := strings.SplitN(version, ".", 3)
	if len(s) == 3 {
		v[0] = s[0]
		v[1] = s[1]
		v[2] = s[2]
	}
	return
}

// StrToChannel returns the channel from a string.
func StrToChannel(channel string) (Channel, error) {
	switch channel {
	case "stable":
		return Stable, nil
	case "beta":
		return Beta, nil
	case "dev":
		return Dev, nil
	default:
		return Stable, ErrChannelInvalid
	}
}

// ChannelToStr returns a string that describes the channel.
func ChannelToStr(channel Channel) string {
	switch channel {
	case Stable:
		return "stable"
	case Beta:
		return "beta"
	case Dev:
		return "dev"
	}
	panic("Unknown channel")
}
