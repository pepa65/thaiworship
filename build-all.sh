#!/usr/bin/env bash

# build-all.sh - Make all the files in the project
# Required: time a5toa4 [https://gitlab.com/pepa65/misc]

date

echo 'Making OpenLP/*.xml files'
\time -f%E ./openlp.sh

echo 'Making worship.html'
\time -f%E ./worship.sh

echo 'Making worshipp.html'
\time -f%E ./worshipp.sh

echo 'Making Song Book and Thai Worship files'
\time -f%E ./songbook.sh pdf

echo 'Making worship.pdf and worship2.pdf'
\time -f%E ./pdf.sh

echo 'making BookletA4.pdf'
\time -f%E ./booklet.sh

date
