import os
import os.path as osp
import json
import codecs

def create_fixture_from_dir(directory, fixture):
    data = {
        'io.cozy.files': [],
        'io.cozy.photos.albums': []
    }

    files = data['io.cozy.files']
    albums = data['io.cozy.photos.albums']
    album_dirs = os.listdir(directory)

    album_id = 0
    counter = [-1]
    def get_file_id():
        counter[0] += 1
        return counter[0]

    for album_dir in album_dirs:
        path = osp.join(directory, album_dir)
        if not osp.isdir(path):
            continue
        photos = [p for p in os.listdir(osp.join(directory, album_dir)) if p.endswith('.jpg')]
        for photo in photos:
            files.append({
                '__SRC__': osp.join("{{ dir }}", directory, album_dir, photo),
                '__DEST__': osp.join("/", "Photos", directory, album_dir, photo)
            })
        photo_attribute = ["{{reference 'io.cozy.files' %s '_id' }}" % get_file_id() for _ in range(len(photos))]
        albums.append({
          "_id": "demo-%s" % album_id, 
          "created_at": "2017-08-11T10:29:21.456Z",
          "name": album_dir,
          "type": "io.cozy.photos.albums",
          "photos": photo_attribute,
          "__REFERENCES__": photo_attribute
        })
        album_id += 1

    with open(fixture, 'w+') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    from argparse import ArgumentParser
    parser = ArgumentParser()
    parser.add_argument('directory')
    parser.add_argument('fixture')
    args = parser.parse_args()
    create_fixture_from_dir(args.directory, args.fixture)

