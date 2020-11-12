# Cozy Documentation

<!-- MarkdownTOC autolink=True -->

- [Edit this documentation](#edit-this-documentation)
- [External documentations](#external-documentations)
- [When are the docs deployed ?](#when-are-the-docs-deployed-)
- [Testing the statically built site](#testing-the-statically-built-site)

<!-- /MarkdownTOC -->

Learn how to [use Cozy](https://docs.cozy.io/en/use), [host your own server](https://docs.cozy.io/en/tutorials/selfhost-debian/) and [develop applications](https://docs.cozy.io/en/tutorials/app/).

## Edit this documentation

This documentation is built with [MkDocs](http://www.mkdocs.org).

To edit the documentation, just edit the files inside `src`.

If you want to see your updates, install mkdocs:

> In most linux distribution, it will install binary in ~/local/bin/, add it to your path.

Fetch external documentation and add it to mkdocs.yml (do not commit done in `mkdocs.yml`) :

```bash
# Activate a virtualenv if you want (recommended)
pip install -r requirements.txt
./build.sh
```

> Expected python version is 3

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

See [./build.sh](./build.sh), and [./generate_config.py](./generate_config.py) scripts for more information.

The edit links displayed in the header of each article are modified via Javascript to handle outside repositories (mkdocs does not support
this natively).

## When are the docs deployed ?

The documentation is built automatically by Travis

- when the `dev` is pushed
- every day (since we cannot detect changes in external documentations)

After the build, it is available on <https://docs.cozy.io/>.

You can trigger a manual build on <https://travis-ci.org/cozy/cozy.github.io> > `More options` > `Trigger build`.

## Testing the statically built site

To test the whole site:

```shell
rm -rf docs/*
cp index.html docs/
mkdocs build -f mkdocs.yml
cd site/
python -m SimpleHTTPServer
```
