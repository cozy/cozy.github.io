#!/bin/bash

yell() { echo "$0: $*" >&2; }
die() { yell "$*"; exit 1; }
try() { "$@" || die "cannot $*"; }

PACKAGE_NAME="cozy-registry"
export GOROOT="$(pwd)/go/go"
export GOPATH="$(pwd)/go"
export PATH="${GOPATH}/bin:$GOROOT/bin:${PATH}"
export DH_GOPKG="github.com/cozy/cozy-apps-registry"
export GO111MODULE=on
export GOPROXY="https://proxy.golang.org"
export DEBFULLNAME="Cozycloud Packaging Team"
export DEBEMAIL="debian@cozycloud.cc"
[ -z "${UPSTREAM_VERSION+x}" ] && UPSTREAM_VERSION="3.0"
[ -z "${WITH_TRANSIFEX+x}" ] && WITH_TRANSIFEX=true
GOVERSION="1.22.1"
TODAY=$(date +%Y%m%d%H%M%S)

# If .transifexrc file exists AND contains a password different from 'None' then keep going
# Return 2 if .transifexrc file doesn't exists
# Return 1 if password is None
if [ "${WITH_TRANSIFEX}" = "true" ]; then
  TRANSIFEX_FILE="$HOME/.transifexrc"
  if [ -f ${TRANSIFEX_FILE} ]; then
    if [ $(grep -q "None" ${TRANSIFEX_FILE};echo $?) == 0 ]; then
      echo "Transifex password is wrong"
      exit 2
    fi
  else
    die "Transifex config $HOME/.transifexrc is missing"
  fi
fi

# Get root privilege
if [ "$(id -u)" = 0 ]; then
    SUDO=env
else
    SUDO=sudo
fi

goinstall(){
  mkdir -p go
  pushd go
  echo "Downloading GOLANG ${GOVERSION}"
  [ -f "go.tar.gz" ] || try wget --quiet https://dl.google.com/go/go${GOVERSION}.linux-amd64.tar.gz -O go.tar.gz
  echo "Extracting GOLANG ${GOVERSION}"
  try tar -xf go.tar.gz
  rm -rf go.tar.gz
  popd
}

getpackage(){
  goinstall
  try go install
  try go clean -modcache
  echo "Build done"
}

info(){
cat >&2 <<EOF
Epoch: ${EPOCH}
--Other info--
   Old Hash: ${LAST_GIT_HASH}
   Current Branch Hash: ${CURRENT_GIT_HASH}
   Current Date: ${TODAY}
   Current Package Version: ${UPSTREAM_VERSION}
   Last Upstream Version: ${LAST_UPSTREAM_VERSION}
EOF
}

updatechangelog() {
  [ -z "${DISTRO+x}" ] && DISTRO=$(lsb_release -s -c)
  CURRENT_GIT_HASH=$(git log -1 --oneline | awk '{ print $1 }')

  if [ -e debian/changelog ]; then
    PACKAGE_SOURCE_NAME=$(dpkg-parsechangelog  --show-field Source )
    LAST_UPSTREAM_VERSION=$(dpkg-parsechangelog | sed '/^Version/!d; s/.*[0-9]://; s/~.*//')
    LAST_GIT_HASH=$(dpkg-parsechangelog --offset 0 --count 1 | egrep  -m 1 '\[*\]' | awk '{print $2}' | sed 's/\[//;s/\]//')
    EPOCH=$(dpkg-parsechangelog | sed '/^Version/!d; s/.* //; s/:.*//;')

    dpkg --compare-versions "${UPSTREAM_VERSION}" lt "${LAST_UPSTREAM_VERSION}" && echo "No downgrade allowed here" && exit 1
    dch --no-auto-nmu -b --force-distribution -D ${DISTRO} -v ${EPOCH}:${UPSTREAM_VERSION}~${TODAY}~${DISTRO} --vendor cozy "[${CURRENT_GIT_HASH}] New ${PACKAGE_NAME} build"
  else
    dch --create --package ${PACKAGE_NAME} --no-auto-nmu --force-distribution -D ${DISTRO} -v 1:${UPSTREAM_VERSION}~${TODAY}~${DISTRO} --vendor cozy "[${CURRENT_GIT_HASH}] ${PACKAGE_NAME} Build"
  fi

  # Add git changes if any
  if [ ! -z "${LAST_GIT_HASH}" ];then
    if [ "${LAST_GIT_HASH}" != "${CURRENT_GIT_HASH}" ]; then
        echo "Appending changes between ${LAST_GIT_HASH} and ${CURRENT_GIT_HASH}"
        dch -a ">> Changes since last upload (${LAST_GIT_HASH}):"
        if [ -d .git ]; then
            git log --oneline ${LAST_GIT_HASH}..${CURRENT_GIT_HASH} | sed 's,^,[,; s, ,] ,; s,Version,version,' > .gitout
            while read line; do
                dch -a "$line"
            done < .gitout
            rm -f .gitout
        fi
    fi
fi
}

