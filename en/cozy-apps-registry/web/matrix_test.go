package web

import (
	"testing"
)

func TestExtractMatrixID(t *testing.T) {
	tests := []struct {
		name    string
		path    string
		want    string
		wantErr bool
	}{
		{
			name:    "Valid chat invite path",
			path:    "/chat/@jdoe:twake.app",
			want:    "@jdoe:twake.app",
			wantErr: false,
		},
		{
			name:    "Invalid path - missing prefix",
			path:    "/@jdoe:twake.app",
			want:    "",
			wantErr: true,
		},
		{
			name:    "Empty path",
			path:    "",
			want:    "",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ExtractMatrixID(tt.path)
			if tt.wantErr && got != "" {
				t.Errorf("ExtractMatrixID() expected error but got result: %v", got)
			}
			if !tt.wantErr && got != tt.want {
				t.Errorf("ExtractMatrixID() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestExtractDomainFromMatrixID(t *testing.T) {
	tests := []struct {
		name     string
		matrixID string
		want     string
		wantErr  bool
	}{
		{
			name:     "Valid Matrix ID",
			matrixID: "@jdoe:twake.app",
			want:     "twake.app",
			wantErr:  false,
		},
		{
			name:     "Invalid Matrix ID - no colon",
			matrixID: "@jdoe",
			want:     "",
			wantErr:  true,
		},
		{
			name:     "Empty Matrix ID",
			matrixID: "",
			want:     "",
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ExtractDomainFromMatrixID(tt.matrixID)
			if tt.wantErr && got != "" {
				t.Errorf("ExtractDomainFromMatrixID() expected error but got result: %v", got)
			}
			if !tt.wantErr && got != tt.want {
				t.Errorf("ExtractDomainFromMatrixID() = %v, want %v", got, tt.want)
			}
		})
	}
}
