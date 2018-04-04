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
        with open(toc_path) as f:
            toc = ordered_load(f)
            for ref in toc:
                for k in ref.iterkeys():
                    ref[k] = re.sub('^.', directory, ref[k])
            return toc

def main():
    with open('./mkdocs.yml') as f:
        data = ordered_load(f, yaml.SafeLoader)

    with open('OUTSIDE_DOCS') as f:
        outside_docs = [l.split(' ')[0] for l in f.readlines()]

    references = [p for p in data['pages'] if p.get('References')][0]['References']
    del references[:]

    for dir in outside_docs:
        abs = osp.join('./src', dir)
        toc = read_toc(dir)
        if toc:
            references.append({ dir: toc })

    with open('mkdocs.yml', 'w+') as f:
        ordered_dump(data, f, indent=2, default_flow_style=False, Dumper=yaml.SafeDumper)
