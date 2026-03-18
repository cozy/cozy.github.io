package web

import "strings"

func GetPlatformFromUserAgent(userAgent string) string {
	userAgentLower := strings.ToLower(userAgent)

	if strings.Contains(userAgentLower, "iphone") ||
		strings.Contains(userAgentLower, "ipad") ||
		strings.Contains(userAgentLower, "ipod") {
		return "ios"
	}

	if strings.Contains(userAgentLower, "android") {
		return "android"
	}

	return "web"
}
