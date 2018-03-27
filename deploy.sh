#!/bin/bash

if [[ "$TRAVIS_BRANCH" != "master" ]]; then
    echo "Not on master (branch is $TRAVIS_BRANCH), aborting deploy"
    exit 0
fi

if [[ "$TRAVIS_PULL_REQUEST" != "false" ]]; then
    echo "On pull request, aborting deploy"
    exit 0
fi

if [[ "$GITHUB_TOKEN" == "" ]]; then
    echo "No GitHub token, aborting deploy"
    exit 0
fi

yarn git-directory-deploy \
    --username Cozy \
    --email contact@cozycloud.cc \
    --directory docs/ \
    --repo=https://$GITHUB_TOKEN@github.com/cozy/cozy-collect.git \
    --branch=build
