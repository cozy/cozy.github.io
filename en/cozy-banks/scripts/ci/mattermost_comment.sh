#!/bin/bash
# This script is used to comment on mattermost

set -eux

if [ "$TRAVIS_PULL_REQUEST" != "false" ]; then
  FROM="pull request [#$TRAVIS_PULL_REQUEST](https://github.com/$TRAVIS_PULL_REQUEST_SLUG/pull/$TRAVIS_PULL_REQUEST)"
elif [ "$TRAVIS_TAG" != "" ]; then
  FROM="tag [$TRAVIS_TAG](https://github.com/cozy/cozy-banks/releases/tag/$TRAVIS_TAG)"
else
  FROM="master"
fi

export MATTERMOST_CHANNEL="gangsters"
curl -f -i -X POST -H "Content-Type: application/json" -d "{\"text\": \"🎁 [Click here]($APK_URL) to download the latest Android APK from $FROM\", \"icon_url\": \"https://travis-ci.com/images/logos/TravisCI-Mascot-1.png\", \"username\": \"Travis\", \"channel\": \"$MATTERMOST_CHANNEL\"}" $MATTERMOST_HOOK_URL
