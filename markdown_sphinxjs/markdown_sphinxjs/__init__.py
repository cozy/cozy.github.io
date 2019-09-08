from __future__ import absolute_import
from __future__ import unicode_literals
import re
import os
import json
import tempfile

from markdown.extensions import Extension
from markdown.blockprocessors import BlockProcessor
from markdown.util import etree

from sphinx_js import gather_doclets


class Config:
    def __init__(self, **attrs):
        for key, val in attrs.items():
            setattr(self, key, val)


class App:
    """Make alike for Sphinx app for SphinxJS to work"""

    def __init__(self, config):
        self.config = Config(**config)
        self._sphinxjs_doclets_by_class = {}
        self.confdir = "/tmp"


DEFAULT_JSDOC_CONFIG = {
  "opts": {
    "recurse": True
  },
  "source": {
    "includePattern": ".+\\.js(doc)?x?$",
    "excludePattern": "((^|\\/|\\\\)_)|(min)|(dist)",
    "exclude": [
      "node_modules",
      "plugins"
    ]
  }
}


def gather_doclets_from_dir(src_dir, jsdoc_cache=None, force=False):
    if force and os.path.isfile(jsdoc_cache):
        os.unlink(jsdoc_cache)

    with tempfile.NamedTemporaryFile(mode='w', delete=False) as configfile:
        configfile.write(json.dumps(DEFAULT_JSDOC_CONFIG, indent=2))
        configfile.seek(0)
        app = App(
            {
                "js_source_path": src_dir,
                "js_language": "javascript",
                "root_for_relative_js_paths": src_dir,
                "jsdoc_config_path": configfile.name,
                "jsdoc_cache": jsdoc_cache,
                "sphinx_js_lax": True
            }
        )
        gather_doclets(app)
    return {
        "by_class": app._sphinxjs_doclets_by_class,
        "by_path": app._sphinxjs_doclets_by_path,
    }


def make_definition_node(ancestor, definition, path):
    div = etree.SubElement(ancestor, "div")
    div.attrib["class"] = "markdown-sphinxjs-description"

    name = etree.SubElement(div, "h4")
    name.text = "%s.%s(%s) => %s" % (
        definition["memberof"],
        definition["name"],
        ", ".join(definition["meta"]["code"]["paramnames"]),
        definition["returns"][0]["type"]["names"][0]
    )
    p = etree.SubElement(div, "p")
    p.text = definition["description"]
    param_table = etree.SubElement(div, "table")
    param_head = etree.SubElement(param_table, "thead")
    head_row = etree.SubElement(param_table, "tr")
    name = etree.SubElement(head_row, "th")
    name.text = 'Parameter'
    type = etree.SubElement(head_row, "th")
    type.text = 'Type'
    desc = etree.SubElement(head_row, "th")
    desc.text = 'Description'

    # data = etree.SubElement(div, "pre")
    # data.text = json.dumps(definition, indent=2)

    params = etree.SubElement(param_table, "tbody")
    for param in definition["params"]:
        row = etree.SubElement(params, "tr")
        name = etree.SubElement(row, "td")
        name.text = param["name"]
        type = etree.SubElement(row, "td")
        type.text = ", ".join(param["type"]["names"])
        desc = etree.SubElement(row, "td")
        desc.text = param["description"]

    for example in definition["examples"]:
        example_node = etree.SubElement(div, "pre")
        example_node.text = """%s""" % example

    return div


class MarkdownJSExtension(Extension):
    def __init__(self, directory, **kwargs):
        super(MarkdownJSExtension, self).__init__(**kwargs)
        self.config = {"directory": directory}
        self.index = {}
        self.doclets = gather_doclets_from_dir(directory)

    def extendMarkdown(self, md, **kwargs):
        md.registerExtension(self)

        md.parser.blockprocessors.register(
            MarkdownJSProcessor(md.parser, self.doclets), "markdown-sphinxjs", 105
        )


class MarkdownJSProcessor(BlockProcessor):
    """
    Understands blocks beginining by --->
    The arrow must be followed by an identifier for a function.
    
    Finds the function referenced by identifier and outputs a div with the description
    and parameters of the function.

    Mostly copied from admonition block processor"""

    RE = re.compile(r'^---> ?([\w\-/#]+(?: +[\w\-#]+)*)(?:\n|$)')
    RE_SPACES = re.compile("  +")

    def __init__(self, parser, doclets):
        super(MarkdownJSProcessor, self).__init__(parser)
        self.doclets = doclets

    def test(self, parent, block):
        sibling = self.lastChild(parent)
        return self.RE.search(block)

    def build(self, ancestor, match):
        path_tokens = match.group(1).split(' ')
        definition, path = self.doclets["by_path"].get_with_path(path_tokens)
        return make_definition_node(ancestor, definition, path)

    def run(self, parent, blocks):
        sibling = self.lastChild(parent)
        block = blocks.pop(0)
        m = self.RE.search(block)

        if m:
            block = block[m.end() :]  # removes the first line

        block, theRest = self.detab(block)

        if m:
            div = self.build(parent, m)
        else:
            div = sibling

        self.parser.parseChunk(div, block)

        if theRest:
            # This block contained unindented line(s) after the first indented
            # line. Insert these lines as the first block of the master blocks
            # list for future processing.
            blocks.insert(0, theRest)


def makeExtension(**kwargs):  # pragma: no cover
    return MarkdownJSExtension(**kwargs)
