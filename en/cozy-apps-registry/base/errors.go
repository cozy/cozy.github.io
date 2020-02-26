package base

import (
	"errors"
	"fmt"
)

// Error is a struct that allow us to have information about errors.
type Error struct {
	// Code is the HTTP status code to return to the client
	Code int
	// Wrapped should be a sentinel error that can be checked with errors.Is()
	Wrapped error
	// Cause can be used to give more details in logs
	Cause error
}

// Error returns a description of the error that can be sent to the client.
func (e Error) Error() string {
	return e.Wrapped.Error()
}

// Unwrap returns the sentinel error, so that errors.Is and errors.As can be
// used.
func (e Error) Unwrap() error {
	return e.Wrapped
}

// Message returns a log message with details about the cause.
func (e Error) Message() string {
	msg := e.Error()
	if e.Cause != nil {
		msg = fmt.Sprintf("%s: %s", msg, e.Cause)
	}
	return msg
}

var (
	// ErrFileNotFound is returned when trying to read a file that does not
	// exist.
	ErrFileNotFound = errors.New("File not found")
	// ErrTooLarge is returned when the size limit is reached.
	ErrTooLarge = errors.New("File is too large")
	// ErrInternal can be used as a sentinel error for unexpected errors on the
	// server.
	ErrInternal = errors.New("Internal server error")
)

// NewFileNotFoundError returns an Error that wraps the given error, with a Not
// found code.
func NewFileNotFoundError(cause error) error {
	return Error{Code: 404, Wrapped: ErrFileNotFound, Cause: cause}
}

// NewTooLargeError returns an Error that wraps the given error, with a Request
// Entity Too Large code.
func NewTooLargeError(cause error) error {
	return Error{Code: 413, Wrapped: ErrTooLarge, Cause: cause}
}

// NewInternalError returns an Error that wraps the given error, with an
// Internal server error code.
func NewInternalError(cause error) error {
	return Error{Code: 500, Wrapped: ErrInternal, Cause: cause}
}
