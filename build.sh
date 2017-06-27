#!/bin/bash
rm -rf docs/*
ln -s ../index.html docs/
mkdocs build -f mkdocs.yml
mkdocs build -f mkdocs_fr.yml
