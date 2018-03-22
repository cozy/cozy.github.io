#!/bin/bash

rm -rf docs/*
cp index.html docs/

mkdocs build -f mkdocs.yml
mkdocs build -f mkdocs_fr.yml
msgmerge --update i18n/fr_FR/LC_MESSAGES/messages.po i18n/messages.pot
