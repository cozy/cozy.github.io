# Cozy-stack installation

Cozycloud provides precompiled packages for the last two versions of Debian and Ubuntu LTS on amd64 architecture. Currently, precompiled packages are provided for

- Debian 11 Bullseye
- Debian 12 Bookworm
- Ubuntu 20.04 Focal Fossa
- Ubuntu 22.04 Jammy Jellyfish
- Ubuntu 24.04 Noble Numbat

Precompiled packages install precompiled binaries of cozy-stack as well as configuration and system glue (log management, systemd unit for autostart at boot, ...)
If you use one of the supported distribution, using [precompiled package](./package.md) is the preferred way to go.

There are also community provided precompiled packages for Arch Linux. Find out more on [Arch linux wiki](https://wiki.archlinux.org/title/Cozy).

If we don't provide precompiled package for your distribution or architecture and you can't find community precompiled packages, you can manually compile, install and configure cozy-stack [from sources](./sources.md).

- [Install from precompiled deb package for Debian and Ubuntu](./package.md)
- [Install from Arch Linux precompiled community packages](https://wiki.archlinux.org/title/Cozy)
- [Install from sources on other distribution or architecture](./sources.md)