help () {
    cat >&2 <<EOF
Usage: $0 [-s]

   Options :
   -t|--type binary
        Only build binary


Examples: $0 -t


EOF
}

eval set -- "$(getopt -o ht: --l help,type: -- "$@")" || { help; exit 1; }
while :; do
    case $1 in
    -h|--help)
        help
        exit 0
        ;;
    -t|--type)
        TYPE="$2"
        shift 2
        ;;
    --)
        shift
        break
        ;;
    *)
        help
        exit 1
        ;;
    esac
done

[ -z "$DEBUILD_FLAGS" ] && DEBUILD_FLAGS="-us -uc -i -I.git "

# for checking out git
if ! which git 1>/dev/null; then
    echo "Missing git-core, marking for installation"
    try ${SUDO} apt-get -y install git-core --no-install-recommends
fi

# make sure we have debuild no matter what
if ! which debuild 1>/dev/null; then
    echo "Missing debuild, marking for installation"
    try ${SUDO} apt-get update && ${SUDO} apt-get -y install devscripts --no-install-recommends
fi

# Get Package
getpackage

# update changelog if there is something to update
echo "Updating Changelog"
updatechangelog ${UPSTREAM_VERSION}

# Print useful information
info

if [ "$TYPE" == "binary" ]; then
    echo "Building binary"
    DEBUILD_FLAGS="-e DEBIAN_VERSION -e DH_GOPKG -e GOROOT -e GOPATH -e PATH ${DEBUILD_FLAGS} -b"
    #Make sure we have the package for get-build-deps
    if ! command -v dpkg-source 2>&1 1>/dev/null; then
        echo "Missing dev-tools, marking for installation"
        try ${SUDO} apt-get -y install binutils fakeroot quilt devscripts dpkg-dev libdistro-info-perl --no-install-recommends
    fi

    #aptitude is used by get-build deps
    if ! command -v aptitude 2>&1 1>/dev/null; then
        echo "Missing aptitude, marking for installation"
        try ${SUDO} apt-get -y install aptitude --no-install-recommends
    fi
    #equivs needed for mk-build-deps
     if ! command -v equivs-build 2>&1 1>/dev/null; then
         echo "Missing equivs-build, marking for installation"
         try ${SUDO} apt-get -y install equivs --no-install-recommends
     fi

     #test and install deps as necessary
     if ! dpkg-checkbuilddeps 1>/dev/null 2>&1; then
     echo "Missing build dependencies, will install them now:"
         yes y | ${SUDO} mk-build-deps debian/control -ir
     fi
     #test and install deps as necessary
     if ! command -v unzip 1>/dev/null 2>&1; then
     echo "Missing unzip, marking for installation"
         try ${SUDO} apt-get -y install unzip --no-install-recommends
     fi
else
  tar cafv ../"${PACKAGE_NAME}_${UPSTREAM_VERSION}~${TODAY}.orig.tar.gz" ${PACKAGE_NAME}
  DEBUILD_FLAGS="-I${PACKAGE_NAME} -I.gitignore -I.DS_Store -Ibuild-deb.sh -Igo -IREADME.md -IJenkinsfile ${DEBUILD_FLAGS} -S"
fi

#build the packages
echo "Building the packages"
debuild $DEBUILD_FLAGS

echo "Cleaning up"
debian/rules clean -s
[ -d ${GOPATH} ] && ${SUDO} rm -rf ${GOPATH}
