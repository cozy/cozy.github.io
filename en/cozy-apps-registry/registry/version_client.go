package registry

import (
	"errors"
	"net"
	"net/http"
	"net/netip"
	"syscall"
	"time"

	"github.com/cozy/cozy-apps-registry/base"
)

// errForbiddenAddress is returned when a download would connect to an address
// that is not on the public internet.
var errForbiddenAddress = errors.New("forbidden address")

var (
	cgnat = netip.MustParsePrefix("100.64.0.0/10")
	// The gateway of a NAT64 network connects to the IPv4 address held in the
	// last 4 bytes of an address of this prefix.
	nat64 = netip.MustParsePrefix("64:ff9b::/96")
)

var versionClient = http.Client{
	Timeout:   30 * time.Second,
	Transport: newVersionTransport(),
}

// newVersionTransport returns a transport that checks the addresses in the
// dialer, as this is the only place that sees the IP really connected to: it
// covers every redirection, and a host that resolves to another address after a
// first check. A proxy would connect in our place, so this transport does not
// use any.
func newVersionTransport() *http.Transport {
	dialer := &net.Dialer{
		Timeout:   30 * time.Second,
		KeepAlive: 30 * time.Second,
		Control:   checkVersionAddress,
	}
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.Proxy = nil
	transport.DialContext = dialer.DialContext
	return transport
}

// checkVersionAddress is called with the resolved address, before connecting.
func checkVersionAddress(_, address string, _ syscall.RawConn) error {
	addrPort, err := netip.ParseAddrPort(address)
	if err != nil {
		return errForbiddenAddress
	}
	addr := addrPort.Addr().Unmap()
	if nat64.Contains(addr) {
		raw := addr.As16()
		addr = netip.AddrFrom4([4]byte(raw[12:]))
	}
	for _, network := range base.Config.TrustedTarballNetworks {
		if network.Contains(addr) {
			return nil
		}
	}
	if !addr.IsGlobalUnicast() || addr.IsPrivate() || cgnat.Contains(addr) {
		return errForbiddenAddress
	}
	return nil
}
