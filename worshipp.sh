#!/bin/bash
##
## worshipp.sh
##
## Worshipp v0.5 Copyright 2016 OMF International under a GPL-3.0 license
##
## Makes a single-webpage (html,css) with all the songs, combining:
##  head_file (html-head), songs_file (song content), index_file (song indexes), and css_file (css)
## Expects these files in the same directory, and outputs worshipp.html
##
## Syntax songs_file: (configurable, see declarations below)
## - Title starts song: -hyphen- in the first character, followed by index-string, 1 space, and the songtitle
##   (index starting with 1-9 will be displayed as such, otherwise hidden through css)
## - Verses with a line on each line (newline breaks a line within a verse, but otherwise don't matter)
## - Verse separator: =equals= sign as the first character (rest gets ignored), ignored if not after a verse line
## - Section header: lines starting with +plus+ sign; these appear in the index of titles before the next song title
## - Double spaces, starting or trailing spaces will be removed
## - Preferences: put 'singing instructions' in square brackets
##
## The index_file is a semicolon separated csv with no header record and 7 fields:
## - Song index: all index-string in the songs_file should be in the index_file
## - Key
## - Thai title
## - Thai start
## - English title
## - English start
## - Song information (authors, album, classification, etc.)
## Only Song index, Key, Thai title and English title are used
##
## The head_file is the html with the head section, the body with Help slide, start of Index slide (div not closed)
##
## The css_file the CSS
##

self=$(readlink -e "$0")
dir=${self%/*}  ## directory where the build-script resides has all necessary files
html_file="$dir/worshipp.html"
head_file="$dir/worshipp.head"  ## open div will be closed in code, open body & html as well
css_file="$dir/worshipp.css"
songs_file="$dir/worship.songs"
index_file="$dir/worship.index"
t1='-'  ## Song Title
s1='='  ## Verse Separator
h1='+'  ## Section Header

## Reading song index, key, Thai title, English title from the index_file
declare -A title_indexes
while read line
do
	index=$(cut -d';' -f1 <<<"$line")
	th_title=$(cut -d';' -f3 <<<"$line")
	en_title=$(cut -d';' -f5 <<<"$line")
	## no-number index
	title="$index. "
	[[ ${index:0:1} == [1-9] ]] || title=""
	[[ $en_title ]] && en_title=" ($en_title)"
	title+="$th_title$en_title"
	title_indexes[$index]=$title
done <"$index_file"

/bin/cat "$head_file" >"$html_file"
while read line
do
	first=${line:0:1}
	rest=${line:1}
	if [[ $first = $t1 ]]
	then  ## title
		titleline=${title_indexes[${rest%% *}]}
		echo "<h2>$titleline</h2>" >>"$html_file"
	elif [[ $first = $h1 ]]  ## h3 section header
	then
		true
	elif [[ $first = $s1 ]]  ## verse separator
	then
		true
	else  ## songline -- if not empty
		[[ $line ]] && echo "<p>$line</p>" |sed 's@\[@<i>[@g' |sed 's@]@]</i>@g' >>"$html_file"
	fi
done <"$songs_file"

## Write copyright
echo "<div>© 2016 <a href="http://omf.org/thailand">OMF International</a></div>" >>"$html_file"
## close body/html
echo "</body></html>" >>"$html_file"
## insert css
sed -i "/<style type=\"text\/css\">/r $css_file" "$html_file"

exit 0
