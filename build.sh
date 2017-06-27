#!/bin/bash
rm -rf docs/*
cp index.html docs/
mkdocs build -f mkdocs.yml
mkdocs build -f mkdocs_fr.yml
