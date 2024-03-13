"""
- Fetches external repositories containing docs (listed in OUTSIDE_DOCS)
- Generate mkdocs.yml from mkdocs.yml.tpl
"""

import yaml
import json
import os
import sys
import re
import os.path as osp
from collections import OrderedDict, namedtuple
import fnmatch
import sh

def simple_glob(directory, glob_pattern):
    matches = []
    for root, dirnames, filenames in os.walk(directory, followlinks=True):
        for filename in fnmatch.filter(filenames, glob_pattern):
            matches.append(osp.join(root, filename))
    return matches


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


leadingHash = re.compile(r'#+\s+')

def read_toc(directory):
    def make_paths_absolute(tree):
        for t in tree:
            for k in t.keys():
                if isinstance(t[k], str):
                    t[k] = re.sub('^.', directory, t[k])
                else:
                    make_paths_absolute(t[k])
    toc_path = osp.join('src', directory, 'toc.yml')
    README_path = osp.join('src', directory, 'README.md')
    if osp.exists(toc_path):
        with open(toc_path) as f:
            toc = ordered_load(f)
    elif osp.exists(README_path):
        toc = ordered_load('- README: ./README.md')
    else:
        return None
    make_paths_absolute(toc)
    return toc


def find_entry(tree, name):
    try:
        return [p for p in tree if p.get(name)][0][name]
    except IndexError:
        return None

def walk_dict(d, path=None):
    if path is None:
        path = []
    it = None
    if isinstance(d, list):
        it = enumerate(iter(d))
    elif isinstance(d, dict):
        it = d.items()
    if it:
        for key, item in it:
            path.append(key)
            for key, leaf in walk_dict(item, path):
                yield key, leaf
            path.pop()
    else:
        yield path, d


def get_name(filename):
    return '.'.join(osp.basename(filename).split('.')[:-1])


ExternalDoc = namedtuple('ExternalDoc', ['name', 'repository', 'doc_directory'])


def parse_external_doc_line(l):
    return ExternalDoc(*(l.strip().split(' ')))


has_pulled = {}
def fetch_external_doc(repository, destination):
    sh.rm('-rf', destination)
    sh.mkdir('-p', destination)
    with sh.pushd(destination):
        if osp.exists('.git') and not has_pulled.get(repository):
            sh.git('pull')
            has_pulled[repository] = True
        else:
            sh.git('clone', repository, '--depth', '1', '.')


def fetch_all_external_docs_from_file(filename):
    with open(filename) as f:
        external_docs = [parse_external_doc_line(l) for l in f]
    for name, repository, doc_directory in external_docs:
        tmpdir = osp.join('/tmp', name)
        print('Fetching %s...' % name)
        fetch_external_doc(repository, tmpdir)
        src_dir = osp.join('src', name)
        sh.rm('-f', src_dir)
        print('Linking %s...' % name)
        sh.ln('-s', osp.join(tmpdir, doc_directory), src_dir)


def read_tocs(outside_doc_names):
    tocs = {}
    for dir in outside_doc_names:
        abs = osp.join('./src', dir)
        toc = read_toc(dir)
        if toc:
            tocs[dir] = toc
    return tocs


def set_entry_content(obj, path, items):
    cur = obj
    for i, p in enumerate(path):
        next = find_entry(cur, p) 
        if not next:
            # Adding a new entry
            if i == len(path) - 1:
                print('Adding', len('items'), ' items to path ', path)
                cur.append({ p: items })
                return
            else:
                raise ValueError('Cannot find %s in %s (last crumb: %s)' % (path, obj, p))
            break
        else:
            cur = next
    if cur:
        # Replacing all the content
        del cur[:]
        for item in items:
            cur.append(item)

def flatten_entry_if_single(entries):
    if len(entries) == 1:
        return next(iter(entries[0].values()))
    else:
        return entries


def find_node(tree, finder):
    for path_leaf in walk_dict(tree):
        if finder(path_leaf):
            return path_leaf
    return None


def replace_toc_placeholders(nav, named_tocs):
    for name, toc in named_tocs.items():
        path_leaf = find_node(nav, lambda x: ('<%s>' % name) == x[1])
        if path_leaf:
            path, content = path_leaf
            cur = nav
            for tok in path[:-1]:
                cur = cur[tok]
            single_key = next(iter(cur.keys()))
            cur[single_key] = flatten_entry_if_single(toc)


def main(argv):
    OUTSIDE_DOCS = 'OUTSIDE_DOCS'

    if '--fetch' in argv:
        fetch_all_external_docs_from_file(OUTSIDE_DOCS)

    with open('./mkdocs.yml.tpl') as f:
        data = ordered_load(f, yaml.SafeLoader)

    with open(OUTSIDE_DOCS) as f:
        outside_docs_conf = [l.strip().split(' ') for l in f.readlines()]
    outside_docs_conf = [
        {'name': c[0], 'repo': c[1], 'subdir': c[2]}
        for c in outside_docs_conf
    ]

    outside_doc_names = [c['name'] for c in outside_docs_conf]
    name_to_tocs = read_tocs(outside_doc_names)
    nav = data['nav']

    replace_toc_placeholders(data['nav'], name_to_tocs)

    outside_docs_entry = {"outside_docs": outside_docs_conf}
    if 'extra' not in data:
        data['extra'] = {}
    data['extra'] = dict(data['extra'], **outside_docs_entry)

    with open('mkdocs.yml', 'w+') as f:
        ordered_dump(data, f, indent=2, default_flow_style=False, Dumper=yaml.SafeDumper)
        f.seek(0, 0)
        content = f.read()
        f.seek(0, 0)
        warning = '#\n# THIS FILE IS AUTOMATICALLY GENERATED, PLEASE EDIT `mkdocs.yml.tpl` AND LAUNCH `python generate_config.py`\n#\n'
        f.write(warning + content)

main(sys.argv)
