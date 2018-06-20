#!/bin/bash

set -e

rm -rf docs/*
cp index.html docs/
cp CNAME docs/

python add_external_docs.py

mkdocs build -f mkdocs.yml
mkdocs build -f mkdocs_fr.yml
msgmerge --update i18n/fr_FR/LC_MESSAGES/messages.po i18n/messages.pot

# Override french developer documentation with the up to date english version
cp -R docs/en/dev/ docs/fr/

