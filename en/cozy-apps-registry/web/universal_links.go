package web

import (
	"net/http"
	"net/url"
	"path/filepath"
	"strings"

	"github.com/cozy/cozy-apps-registry/base"
	"github.com/labstack/echo/v4"
)

// universalLinkFolder is the FS folder name containing the universal link files
const universalLinkFolder = "universallink"

func universalLink(c echo.Context) error {
	space, err := getSpaceFromHost(c)
	if err != nil {
		return err
	}
	spacePrefix := space.GetPrefix()
	filename := filepath.Join(universalLinkFolder, c.Param("filename"))

	content, hdrs, err := base.Storage.Get(spacePrefix, filename)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound)
	}

	c.Response().Header().Set(echo.HeaderContentType, hdrs["Content-Type"])
	return c.String(http.StatusOK, content.String())
}

func generateRedirectFromFallbackAndParams(c echo.Context, fallback string) (*url.URL, error) {
	redirect, err := url.Parse(fallback)
	if err != nil {
		return nil, err
	}

	query := redirect.Query()
	for k, v := range c.QueryParams() {
		if k == "fallback" {
			continue
		}
		query.Set(k, v[0])
	}
	redirect.RawQuery = query.Encode()

	return redirect, nil
}

func universalLinkRedirect(c echo.Context) error {
	space, err := getSpaceFromHost(c)
	if err != nil {
		return err
	}
	spacePrefix := space.GetPrefix()
	fallback := c.QueryParam("fallback")

	// The following code has been made to handle an iOS bug during JSON recovery.
	// It should be removed if a fix is found one day.
	// See https://openradar.appspot.com/33893852
	customScheme := c.QueryParam("custom_scheme")
	if customScheme != "" {
		customPath := c.QueryParam("custom_path")
		code := c.QueryParam("code")
		state := c.QueryParam("state")
		accessCode := c.QueryParam("access_code")

		if code != "" {
			customScheme := strings.TrimSuffix(customScheme, "://")

			params := url.Values{}
			params.Add("code", code)
			params.Add("state", state)
			params.Add("access_code", accessCode)

			redirect := url.URL{
				Scheme: customScheme,
				Path:   customPath,
			}
			redirect.RawQuery = params.Encode()

			return c.Redirect(http.StatusSeeOther, redirect.String())
		}
	}

	if fallback == "" {
		return echo.NewHTTPError(http.StatusNotFound)
	}

	redirect, err := generateRedirectFromFallbackAndParams(c, fallback)
	if err != nil {
		return err
	}

	// Disallow redirection for untrusted domains
	spaceTrustedDomains := base.Config.TrustedDomains
	if domains, ok := spaceTrustedDomains[spacePrefix.String()]; ok {
		for _, domain := range domains {
			if strings.Contains(redirect.Host, domain) {
				return c.Redirect(http.StatusSeeOther, fallback)
			}
		}
	}
	return echo.NewHTTPError(http.StatusBadRequest, "This domain is not allowed to be redirected")
}

func webAuthRedirect(c echo.Context) error {
	space, err := getSpaceFromHost(c)
	if err != nil {
		return err
	}
	spacePrefix := space.GetPrefix()
	fallback := c.QueryParam("fallback")

	if fallback == "" {
		return echo.NewHTTPError(http.StatusNotFound)
	}

	redirect, err := generateRedirectFromFallbackAndParams(c, fallback)
	if err != nil {
		return err
	}

	// Disallow redirection for untrusted domains
	spaceTrustedDomains := base.Config.TrustedDomains
	if domains, ok := spaceTrustedDomains[spacePrefix.String()]; ok {
		for _, domain := range domains {
			if strings.Contains(redirect.Host, domain) {
				return c.Redirect(http.StatusSeeOther, redirect.String())
			}
		}
	}
	return echo.NewHTTPError(http.StatusBadRequest, "This domain is not allowed to be redirected")
}
