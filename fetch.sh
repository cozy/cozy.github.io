#!/bin/bash

function fetch-from-remote {
    repo=$1
    dir=$2
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

fetch-from-remote https://github.com/cozy/cozy-konnector-libs.git /tmp/cozy-konnector-libs
ln -s /tmp/cozy-konnector-libs/packages/cozy-konnector-libs/docs src/cozy-konnector-libs

fetch-from-remote https://github.com/cozy/cozy-client-js.git /tmp/cozy-client-js
ln -s /tmp/cozy-client-js/docs src/cozy-client-js
