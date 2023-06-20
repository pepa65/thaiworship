#!/usr/bin/env bash

# worshipp.sh - Make a html page with all songs
#
# Makes a single-webpage (html+css) with all the songs, combining:
#  $head_file (html-head), $songs_file (song content) and
#  $index_file (song indexes)
#  All these files are expected in the same directory.
# Outputs: worshipp.html, worshipp.html5
#
# The $head_file is the html with the head section, the body with Help slide,
#  the start of Index slide; div not closed, will be closed at the bottom
#  of this script.

self=$(readlink -e "$0")
dir=${self%/*}  ## directory where the build-script resides has all necessary files
html_file="$dir/worshipp.html"
html5_file="$dir/worshipp.html5"
head_file="$dir/worshipp.head"  ## open div will be closed in code, open body & html as well
songs_file="$dir/worship.songs"
index_file="$dir/worship.index"
t1='-'  ## Song Title
s1='='  ## Verse Separator
h1='+'  ## Section Header
c1='#'  ## Comment

## Reading song index, key, Thai title, English title from the index_file
declare -A title_indexes
while read line
do
	[[ ${line:0:1} = $c1 ]] && continue
	index=$(cut -d';' -f1 <<<"$line")
  key=$(cut -d';' -f2 <<<"$line")
	th_title=$(cut -d';' -f3 <<<"$line")
	en_title=$(cut -d';' -f5 <<<"$line")
	## no-number index
	title="$index. "
	[[ ${index:0:1} == [1-9] ]] || title=""
	[[ $en_title ]] && en_title="<br /><span lang=\"en\">($en_title)</span>"
	title+="$th_title<span class="key">$key</span>$en_title"
	title_indexes[$index]=$title
done <"$index_file"

/bin/cat "$head_file" >"$html_file"
p_open=0
while read line
do
	first=${line:0:1}
	rest=${line:1}
	if [[ $first = $c1 ]]
	then  ## comment: next
		continue
	elif [[ $first = $t1 ]]
	then  ## title
		((p_open)) && echo -n "</p>" >>"$html_file"
		titleline=${title_indexes[${rest%% *}]}
		echo "<h2>$titleline</h2><p>" >>"$html_file"
		p_open=1
	elif [[ $first = $h1 ]]
	then  ## h3 section header, skip
		true
	elif [[ $first = $s1 ]]
	then  ## verse separator
		[[ $rest ]] && echo "<br />$rest<br />" |sed 's@\[@<i>[@g' |sed 's@]@]</i>@g' >>"$html_file"
	else  ## songline -- if not empty
		[[ $line ]] && echo "$line<br />" |sed 's@\[@<i>[@g' |sed 's@]@]</i>@g' >>"$html_file"
	fi
done <"$songs_file"

## Write copyright
echo '<div><a href="mailto:worship@thaimissions.info?subject=Thai%20Worship">contact</a> <a href="http://omf.org/thailand" target="_blank">OMF International</a> © '"$(date +%Y)</div>" >>"$html_file"
## close body/html
echo '</body></html>' >>"$html_file"

## Make additional html5 file
(
	echo -e '<!DOCTYPE html>\n<html lang="th">\n<meta charset="utf-8">'
	sed -e '1,5d' -e 's@ />$@>@g' -e '/<\/head>/d' "$html_file"
) >"$html5_file"

exit 0
