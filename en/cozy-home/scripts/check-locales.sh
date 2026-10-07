#! /bin/bash

# Locales that must have exactly the same keys as the source locale (en)
checked_locales="fr es de it ru vi"

en_paths=$(mktemp "/tmp/check-locales-XXX")
locale_paths=$(mktemp "/tmp/check-locales-XXX")

echo "Comparing locales for differences"
jq '[path(..)|map(tostring)|join(".")]|sort' src/locales/en.json > $en_paths

mismatches=""
for locale in $checked_locales; do
  jq '[path(..)|map(tostring)|join(".")]|sort' src/locales/$locale.json > $locale_paths
  git diff -- $en_paths $locale_paths
  if [[ $? != 0 ]]; then
    mismatches="$mismatches $locale"
  fi
done

rm -f $en_paths $locale_paths

if [[ -n $mismatches ]]; then
  echo "Locales mismatching en:$mismatches, see diff above"
  exit 1
else
  echo "Locales en, $checked_locales have the same keys, everything OK"
fi
