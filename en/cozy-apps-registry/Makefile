# # Some interesting links on Makefiles:
# https://danishpraka.sh/2019/12/07/using-makefiles-for-go.html
# https://tech.davis-hansson.com/p/make/

MAKEFLAGS += --warn-undefined-variables
MAKEFLAGS += --no-builtin-rules
SHELL := bash

export REGISTRY_SESSION_PASS=pass

## install: compile the code and installs in binary in $GOPATH/bin
install:
	@go install
.PHONY: install

## run: start the apps registry for development
run: cozy-registry.yml sessionsecret.key
	@go run . serve
.PHONY: run

cozy-registry.yml:
	@cp cozy-registry.example.yml cozy-registry.yml

sessionsecret.key:
	@go run . gen-session-secret --passphrase sessionsecret.key

## lint: enforce a consistent code style and detect code smells
lint: bin/golangci-lint
	@bin/golangci-lint run -E gofmt -E unconvert -E misspell -E whitespace
.PHONY: lint

bin/golangci-lint: Makefile
	@curl -sfL https://install.goreleaser.com/github.com/golangci/golangci-lint.sh | sh -s v1.27.0

## tests: run the tests
tests:
	@go test -p 1 ./...
.PHONY: tests

## clean: clean the generated files and directories
clean:
	@rm -rf bin cozy-registry.yml sessionsecret.key
	@go clean
.PHONY: clean

## help: print this help message
help:
	@echo "Usage:"
	@sed -n 's/^##//p' ${MAKEFILE_LIST} | column -t -s ':' |  sed -e 's/^/ /'
.PHONY: help
