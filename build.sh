#!/bin/bash
set -e

rm -rf docs/*
cp index.html CNAME docs/

python generate_config.py --fetch
mkdocs build -f mkdocs.yml
yarn run redoc-cli bundle --disableGoogleFont src/cloudery/index.yaml -o docs/cloudery/index.html
cp src/cloudery/index.yaml docs/cloudery/
