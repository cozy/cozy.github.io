package errshttp

import (
	"fmt"
)

// TODO: use base.Errors instead
type Error struct {
	c int
	e string
}

func NewError(code int, format string, a ...interface{}) error {
	return &Error{
		c: code,
		e: fmt.Sprintf(format, a...),
	}
}

func (e *Error) Error() string {
	return e.e
}

func (e *Error) StatusCode() int {
	return e.c
}
