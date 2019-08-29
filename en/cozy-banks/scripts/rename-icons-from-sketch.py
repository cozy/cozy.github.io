"""
When receiving icons from the designers, their names have a different
format from what we expect in banks. But they have the category id, so
we can rename them correctly.

Put the SVG icons from sketch into src/assets/icons/categories, run this
script and they will be correctly renamed.

Ex:

- 400900-educationAndTraining-icon.svg to icon-cat-educationAndTraining.svg

"""

import json
import os
import os.path as osp

DIR = osp.dirname(osp.abspath((__file__)))
ICON_DIR = osp.join(DIR, '../src/assets/icons/categories')
CAT_FILE = osp.join(DIR, '../src/ducks/categories/tree.json')


def rename_icon_from_sketch_to_banks(filename, cat_mapping):
    splitted = filename.split('-')
    id = splitted[0]
    cat_name = cat_mapping[id]
    new_name = 'icon-cat-%s.svg' % cat_name
    print('renaming: %s -> %s' % (filename, new_name))
    os.rename(osp.join(ICON_DIR, filename), osp.join(ICON_DIR, new_name))


def main():
  with open(CAT_FILE) as f:
    cat_mapping = json.load(f)  

  for filename in os.listdir(ICON_DIR):
    if not filename.endswith('svg'):
      print('ignoring: %s' % filename)
      continue
    if filename.startswith('icon-cat'):
      print('ignoring: %s' % filename)
      continue
    rename_icon_from_sketch_to_banks(filename, cat_mapping)

if __name__ == '__main__':
    main()
