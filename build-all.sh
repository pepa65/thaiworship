#!/usr/bin/env bash

# build-all.sh - Make all the files in the project

echo 'making OpenLP/*.xml files'
./openlp.sh

echo 'making worship.html'
./worship.sh

echo 'making worshipp.html'
./worshipp.sh

echo 'making worship.pdf and worship2.pdf'
./pdf.sh

echo 'making BookletA4.pdf'
a5toa4 BookletA5.pdf BookletA4.pdf
