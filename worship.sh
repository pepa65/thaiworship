#!/bin/bash
##
## worship.sh
##
## Copyright 2018 OMF International under a GPL-3+ license
##
## Makes a single-webpage application (html,css,javascript) with all the songs, combining:
##  head_file (html-head), songs_file (song content), index_file (song indexes),
##  js_file (javascript) and css_file (css)
##  All these files are expected in the same directory.
## Outputs: worship.html, worship.html5
##
## The head_file is the html with the head section, the body with Help slide,
##  start of Index slide; div not closed, will be closed at the bottom of
##  this script.
##

self=$(readlink -e "$0")
dir=${self%/*}  ## directory where the build-script resides has all necessary files
html_file="$dir/worship.html"
html5_file="$dir/worship.html5"
head_file="$dir/worship.head"  ## open div will be closed in code, open body & html as well
js_file="$dir/worship.js"
css_file="$dir/worship.css"
songs_file="$dir/worship.songs"
index_file="$dir/worship.index"
t1='-'  ## Song Title
s1='='  ## Verse Separator
h1='+'  ## Section Header
c1='#'  ## Comment
nonum='&#160;&#160;'

#book="$dir/worship.book"
#ref="$dir/worship.ref"

## Reading song index, key, Thai title, English title from the index_file
declare -A title_indexes
while read line
do
	[[ ${line:0:1} = $c1 ]] && continue
	index=$(cut -d';' -f1 <<<"$line")
	key=$(cut -d';' -f2 <<<"$line")
	th_title=$(cut -d';' -f3 <<<"$line")
	en_title=$(cut -d';' -f5 <<<"$line")
	## no-number index: put 3 spaces, otherwise the number
	title="$index. "
	[[ ${index:0:1} == [1-9] ]] || title="<span class=\"nonum\">$title</span>$nonum"
	[[ $en_title ]] && en_title=" <span class=\"en\">($en_title)</span>"
	title+="$th_title$en_title<span class=\"key\"> $key</span>"
	title_indexes[$index]=$title
done <"$index_file"

/bin/cat "$head_file" >"$html_file"
nl=$'\n'  ## newline
page=3  ## starting slide for url
output=''  ## all songs
song=()  ## all song lines (verses)
verse=20  ## verse counter, will be reset for first song
lines=''  ## lines in verse
while read line
do
	first=${line:0:1}
	rest=${line:1}
	if [[ $first = $c1 ]]
	then
		continue
	elif [[ $first = $t1 ]]
	then  ## title: finish song
		#echo ${song[0]} >>th_start.txt
		if [[ $lines ]]
		then  ## the previous verse didn't get finished
			((verse>1)) && song+=("$title$verse/")  ## add $verse</a> hereafter
			song+=("$lines</div>$nl")
			lines=''
			((page++))
			((verse++))
		fi
		((verse--))  ## total verse counter 1 too high
		i=0
		while [[ ${song[$i]} ]]
		do  ## songline
			((i%2)) || song[$i]+="$verse</a>$nl"
			((i++))
		done
		for i in "${song[@]}"; do output+="$i"; done
		## Start new song
		titleline=${title_indexes[${rest%% *}]}
		echo "<a href=\"#p$page\">$titleline</a><br />" >>"$html_file"
		song=() verse=1
		song+=("<div class=\"slide\"><a id=\"p$page\"></a><h1>$titleline</h1><a href=\"#p2\">1/")  ## add $verse</a> later!
		title="<div class=\"slide\"><h1>$titleline</h1><a href=\"#p$page\">"  ## add $verse/ and $verse</a> later!
	elif [[ $first = $h1 ]]
	then  ## h3 section header
		echo "<h3>$rest</h3>" >>"$html_file"
	elif [[ $first = $s1 ]]
	then  ## verse separator: finish verse, another page
		if [[ $lines ]]
		then  ## ignore empty verses
			((verse>1)) && song+=("$title$verse/")  ## add $verse</a> later!
			song+=("$lines</div>$nl")
			lines=''
			((page++))
			((verse++))
		fi
		## add content of the line if not empty
		[[ $rest ]] && lines="<p>$(sed -e 's@\[@<i>[@g' -e 's@]@]</i>@g' <<<"$rest")</p>"
	else  ## add songline -- if not empty
		[[ $line ]] && lines+="<p>$(sed -e 's@\[@<i>[@g' -e 's@]@]</i>@g' <<<"$line")</p>"
	fi
done <"$songs_file"

## finish last song
if [[ $lines ]]
then  ## finish unfinished verses
	((verse>1)) && song+=("$title$verse/")  ## add $verse</a> later!
	song+=("$lines</div>$nl")
	((page++))
	((verse++))
fi
## finish unfinished song
((verse--))  ## total verse counter 1 too high
i=0
while [[ ${song[$i]} ]]
do  ## songline
  ((i%2)) || song[$i]+="$verse</a>$nl"
  ((i++))
done
for i in "${song[@]}"; do output+="$i"; done

## finish open div in html from song list page
echo "</div>" >>"$html_file"
## write all songs, no added newline
echo -n "$output" >>"$html_file"
## close body/html
echo "</body></html>" >>"$html_file"
## insert javascript and css
sed -i "/<script type=\"application\/javascript\">/r $js_file" "$html_file"
sed -i "/<style type=\"text\/css\" media=\"screen, print\">/r $css_file" "$html_file"

## Make additional html5 file
(
  echo -e '<!DOCTYPE html>\n<html lang="th">\n<meta charset="utf-8">'
  sed -e '1,5d' -e 's@ />$@>@g' -e '/^<\/head>$/d' "$html_file"
) >"$html5_file"

exit 0
