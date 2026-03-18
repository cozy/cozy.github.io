package web

import (
	"strings"
)

func ExtractMatrixID(path string) string {
	if !strings.HasPrefix(path, ChatInvitePrefix) {
		return ""
	}
	return strings.TrimPrefix(path, "/chat/")
}

func ExtractDomainFromMatrixID(matrixID string) string {
	if matrixID == "" || !strings.Contains(matrixID, ":") {
		return ""
	}
	parts := strings.Split(matrixID, ":")
	if len(parts) != 2 {
		return ""
	}
	domain := parts[1]
	return domain
}

func GetSignUpURLForDomain(domain string) string {
	switch domain {
	case "twake.app":
		return "sign-up.twake.app"
	case "stg.lin-saas.com":
		return "sign-up.stg.lin-saas.com"
	case "cozy.lin-saas.com":
		return "sign-up.cozy.lin-saas.com"
	case "qa.lin-saas.com":
		return "sign-up.qa.lin-saas.com"
	default:
		return ""
	}
}
