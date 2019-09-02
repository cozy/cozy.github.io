#!/bin/bash

set -e

rm -rf docs/*
cp index.html docs/
cp CNAME docs/

python generate_config.py --fetch

mkdocs build -f mkdocs.yml
