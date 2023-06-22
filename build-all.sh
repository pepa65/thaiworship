#!/usr/bin/env bash

# build-all.sh - Make all the files in the project
# Required: a5toa4 [https://gitlab.com/pepa65/misc]

echo 'Making OpenLP/*.xml files'
./openlp.sh

echo 'Making worship.html'
./worship.sh

echo 'Making worshipp.html'
./worshipp.sh

echo 'Making worship.pdf and worship2.pdf'
./pdf.sh

echo 'Making Song Book files'
./songbook.sh

echo 'making BookletA4.pdf'
a5toa4 BookletA5.pdf BookletA4.pdf
