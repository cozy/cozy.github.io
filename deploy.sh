#!/bin/bash

set -euo pipefail

TRAVIS_BRANCH=${TRAVIS_BRANCH:-''}
TRAVIS_PULL_REQUEST=${TRAVIS_PULL_REQUEST:-'false'}
DEPLOY_REPOSITORY=${DEPLOY_REPOSITORY:-''}
GITHUB_TOKEN=${GITHUB_TOKEN:-''}

if [[ "$TRAVIS_BRANCH" != "master" && $TRAVIS_BRANCH != '' ]]; then
    echo "Not on master (branch is $TRAVIS_BRANCH), aborting deploy"
    exit 0
fi

if [[ "$TRAVIS_PULL_REQUEST" != "false" ]]; then
    echo "On pull request, aborting deploy"
    exit 0
fi

if [[ "$GITHUB_TOKEN" == "" && $DEPLOY_REPOSITORY == '' ]]; then
    echo "No GitHub token, aborting deploy"
    exit 0
fi

yarn git-directory-deploy \
    --username Cozy \
    --email contact@cozycloud.cc \
    --directory docs/ \
    --repo=${DEPLOY_REPOSITORY:-https://$GITHUB_TOKEN@github.com/cozy/cozy-docs-v3.git} \
    --branch=${DEPLOY_BRANCH:-gh-pages}
