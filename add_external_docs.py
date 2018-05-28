"""
Adds table of contents of each external documentation to the
References menu
"""

import yaml
import json
import os
import sys
import re
import os.path as osp
from collections import OrderedDict

def ordered_load(stream, Loader=yaml.Loader, object_pairs_hook=OrderedDict):
    class OrderedLoader(Loader):
        pass
    def construct_mapping(loader, node):
        loader.flatten_mapping(node)
        return object_pairs_hook(loader.construct_pairs(node))
    OrderedLoader.add_constructor(
        yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG,
        construct_mapping)
    return yaml.load(stream, OrderedLoader)


def ordered_dump(data, stream=None, Dumper=yaml.Dumper, **kwds):
    class OrderedDumper(Dumper):
        pass
    def _dict_representer(dumper, data):
        return dumper.represent_mapping(
            yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG,
            data.items())
    OrderedDumper.add_representer(OrderedDict, _dict_representer)
    return yaml.dump(data, stream, OrderedDumper, **kwds)


leadingHash = re.compile('#+\s+')

def read_toc(directory):
    toc_path = osp.join('src', directory, 'toc.yml')
    if not osp.exists(toc_path):
        return
    else:
        def make_paths_absolute(tree):
            for t in tree:
                for k in t.iterkeys():
                    if isinstance(t[k], str):
                        t[k] = re.sub('^.', directory, t[k])
                    else:
                        make_paths_absolute(t[k])
        with open(toc_path) as f:
            toc = ordered_load(f)
            make_paths_absolute(toc)
            return toc

def find_entry(tree, name):
    entries = [p for p in tree if p.get(name)]
    if not entries:
        return []
    return entries[0][name]

def reduce_toc(accumulated_dirs, dir):
    toc = read_toc(dir)
    if toc:
        accumulated_dirs.append({ dir: toc })
    return accumulated_dirs

def replace_entry(name, value):
    def replace_if_match(entry):
        if isinstance(entry, basestring):
            if (entry == name):
                return OrderedDict([(name, value)])
            else:
                return entry
        else:
            if (entry.get(name) != None):
                return OrderedDict([(name, value)])
            else:
                return entry
    return replace_if_match

def insert_external_docs(data, external_docs):
    remaining_external_docs = map(lambda d:d[0], external_docs)

    develop = find_entry(data['pages'], 'Develop')
    references = reduce(reduce_toc, remaining_external_docs, [])

    develop_with_externals_docs = map(replace_entry('References', references), develop)
    data['pages'] = map(replace_entry('Develop', develop_with_externals_docs), data['pages'])

    return data

def main():
    with open('./mkdocs.yml') as f:
        data = ordered_load(f, yaml.SafeLoader)

    with open('EXTERNAL_DOCS') as f:
        external_docs = [l.strip().split(' ') for l in f.readlines()]


    external_docs_conf = [
        {'name': c[0], 'repo': c[1], 'subdir': c[2]}
        for c in external_docs
    ]
    external_doc_names = [c['name'] for c in external_docs_conf]

    data_with_external_docs = insert_external_docs(data, external_docs)

    data['extra'] = {"external_docs": external_docs_conf}
    with open('mkdocs.out.yml', 'w+') as f:
        ordered_dump(data_with_external_docs, f, indent=2, default_flow_style=False, Dumper=yaml.SafeDumper)

main()
