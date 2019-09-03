import os
import os.path as osp
import json
import codecs

ignored = set(['.DS_Store'])

def create_fixture_from_dir(directory, fixture, root):
    data = {
        'io.cozy.files': [],
    }

    files = data['io.cozy.files']

    for (cur, subdirs, subfiles) in os.walk(directory):
        for f in subfiles:
            if f not in ignored:
                path = osp.join(cur, f)
                files.append({
                    '__SRC__': osp.join("{{ dir }}", path),
                    '__DEST__': osp.join(root, path.replace(directory, ''))
                })

    with open(fixture, 'w+') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    from argparse import ArgumentParser
    parser = ArgumentParser()
    parser.add_argument('directory')
    parser.add_argument('fixture')
    parser.add_argument('--root', default='/')
    args = parser.parse_args()
    create_fixture_from_dir(args.directory, args.fixture, args.root)

