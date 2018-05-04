#!/bin/bash

# This script is responsible for deploying the build/ directory
# to the master branch on GitHub.
#
# GITHUB_TOKEN, RUNDECK_UPDATE_DOCS_JOB_URL and RUNDECK_TOKEN env
# vars have been provided through Travis web interface.

set -euo pipefail

TRAVIS_BRANCH=${TRAVIS_BRANCH:-''}
TRAVIS_PULL_REQUEST=${TRAVIS_PULL_REQUEST:-'false'}
DEPLOY_REPOSITORY=${DEPLOY_REPOSITORY:-''}
GITHUB_TOKEN=${GITHUB_TOKEN:-''}
DEPLOY_BRANCH=${DEPLOY_BRANCH:-'master'}
DEPLOY_REPOSITORY=${DEPLOY_REPOSITORY:-https://$GITHUB_TOKEN@github.com/cozy/cozy.github.io.git}

if [[ "$TRAVIS_BRANCH" != "dev" && $TRAVIS_BRANCH != '' ]]; then
    echo "Not on dev (branch is $TRAVIS_BRANCH), aborting deploy"
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

echo "Deploying on $DEPLOY_BRANCH (dev branch is `dev`, org pages must be published on `master`)..."
yarn git-directory-deploy \
    --username Cozy \
    --email contact@cozycloud.cc \
    --directory docs/ \
    --repo=$DEPLOY_REPOSITORY \
    --branch=$DEPLOY_BRANCH
echo "$DEPLOY_BRANCH branch updated. Should be visible on https://cozy.github.io/"

RUNDECK_UPDATE_DOCS_JOB_URL=${RUNDECK_UPDATE_DOCS_JOB_URL:-""}
RUNDECK_TOKEN=${RUNDECK_TOKEN:-""}

if [[ ! -z "$RUNDECK_UPDATE_DOCS_JOB_URL" &&  ! -z $RUNDECK_TOKEN ]]; then
    echo "Updating on docs.cozy.io via Rundeck..."
    curl -s --fail -X POST -H "X-Rundeck-Auth-Token: $RUNDECK_TOKEN" $RUNDECK_UPDATE_DOCS_JOB_URL > /dev/null
    echo "Should be visible on https://docs.cozy.io/"
else
    echo "No Rundeck env vars (RUNDECK_UPDATE_DOCS_JOB_URL or RUNDECK_TOKEN), cannot deploy on docs.cozy.io"
fi
