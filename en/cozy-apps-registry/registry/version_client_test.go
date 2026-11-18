package registry

import (
	"net"
	"net/http"
	"net/http/httptest"
	"net/netip"
	"strings"
	"sync/atomic"
	"testing"

	"github.com/cozy/cozy-apps-registry/base"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// trustTarballNetworks sets the trusted networks for the duration of a test.
func trustTarballNetworks(t *testing.T, cidrs ...string) {
	t.Helper()
	previous := base.Config.TrustedTarballNetworks
	var networks []netip.Prefix
	for _, cidr := range cidrs {
		networks = append(networks, netip.MustParsePrefix(cidr))
	}
	base.Config.TrustedTarballNetworks = networks
	t.Cleanup(func() { base.Config.TrustedTarballNetworks = previous })
}

func TestCheckVersionAddress(t *testing.T) {
	trustTarballNetworks(t, "10.1.2.0/24")

	forbidden := []string{
		"0.0.0.0:80",
		"10.1.3.3:80",
		"100.64.0.1:80",
		"100.100.100.200:80",
		"127.0.0.1:80",
		"169.254.169.254:80",
		"172.16.0.1:80",
		"192.168.1.1:80",
		"224.0.0.1:80",
		"255.255.255.255:80",
		"[::]:80",
		"[::1]:80",
		"[::ffff:127.0.0.1]:80",
		"[64:ff9b::7f00:1]:80",
		"[64:ff9b::a9fe:a9fe]:80",
		"[fd00:ec2::254]:80",
		"[fe80::1%eth0]:80",
		"[ff02::1]:80",
		"not an address",
	}
	for _, address := range forbidden {
		assert.ErrorIs(t, checkVersionAddress("tcp", address, nil), errForbiddenAddress, address)
	}

	allowed := []string{
		"1.1.1.1:443",
		"10.1.2.3:80",
		"[::ffff:10.1.2.3]:80",
		"[::ffff:8.8.8.8]:80",
		"[64:ff9b::8c52:7903]:443",
		"[2606:4700:4700::1111]:443",
	}
	for _, address := range allowed {
		assert.NoError(t, checkVersionAddress("tcp", address, nil), address)
	}
}

// A redirection must not be a way around the check: the first server is allowed,
// and sends the download to another address that is not. Checking the URL before
// the request would not see it.
func TestDownloadVersionRefusesRedirectionToForbiddenAddress(t *testing.T) {
	trustTarballNetworks(t, "127.0.0.1/32")

	listener, err := net.Listen("tcp", "127.0.0.2:0")
	if err != nil {
		t.Skipf("cannot listen on a second loopback address: %s", err)
	}
	var hits atomic.Int32
	internal := httptest.NewUnstartedServer(http.HandlerFunc(func(_ http.ResponseWriter, _ *http.Request) {
		hits.Add(1)
	}))
	require.NoError(t, internal.Listener.Close())
	internal.Listener = listener
	internal.Start()
	t.Cleanup(internal.Close)

	redirector := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, internal.URL+"/secret", http.StatusFound)
	}))
	t.Cleanup(redirector.Close)

	_, _, err = DownloadVersion(&VersionOptions{
		Version: "1.0.0",
		URL:     redirector.URL,
		Sha256:  strings.Repeat("0", 64),
	})
	require.Error(t, err)
	assert.NotContains(t, err.Error(), internal.URL)
	assert.Zero(t, hits.Load(), "the internal service was reached")
}
