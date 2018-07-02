#!/bin/bash

set -e

rm -rf docs/*
cp index.html docs/
cp CNAME docs/

python add_external_docs.py

mkdocs build -f mkdocs.yml
