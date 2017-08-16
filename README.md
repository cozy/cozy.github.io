# Cozy Documentation

Learn how to [use Cozy](https://docs.cozy.io/en/use), [host your own server](https://docs.cozy.io/en/install/) and [develop applications](https://docs.cozy.io/en/dev/).

## Hack this documentation

This documentation is built with [MkDocs](http://www.mkdocs.org).

To hack the documentation, just edit the files inside `docs`.

If you want to see your updates, install mkdocs:

```shell
pip install --user mkdocs
```

Run MkDocs:

```shell
mkdocs serve
```

And point your favorite browser to `http://127.0.0.1:8000/`


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
