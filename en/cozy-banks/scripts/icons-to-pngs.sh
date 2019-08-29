#!/bin/sh
#
# This script is used to convert the icons from the src/assets/icons/categories to png
# for usage in emails.
#
# We need to extend the SVG's viewport by 1 pixel (32 -> 33) otherwise
# the circle is a bit cropped in the resulting SVG

input_dir=${1:-src/assets/icons/categories/}
output_dir=${2:-/tmp/bank-icons}

echo "Input directory: $input_dir"
echo "Output directory: $output_dir"
mkdir -p $output_dir

ls $input_dir/*.svg | while read icon; do
  svg_name=$(basename $icon)
  png_name=$(echo $svg_name | sed 's/\.svg/.png/')
  echo "Converting $svg_name to $png_name..."
  cat $input_dir/$svg_name | sed 's-0\ 0\ 32\ 32-0 0 33 33-' > /tmp/$svg_name
  convert -background transparent /tmp/$svg_name $output_dir/$png_name
done

echo "Optimizing..."
optipng -quiet $output_dir/*.png

echo "✨ Done: all icons are in $output_dir"

