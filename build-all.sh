#!/bin/bash

## build-all.sh
##
## Copyright 2017 OMF International under a GPL-3+ license
##
## Makes all the files in the project 

echo 'making OpenLP/*.xml files'
./openlp.sh
echo 'making worship.html'
./worship.sh
echo 'making worshipp.html'
./worshipp.sh
echo 'making worship.htm and worship2.htm'
./pdf.sh

if w=$(command -v weasyprint)
then
	echo 'making worship.pdf'
	$w worship.htm worship.pdf
	echo 'making worship2.pdf'
	$w worship2.htm worship2.pdf
else
	echo 'Cannot make worship.pdf and worship2.pdf,'
	echo ' weasyprint is not installed, see:'
	echo ' http://weasyprint.readthedocs.io/en/latest/install.html'
	exit 1
fi

exit 0
