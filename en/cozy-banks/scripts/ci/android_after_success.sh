#!/bin/bash
# This script is used to deploy apk and notify us

set -e

./scripts/ci/add_ssh_key.sh
export APK_URL=$(node scripts/ci/push_artifact.js src/targets/mobile/build/android/cozy-banks.apk)
./scripts/ci/mattermost_comment.sh
yarn run cozy-ci-github "🎁 [Click here]($APK_URL) to download the latest Android APK"
