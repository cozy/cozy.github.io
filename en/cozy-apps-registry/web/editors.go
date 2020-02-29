package web

import (
	"net/http"

	"github.com/cozy/cozy-apps-registry/auth"
	"github.com/labstack/echo/v4"
)

func getEditor(c echo.Context) error {
	editorName := c.Param("editor")
	editor, err := auth.Editors.GetEditor(editorName)
	if err != nil {
		return err
	}

	if cacheControl(c, "", fiveMinute) {
		return c.NoContent(http.StatusNotModified)
	}

	return writeJSON(c, editor)
}

func getEditorsList(c echo.Context) error {
	editors, err := auth.Editors.AllEditors()
	if err != nil {
		return err
	}
	return writeJSON(c, editors)
}
