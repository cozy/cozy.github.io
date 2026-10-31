# Build stage: compiles a static binary. It runs on the platform of the build
# machine and cross-compiles for the target one, so multi-arch builds need no
# emulation.
#
# The Go version must stay the one of go.mod and scripts/build-deb.sh, so that
# the image and the Debian package ship the same toolchain: bump all three
# together.
FROM --platform=$BUILDPLATFORM golang:1.27.3-trixie@sha256:c65ecfe613b539ac74c62a4c3b2c27e8f8a6076384c8f27e8a3c0f3be17cc385 AS build

WORKDIR /src

# Downloading the modules before copying the code keeps them cached as long as
# go.mod and go.sum do not change.
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

COPY . .

ARG TARGETOS TARGETARCH
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH \
    go build -trimpath -ldflags="-s -w" -o /out/cozy-registry .

# Runtime stage
FROM gcr.io/distroless/static-debian13:nonroot@sha256:18f4cc26c9ffa7f20a359298be7deadac5c607c8e03a02b8119f1a5fc2f82c99

LABEL org.opencontainers.image.title="cozy-apps-registry" \
      org.opencontainers.image.description="Registry of the applications and connectors that can be installed on a cozy-stack" \
      org.opencontainers.image.source="https://github.com/linagora/cozy-apps-registry" \
      org.opencontainers.image.licenses="AGPL-3.0"

COPY --from=build /out/cozy-registry /usr/local/bin/cozy-registry

# Numeric
USER 65532:65532

# The registry listens on localhost by default, which cannot be reached from
# outside the container.
ENV COZY_REGISTRY_HOST=0.0.0.0
EXPOSE 8080

# The serve command only shuts down gracefully on SIGINT
STOPSIGNAL SIGINT

ENTRYPOINT ["/usr/local/bin/cozy-registry"]
CMD ["serve"]
