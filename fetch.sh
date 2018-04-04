#!/bin/bash

set -euo pipefail

function fetch-from-remote {
    repo=$1
    dir=$2
    rm -rf $dir
    if [[ ! -d "$dir" ]]; then
        echo "mkdir $dir"
        mkdir -p "$dir"
    fi
    echo "Going to $2"
    cd $dir
    if [[ -e .git ]]; then
        git pull
    else
        git clone $repo --depth 1 .
    fi
    cd -
}

rm src/cozy-client-js src/cozy-konnector-libs || true

cat OUTSIDE_DOCS | while read line; do
  arr=($line)
  name=${arr[0]}
  repo=${arr[1]}
  subdir=${arr[2]}
  tmpsubdir="/tmp/$name"
  if [[ $subdir != "." ]]; then
    tmpsubdir=${tmpsubdir}/${subdir}
  fi
  fetch-from-remote $repo /tmp/$name
  ln -s /tmp/$name/$subdir src/$name
done
