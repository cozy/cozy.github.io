# Cozy Documentation

Learn how to [use Cozy](https://docs.cozy.io/en/use), [host your own server](https://docs.cozy.io/en/install/) and [develop applications](https://docs.cozy.io/en/dev/).

## Edit this documentation

This documentation is built with [MkDocs](http://www.mkdocs.org).

To edit the documentation, just edit the files inside `src`.

If you want to see your updates, install mkdocs and the i18n extension of markdown:

_Warning: while mkdocs supports Python 2 and 3, the current version of markdown-i18n only support Python 2_

```shell
pip install --user mkdocs markdown-i18n
```

Run MkDocs:

```shell
mkdocs serve
```

And point your favorite browser to `http://127.0.0.1:8000/`

## External documentations

Several other external documentations are consolidated in this documentation during build.

They are listed [here](./OUTSIDE_DOCS).

The docs are built from this repository and also for the references from other repos. This lets 
developers edit their documentation in their repository and this documentation consolidates
all the docs in a single site which makes it convenient to search.

See the [./fetch.sh](./fetch.sh) and [./build.sh](./build.sh) scripts for more information.

## When are the docs deployed ?

The documentation is built automatically by Travis when

* master is pushed
* and every day

As soon as it is built, it is available on https://cozy.github.io/cozy-docs-v3/en/.
https://docs.cozy.io is not a direct mirror and is updated by hand so it is not directly updated. Nevertheless it shoud be almost up-to-date.

### i18n


To add a new language, copy `mkdocs.yml` to `mkdocs_lang.yml`, translate the pages title and update `site_dir` and `markdown_extensions.markdown_i18n.i18n_lang`.

You’ll require some Gettext utilities. On Debian GNU/Linux, install the `gettext` package.

Every time you run a build, MkDocs will update the `i18n/messages.pot` file.

When adding a new language, you first need to initialize the `.po` file. For example, for french translation:

```shell
msginit --input=./i18n/messages.pot --output=./i18n/fr_FR/LC_MESSAGES/messages.po
```

To build the French version of the website:

```shell
mkdocs build -f mkdocs_fr.yml --clean
```

To test the whole site:

```shell
rm -rf docs/*
cp index.html docs/
mkdocs build -f mkdocs.yml
mkdocs build -f mkdocs_fr.yml
cd site/
python -m SimpleHTTPServer
```

To update the translation file, use `msgmerge`:

```shell
msgmerge --update i18n/fr_FR/LC_MESSAGES/messages.po i18n/messages.pot
```
