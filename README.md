# Cozy Documentation

Learn how to [use Cozy](https://docs.cozy.io/en/use), [host your own server](https://docs.cozy.io/en/install/) and [develop applications](https://docs.cozy.io/en/dev/).

## Edit this documentation

This documentation is built with [MkDocs](http://www.mkdocs.org).

To edit the documentation, just edit the files inside `src`.

If you want to see your updates, install mkdocs:

```shell
pip install --user mkdocs
```

Fetch external documentation and add it to mkdocs.yml (do not commit this the changes in `References`) :

```
./fetch.sh
./add_external_docs.py
```

Run MkDocs:

```shell
mkdocs serve
```

And point your favorite browser to `http://127.0.0.1:8000/`

## External documentations

External documentations are listed in the [OUTSIDE_DOCS](./OUTSIDE_DOCS) file. They are consolidated in this documentation during build.
This lets developers edit their documentation in their repository while the single site makes it convenient
to search for information only in one location.

Each repository maintains its own [table of contents](https://github.com/cozy/cozy-doctypes/blob/master/toc.yml),
which controls what is shown under the References menu.

See [./fetch.sh](./fetch.sh), [./build.sh](./build.sh), and [./add_external_docs.py](./add_external_docs.py) scripts for more information.

## When are the docs deployed ?

The documentation is built automatically by Travis 

* when the `dev` is pushed
* every day (since we cannot detect changes in external documentations)

After the build, it is available on https://docs.cozy.io/.


To test the whole site:

```shell
rm -rf docs/*
cp index.html docs/
mkdocs build -f mkdocs.yml
cd site/
python -m SimpleHTTPServer
```

