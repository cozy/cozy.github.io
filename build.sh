#!/bin/bash

set -e

[ ! -d docs ] && mkdir docs
cp index.html docs/
cp CNAME docs/

python generate_config.py --fetch

mkdocs build -f mkdocs.yml
