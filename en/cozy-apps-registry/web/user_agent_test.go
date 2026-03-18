package web

import "testing"

func TestGetPlatformFromUserAgent(t *testing.T) {
	tests := []struct {
		name      string
		userAgent string
		want      string
	}{
		// iOS
		{
			name:      "iPhone",
			userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1",
			want:      "ios",
		},
		{
			name:      "iPad",
			userAgent: "Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
			want:      "ios",
		},
		{
			name:      "iPod",
			userAgent: "Mozilla/5.0 (iPod touch; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1",
			want:      "ios",
		},
		// Android
		{
			name:      "Android phone",
			userAgent: "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36",
			want:      "android",
		},
		{
			name:      "Android tablet",
			userAgent: "Mozilla/5.0 (Linux; Android 10; SM-T510) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.105 Safari/537.36",
			want:      "android",
		},
		// Web
		{
			name:      "Chrome on Windows",
			userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
			want:      "web",
		},
		{
			name:      "Firefox on macOS",
			userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0",
			want:      "web",
		},
		{
			name:      "Safari on macOS",
			userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
			want:      "web",
		},
		{
			name:      "Edge on Windows",
			userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59",
			want:      "web",
		},
		{
			name:      "Chrome on Linux",
			userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
			want:      "web",
		},
		// Edge cases
		{
			name:      "Empty user agent",
			userAgent: "",
			want:      "web",
		},
		{
			name:      "Unknown user agent",
			userAgent: "SomeBot/1.0",
			want:      "web",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := GetPlatformFromUserAgent(tt.userAgent)
			if got != tt.want {
				t.Errorf("GetPlatformFromUserAgent() = %v, want %v", got, tt.want)
			}
		})
	}
}
