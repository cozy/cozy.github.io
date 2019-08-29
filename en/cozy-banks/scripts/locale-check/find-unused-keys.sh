#!/bin/bash

# Statically extracts translation keys used in our code and check our locales
# for unused keys. This is useful not to embark keys that are no longer used.

set -e # Exits on error

# Make temporary files
paths_used_in_code=$(mktemp /tmp/cozy-banks-check-locales-XXXX)
paths_existing_in_translation=$(mktemp /tmp/cozy-banks-check-locales-XXXX)

function cleanup {
  rm -f $paths_used_in_code $paths_existing_in_translation
}

# Clean temporary files even if script is stopped
trap cleanup INT EXIT

# Get directory of current file
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# 1. Extracts all the keys that are used in the JS. Uses jscodeshift to get all the `t`
# calls. Parts from the keys that are dynamic are replaced with * during extraction and then are removed
# completely with `sed`.
echo "Extracting translation keys from code..."
jscodeshift -t $DIR/list-t.js  --extensions js,jsx --parser babel src --ignore-pattern="targets" \
  | grep "src/" \
  | cut -d' ' -f2 \
  | sort \
  | uniq \
  | sed 's/.\*.*//g' > $paths_used_in_code

# 2. Lists all the paths used in the translation file
echo "Extracting keys from translation file..."
jq '[path(..)|map(tostring)|join(".")]|sort[]' -rc src/locales/en.json > $paths_existing_in_translation

# 3. `check-locale-existence.js` takes both files as arguments and reports which
# paths present in the translation file do not seem to be used.
echo "Finding unused paths..."
result=$(node $DIR/check-locale-paths-usage.js $paths_used_in_code $paths_existing_in_translation)

if [[ ! -z $result ]]; then
  echo "$result"
  exit 1
else
  echo "It's OK, your translation files do not seem to contain unused keys."
  exit 0
fi
