#!/usr/bin/env bash

# booklet.sh - Transform A5 booklet file into A4 with a5toa4
# Required: a5toa4[https://github.com/pepa65/misc] coreutils(stat)

self=$(readlink -e "$0")
dir=${self%/*}
a5=$dir/BookletA5.pdf a4=$dir/BookletA4.pdf
a5t=$(stat -c%Y "$a5") a4t=$(stat -c%Y "$a4")
((a5t < a4t)) &&
  echo "--- The booklet is up-to-date already" &&
  exit 0

a5toa4 "$a5" "$a4"
