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
		((p_open)) && echo "</p>" >>"$html_file"
		titleline=${title_indexes[${rest%% *}]}
		echo "<h2 id=\"${rest%% *}\">$titleline</h2><p>" >>"$html_file"
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

## link to the app
echo '<br /><a href="https://play.google.com/store/apps/details?id=net.surehope.songbook.thai" title="Song Book app"><img src="data:image/png;base64,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"><br /><b>ลงแอพนมัสการไทย</b></a><br /><br />' >>"$html_file"
## Write copyright
echo '<div><a href="mailto:worship@godat.work?subject=Thai%20Worship">contact</a> <a href="http://omf.org/thailand" target="_blank">OMF International</a> © '"$(date +%Y)</div>" >>"$html_file"
## close body/html
echo '</body></html>' >>"$html_file"

## Make additional html5 file
(
	echo -e '<!DOCTYPE html>\n<html lang="th">\n<meta charset="utf-8">'
	sed -e '1,5d' -e 's@ />@>@g' -e '/<\/head>/d' "$html_file"
) >"$html5_file"

exit 0
