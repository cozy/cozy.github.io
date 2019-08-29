#!/bin/bash
# This script is used to initialize android

set -e

echo 'Install dependencies' && echo 'travis_fold:start:install_deps\\r'
yes | sdkmanager "platforms;android-27" # see https://github.com/travis-ci/travis-ci/issues/8874#issuecomment-350350607
yarn
gem update --system
rvm install 2.6.0
gem install bundler
(cd src/targets/mobile && bundle install)
echo 'travis_fold:end:install_deps\\r'

echo 'Decrypt secrets' && echo 'travis_fold:start:decrypt_secrets\\r'
yarn secrets:decrypt
ln -s ../../../scripts/decrypted/keys ./src/targets/mobile/keys
echo 'travis_fold:end:decrypt_secrets\\r'
