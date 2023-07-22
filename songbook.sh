#!/usr/bin/env bash

# songbook.sh - Make separate png files of each song for Song Book
#
# Produce png files [based on pdf files] based on html files for each song,
# and the json file, for online use in Song Book (Soli Deo Gloria app).
#
# Input: $songs_file (song content), expected in the same directory.
# Output: $out/*.png $json (id,title,lyricstype,lyrics,[audiourl,]category)
#         [$out/*.pdf and] $out/*.htm are intermediate products
#
# Usage: songbook.sh [-j|--json]
#        -j/--json:  Only generate the json file
# Required: imagemagick([convert] mogrify) [weasyprint]
#           chromium/google-chrome-stable coreutils(rm mkdir cat)

out='songbook'
jsonfile='songs.json'
pdf=0

[[ $1 = -j || $1 = --json ]] && json=1 || json=0
self=$(readlink -e "$0")
dir=${self%/*}  # directory where the build-script resides has all necessary files
songs_file="$dir/worship.songs"
link="https://good4.eu"
jsonstr="[\n"

t1='-'  # Song Title
s1='='  # Verse Separator
h1='+'  # Section Header
c1='#'  # Comment
nl=$'\n'  # Newline

if ((pdf))
then # Use Weasyprint and convert
	if ! we=$(type -P weasyprint)
	then # WeasyPrint not found in PATH
	  echo "Cannot make pdf files, WeasyPrint not installed, see:"
	  echo " http://weasyprint.readthedocs.io/en/latest/install.html"
	  echo "Either do:"
		echo " sudo apt install weasyprint"
		echo "or:"
		echo " sudo pip install WeasyPrint"
	  exit 1
	fi
	if ! co=$(type -P convert)
	then # ImageMagick not found in PATH
	  echo "Cannot transform png files, ImageMagick not installed, do:"
		echo " sudo apt install imagemagick"
	  exit 2
	fi
else # User chromium and mogrify
	if ch=$(type -P chromium) || ch=$(type -P chrome)
	then : # OK
	else # neither chromium nor chrome found in PATH
	  echo "Cannot make png files, chromium/chrome not installed, do:"
		echo " sudo apt install chromium"
	  exit 3
	fi
	if ! mo=$(type -P mogrify)
	then # ImageMagick not found in PATH
	  echo "Cannot transform png files, ImageMagick not installed, do:"
		echo " sudo apt install imagemagick"
	  exit 4
	fi
fi

((json)) || rm -rf -- "$out"
((json)) || mkdir "$out"
((pdf)) || rm -f ~/.config/chromium/SingletonLock

title= type='ข้อสรรเสริญ'
while read line
do # Process $songs_file line
	first=${line:0:1}
	rest=${line:1}
	[[ $first = $c1 ]] && continue
	if [[ $first = $t1 ]]
	then # title
		if [[ $title ]]
		then # Finish previous title
			if ((!json))
			then
				if ((pdf))
				then
					$we -v "$out/$id.htm" "$out/$id.pdf"
					$co -density 120 -depth 3 "$out/$id.pdf" -trim +repage -bordercolor White -border 24 -define png:color-type=3 "$out/$id.png"
				else
					$ch --headless=new --window-size=512,4096 --disable-gpu --enable-chrome-browser-cloud-management --force-device-scale-factor=1 --screenshot="$out/$id.png" "$out/$id.htm"
					$mo -density 120 -depth 3 -trim +repage -bordercolor White -border 24 -define png:color-type=3 "$out/$id.png"
				fi
			fi
		fi
		id=${rest%% *} title=${rest/ /. }  # Insert a dot after the id in the title
		[[ -f mp3/$id.mp3 ]] && mp3="\"audio\":\"$link/mp3/$id.mp3\", " || mp3=
		jsonstr+="{\"id\":\"$id\", \"title\":\"${title#0. }\", \"lyricstype\":\"image\", \"lyrics\":\"$link/songs/$id.png\", $mp3\"category\":\"$type\"},\n"  # Remove the number from title number 0
		if ((!json))
		then cat <<-HEAD >"$out/$id.htm"
				<!DOCTYPE html>
				<html lang="th">
				<title>$title</title>
				<style>
				body{font-family:"Arundina Serif",serif; font-size:16pt; font-kerning:normal;}
				i{font-size:90%; font-style:normal; color:#666;}
				@page{size:299mm 999mm; margin:.4in;}
				</style>
				<p><b>$title</b>
				<p>
			HEAD
		fi
	elif [[ $first = $h1 ]]
	then # h2 section header
		type=$rest
	elif [[ $first = $s1 ]]
	then # verse separator
		if ((!json))
		then
			echo "<p>" >>"$out/$id.htm"
			[[ $rest ]] && echo "$(sed -e 's@\[@<i>[@g' -e 's@]@]</i>@g' <<<"$rest")<br>" >>"$out/$id.htm"
		fi
	else # songline -- if not empty
		if ((!json))
		then [[ $line ]] && echo "$(sed -e 's@\[@<i>[@g' -e 's@]@]</i>@g' <<<"$line")<br>" >>"$out/$id.htm"
		fi
	fi
done <"$songs_file"

# Finish last title
if ((!json))
then
	if ((pdf))
	then
		$we -v "$out/$id.htm" "$out/$id.pdf"
		$co -density 120 -depth 3 "$out/$id.pdf" -trim +repage -bordercolor White -border 24 -define png:color-type=3 "$out/$id.png"
	else
		$ch --headless=new --window-size=512,4096 --disable-gpu --enable-chrome-browser-cloud-management --force-device-scale-factor=1 --screenshot="$out/$id.png" "$out/$id.htm"
		$mo -density 120 -depth 3 -trim +repage -bordercolor White -border 24 -define png:color-type=3 "$out/$id.png"
	fi
fi

echo -e "${jsonstr:0: -3}\n]" >"$jsonfile"  # Remove the final comma and append a closing square-bracket
exit 0
