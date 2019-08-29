#!/bin/bash
# This script is used to add ssh key

set -e

yarn secrets:decrypt
eval "$(ssh-agent -s)"
mv ./scripts/decrypted/id_rsa* ~/.ssh
chmod 600 ~/.ssh/id_rsa*
ssh-add ~/.ssh/id_rsa
