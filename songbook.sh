#!/usr/bin/env bash

# songbook.sh - Make separate pdf files of each song for Song Book and html files
#
# Produce pdf files of each song with Typst and html files for the app
# [and png files with chromium] and the songs.json file for online use in
# Song Book (Soli Deo Gloria app).
#
# Input: $songsfile (song content), expected in the same directory, and the
#        mp3 files `$mp3/<id>.mp3`.
# Output: $out/*.pdf $app/*.html songs.json (id,title,lyricstype,lyrics,audiourl[,category])
#         [$out/*.png; $out/*.htm are intermediate files]
#
# Usage: songbook.sh [-j|--json]
#        -j/--json:  Only generate the json file
# Required: typst[github.com/typst/typst] ghostscript(gs)
#           coreutils(rm mkdir cat) [chromium/google-chrome-stable]

# Determine pdf(1) or png(0) files
pdf=1

[[ $1 = -j || $1 = --json ]] && json=1 || json=0
self=$(readlink -e "$0")
dir=${self%/*}  # The build-script directory should have all necessary files
songsfile="$dir/worship.songs" link="https://good4.eu"
jsonfile="$dir/songs.json" out="$dir/songbook" jsonstr="[\n" app="$dir/app"
t1='-'  # Song Title
s1='='  # Verse Separator
h1='+'  # Section Header
c1='#'  # Comment
nl=$'\n'  # Newline

if ((pdf))
then # make pdfs
	# Use Typst to produce pdfs and Ghostscript to make them smaller
	if ! ty=$(type -P typst)
	then # Typst not found in PATH
		echo "Cannot make pdf files, Typst not installed, get it here:"
		echo " https://github.com/typst/typst/releases"
		exit 1
	fi

	ty+=' c' # Compile
	if ! gs=$(type -P gs)
	then # Ghostscript not found in PATH
		echo "Cannot optimize pdf files, Ghostscript not installed, do:"
		echo " sudo apt install ghostscript"
		exit 2
	fi

	gs+=' -q -sDEVICE=pdfwrite -o' # Quietly use pdfwrite
	# Prepare for Typst
	tmp=$(mktemp) type=pdf ext=pdf
	header='#set page(width:auto, height:auto, margin:4mm)\n#set align(center)\n#set text(font:"Garuda")'
else # Make pngs
	# Use Chromium to make screenshots of html and Mogrify to cut them
	if ch=$(type -P chromium) || ch=$(type -P chrome)
	then : # OK
	else # neither chromium nor chrome found in PATH
		echo "Cannot make png files, Chromium/Chrome not installed, do:"
		echo " sudo apt install chromium"
		exit 3
	fi

	ch+=' --headless=new --window-size=512,4096 --disable-gpu --enable-chrome-browser-cloud-management --force-device-scale-factor=1'
	if ! mo=$(type -P mogrify)
	then # ImageMagick not found in PATH
		echo "Cannot transform png files, ImageMagick not installed, do:"
		echo " sudo apt install imagemagick"
		exit 4
	fi

	mo+=' -density 120 -depth 3 -trim +repage -bordercolor White -border 24 -define png:color-type=3'
	# Prevent Chromium/Chrome from locking
	rm -f ~/.config/chromium/SingletonLock ~/.config/google-chrome/SingletonLock
	type=image ext=png
fi

Outputsong(){ # I:pdf ty gs ch mo tmp out id
	if ((pdf))
	then
		$ty "$tmp" "$out/$id.pdf"
		$gs "$tmp" "$out/$id.pdf" >/dev/null
		mv "$tmp" "$out/$id.pdf"
		echo -e "</div>\n<script>\n\tdocument.addEventListener('click', function(){\n	location.href='index.html';\n});\n</script>" >>"$app/$id.html"
	else
		$ch --screenshot="$out/$id.png" "$out/$id.htm" 2>/dev/null
		$mo "$out/$id.png"
	fi
}

Handleline(){ # 1:line 2:newverse I:pdf tmp out id
	if ((pdf))
	then # Handle for typst
		(($2)) && echo >>"$tmp"
		echo -ne "\n$(sed -e 's@\[@#set text(fill:rgb("#888"));[@g' -e 's@]@]#set text(fill:black);@g' <<<"$1")\\" >>"$tmp"
		# Handle for html
		(($2)) && echo -n "<p>" >>"$app/$id.html"
		echo "$(sed -e 's@\[@<i>[@g' -e 's@]@]</i>@g' <<<"$1")<br>" >>"$app/$id.html"
	else
		(($2)) && echo -n "<p>" >>"$out/$id.htm"
		echo "$(sed -e 's@\[@<i>[@g' -e 's@]@]</i>@g' <<<"$1")<br>" >>"$out/$id.htm"
	fi
}

# $app needs generation of index.html and link to favicon
((!json)) && rm -rf -- "$out" && mkdir "$out"
title= category='ข้อสรรเสริญ' cat=
while read line
do # Process $songsfile line
	first=${line:0:1} rest=${line:1}
	[[ $first = $c1 ]] && continue
	if [[ $first = $t1 ]]
	then # title
		if [[ $title ]]
		then # Finish previous title
			((!json)) && Outputsong
		fi
		id=${rest%% *} title=${rest/ /. }  # Insert a dot after the id in the title
		[[ -f mp3/$id.mp3 ]] && mp3=", \"audiourl\":\"$link/mp3/$id.mp3\"" || mp3=
		#cat=", \"category\":\"$category\""  # Category is (not yet) used
		# Also remove the number from title number 0
		jsonstr+="{\"id\":\"$id\", \"title\":\"${title#0. }\", \"lyricstype\":\"$type\", \"lyrics\":\"$link/$type/$id.$ext\"$mp3$cat},\n"
		if ((!json))
		then # Start song
			if ((pdf))
			then # Generate typst title
				echo -e "$header" >"$tmp"
				echo -n "=== $title" >>"$tmp"
				# Generate html for app
				cat <<-HEAD >"$app/$id.html"
					<!DOCTYPE html>
					<html lang="th">
					<title>$title</title>
					<link rel="icon" href="favicon.png">
					<style>
					body{margin:0; font-family:"Garuda",serif; font-size:20pt;}
					i{font-size:80%; font-style:normal; color:#888;}
					div{text-align:center; overflow:auto;}
					p{white-space:nowrap;}
					</style>
					<div>
					<p><b>$title</b>
				HEAD
				echo -n "<p>" >>"$app/$id.html"
			else # Generate html title
				cat <<-HEAD >"$out/$id.htm"
					<!DOCTYPE html>
					<html lang="th">
					<title>$title</title>
					<style>
					body{font-family:"Garuda",serif; font-size:16pt; font-kerning:normal;}
					i{font-size:90%; font-style:normal; color:#888;}
					@page{size:299mm 999mm; margin:.4in;}
					</style>
					<p><b>$title</b>
				HEAD
				echo -n "<p>" >>"$out/$id.htm"
			fi
		fi
	elif [[ $first = $h1 ]]
	then # Section/category
		category=$rest
	elif [[ $first = $s1 ]]
	then # Verse separator
		((!json)) && Handleline "$rest" 1
	else # Songline -- if not empty
		((!json)) && Handleline "$line" 0
	fi
done <"$songsfile"

# Finish last title
((!json)) && Outputsong

echo -e "${jsonstr:0: -3}\n]" >"$jsonfile"  # Remove the final comma and append a closing square-bracket

exit 0
