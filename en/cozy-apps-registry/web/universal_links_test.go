package web

import (
	"testing"
)

func TestCreateDirectChatURL(t *testing.T) {
	tests := []struct {
		name    string
		baseURL string
		path    string
		want    string
	}{
		{
			name:    "Basic chat invite URL",
			baseURL: "sign-up.twake.app",
			path:    "/chat/@jdoe:twake.app",
			want:    "https://sign-up.twake.app/?path=%2F%23%2Fbridge%2Fweb%2F%23%2Fchat%2F%40jdoe%3Atwake.app&redirect=true&slug=chat",
		},
		{
			name:    "Staging chat invite URL",
			baseURL: "sign-up.stg.lin-saas.com",
			path:    "/chat/@jdoe:stg.lin-saas.com",
			want:    "https://sign-up.stg.lin-saas.com/?path=%2F%23%2Fbridge%2Fweb%2F%23%2Fchat%2F%40jdoe%3Astg.lin-saas.com&redirect=true&slug=chat",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := createDirectChatURL(tt.baseURL, tt.path)
			if got != tt.want {
				t.Errorf("createDirectChatURL() = %v, want %v", got, tt.want)
			}
		})
	}
}
