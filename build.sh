#!/bin/bash

rm -rf docs/*
cp index.html docs/
cp CNAME docs/

python add_external_docs.py

mkdocs build -f mkdocs.yml
mkdocs build -f mkdocs_fr.yml
msgmerge --update i18n/fr_FR/LC_MESSAGES/messages.po i18n/messages.pot
