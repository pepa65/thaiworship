#!/bin/bash

## build-all.sh
##
## Copyright 2018 OMF International under a GPL-3+ license
##
## Makes all the files in the project 

echo 'making OpenLP/*.xml files'
./openlp.sh
echo 'making worship.html'
./worship.sh
echo 'making worshipp.html'
./worshipp.sh
echo 'making worship.htm and worship2.htm'
## and worship.pdf, worship2.pdf
./pdf.sh
