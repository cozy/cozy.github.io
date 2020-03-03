package registry

import (
	"encoding/json"
	"strings"
)

// Label is a score given to apps to show the trust a user can have in it.
type Label int

// The label scores go from A to F.
const (
	LabelA = iota
	LabelB
	LabelC
	LabelD
	LabelE
	LabelF
)

// "DUC" stands for DataUserCommitment
const (
	DUCUserCiphered = "user_ciphered"
	DUCUserReserved = "user_reserved"
	DUCNone         = "none"
)

// "DUCBy" stands for DataUserCommitmentBy
const (
	DUCByCozy   = "cozy"
	DUCByEditor = "editor"
	DUCByNone   = "none"
)

var (
	validDUCValues   = []string{DUCUserCiphered, DUCUserReserved, DUCNone}
	validDUCByValues = []string{DUCByCozy, DUCByEditor, DUCByNone}
)

func calculateAppLabel(app *App, ver *Version) Label {
	hasRemoteDoctypes := false
	if ver != nil {
		var man struct {
			Permissions map[string]struct {
				Remote bool `json:"remote"`
			} `json:"permissions"`
		}
		err := json.Unmarshal(ver.Manifest, &man)
		if err == nil {
			for _, p := range man.Permissions {
				if p.Remote {
					hasRemoteDoctypes = true
					break
				}
			}
		}
	}

	duc, ducBy := app.DataUsageCommitment, app.DataUsageCommitmentBy
	switch {
	case !hasRemoteDoctypes && duc == DUCUserCiphered:
		return LabelA
	case !hasRemoteDoctypes && duc == DUCUserReserved:
		if ducBy == DUCByCozy {
			return LabelB
		} else if ducBy == DUCByEditor {
			return LabelC
		}
	case hasRemoteDoctypes && (duc == DUCUserCiphered || duc == DUCUserReserved):
		if ducBy == DUCByCozy {
			return LabelD
		} else if ducBy == DUCByEditor {
			return LabelE
		}
	}
	return LabelF
}

func defaultDataUserCommitment(app *App, opts *AppOptions) (duc, ducBy string) {
	if opts != nil {
		if opts.DataUsageCommitment != nil {
			duc = *opts.DataUsageCommitment
		}
		if opts.DataUsageCommitmentBy != nil {
			ducBy = *opts.DataUsageCommitmentBy
		}
	} else {
		duc, ducBy = app.DataUsageCommitment, app.DataUsageCommitmentBy
	}
	if duc == "" || ducBy == "" {
		if strings.ToLower(app.Editor) == "cozy" {
			duc, ducBy = DUCUserReserved, DUCByCozy
		} else {
			duc, ducBy = DUCNone, DUCByNone
		}
	}
	return
}
