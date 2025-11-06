#!/usr/bin/env bash

# songbook.sh - Make pdf and html files of each song
#
# Produce:
# - html files for Thai Worship app
# - pdf files of each song with Typst [pdf]
# - png files with chromium [png]
# - songs.json file for online use in Song Book (Soli Deo Gloria app)
#
# Input: worship.songs (song content), expected in the same directory, and the mp3 files `$mp3/<id>.mp3`.
# Output:
# - app/*.html [Thai Worship app]
# - songs.json(id,title,lyricstype,lyrics,audiourl[,category]) [Song Book]
# - [pdf] songbook/*.pdf [Song Book]
# - [png] songbook/*.png (Song Book old style, songbook/*.htm are intermediate files)
#
# Usage: songbook.sh [pdf|png]
# 'pdf' for Song Book, 'png' for old-style Song Book, none for Thai Worship app
# Required: typst[github.com/typst/typst]:'pdf' ghostscript(gs):'pdf'
#           coreutils(rm mkdir cat) chromium/google-chrome-stable:'png'

pdf=0 png=0
[[ $1 = pdf ]] &&
	pdf=1
[[ $1 = png ]] &&
	png=1
[[ $1 && pdf = 0 && png = 0 ]] &&
	echo "Optional argument only 'pdf' or 'png', not: $1" &&
	exit 1

self=$(readlink -e "$0")
cd ${self%/*}  # The build-script directory must have all necessary files
link="https://good4.eu" jsonstr="[\n"
t1='-'  # Song Title
s1='='  # Verse Separator
h1='+'  # Section Header
c1='#'  # Comment
nl=$'\n'  # Newline

if ((pdf))
then # make pdfs
	type=pdf ext=pdf
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
	tmp=$(mktemp)
	header='#set page(width:auto, height:auto, margin:4mm)\n#set align(center)\n#set text(font:"Garuda")'
fi
if ((png))
then # Make pngs
	type=image ext=png
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

	mo+=' -depth 3 -trim +repage -bordercolor white -border 24 -define png:color-type=3'
	# Prevent Chromium/Chrome from locking
	rm -f ~/.config/chromium/SingletonLock ~/.config/google-chrome/SingletonLock
fi

Outputsong(){ # I:pdf,png,ty,gs,ch,mo,tmp,out,id,app,mp3js
	# Output for app (always)
	echo -e "</div>\n<script>\n$mp3js" >>"app/$id.html"
	echo -e "document.addEventListener('click', function(){location.href='index.html'});\n</script>" >>"app/$id.html"
	if ((pdf))
	then # Output for pdf
		$ty "$tmp" "songbook/$id.pdf"
		$gs "$tmp" "songbook/$id.pdf" >/dev/null
		mv "$tmp" "songbook/$id.pdf"
	fi
	if ((png))
	then # Output for png
		$ch --screenshot="songbook/$id.png" "songbook/$id.htm" 2>/dev/null
		$mo "songbook/$id.png"
	fi
}

Handleline(){ # 1:line 2:newverse I:pdf,png,tmp,out,id
	# Handle for html (always)
	(($2)) &&
		echo -n "<p>" >>"app/$id.html"
	echo "$(sed -e 's@\[@<i>[@g' -e 's@]@]</i>@g' <<<"$1")<br>" >>"app/$id.html"
	if ((pdf))
	then # Handle for typst
		(($2)) &&
			echo >>"$tmp"
		echo -ne "\n$(sed -e 's@\[@#set text(fill:rgb("#888"));[@g' -e 's@]@]#set text(fill:black);@g' <<<"$1")\\" >>"$tmp"
	fi
	if ((png))
	then # Handle for png
		(($2)) &&
			echo -n "<p>" >>"songbook/$id.htm"
		echo "$(sed -e 's@\[@<i>[@g' -e 's@]@]</i>@g' <<<"$1")<br>" >>"songbook/$id.htm"
	fi
}

((pdf || png)) && # Recreate songbook directory
	rm -rf -- songbook &&
	mkdir songbook
rm -rf -- app &&
	mkdir app
cp android-chrome-512x512.png android-chrome-192x192.png favicon-32x32.png favicon-16x16.png apple-touch-icon.png safari-pinned-tab.svg maskable_icon.png favicon.ico app.webmanifest app/
cp app.head app/index.html
title= category='ข้อสรรเสริญ' cat=
while read line
do # Process worship.songs line
	first=${line:0:1} rest=${line:1}
	[[ $first = $c1 ]] &&
		continue
	if [[ $first = $t1 ]]
	then # title
		# Finish previous title
		[[ $title ]] &&
			Outputsong
		id=${rest%% *}
		[[ $id = 0 ]] &&
			title=${rest#0 } ||
			title=${rest/ /. }  # Insert a dot after the id in the title
		# Find English title
		eng=$(grep "^$id;" worship.index) &&
			eng=$(cut -d';' -f5 <<<"$eng")
		[[ $eng ]] &&
			eng="<i>$eng</i><br>"
		# Write to index for app (always)
		echo "<a href=\"$id.html\">$title<br>$eng</a>" >>app/index.html
		mp3json= mp3html= mp3js= mp3css=
		[[ -f mp3/$id.mp3 ]] &&
			mp3json=", \"audiourl\":\"$link/mp3/$id.mp3\"" \
			mp3css="#top{position:fixed; top:0; width:100%; text-align:center; opacity:.9;}"$'\n' \
			mp3css+="audio{transform:scale(1.6) translateY(10px);}"$'\n' \
			mp3html="<div id=\"top\"><audio controls src=\"../mp3/$id.mp3\"></div>"$'\n' \
			mp3js="document.getElementsByTagName('audio')[0].focus();"
		#catjson=", \"category\":\"$category\""  # Category is (not yet) used
		jsonstr+="{\"id\":\"$id\", \"title\":\"$title\", \"lyricstype\":\"$type\", \"lyrics\":\"$link/$type/$id.$ext\"$mp3json$catjson},\n"
		# Start song
		# Generate html for app (always)
		cat <<-HEAD1 >"app/$id.html"
			<!DOCTYPE html>
			<html lang="th">
			<title>$title</title>
			<link rel="icon" type="image/png" sizes="192x192" href="android-chrome-192x192.png">
			<style>
			body{margin:0; font-family:"Garuda",serif; font-size:20pt; background-color:#fff;}
			$mp3css#song{text-align:center; overflow:auto; margin:60px 0 40em;}
			p{white-space:nowrap;}
			i{font-size:80%; font-style:normal; color:#888;}
			@media (prefers-color-scheme:dark){html{filter:invert(1);}}
			</style>
			$mp3html<div id="song">
			<p><b>$title</b>
		HEAD1
		echo -n "<p>" >>"app/$id.html"
		if ((pdf))
		then # Generate typst title
			echo -e "$header" >"$tmp"
			echo -n "=== $title" >>"$tmp"
		fi
		if ((png))
		then # Generate html title
			cat <<-HEAD2 >"songbook/$id.htm"
				<!DOCTYPE html>
				<html lang="th">
				<title>$title</title>
				<style>
				body{font-family:"Garuda",serif; font-size:16pt; font-kerning:normal;}
				i{font-size:90%; font-style:normal; color:#888;}
				@page{size:299mm 999mm; margin:.4in;}
				</style>
				<p><b>$title</b>
			HEAD2
			echo -n "<p>" >>"songbook/$id.htm"
		fi
	elif [[ $first = $h1 ]]
	then # Section/category
		category=$rest
	elif [[ $first = $s1 ]]
	then # Verse separator
		Handleline "$rest" 1
	else # Songline -- if not empty
		Handleline "$line" 0
	fi
done <"worship.songs"

# Finish last title
Outputsong

((png || pdf)) && # Make json-file for Song Book
	echo -e "${jsonstr:0: -3}\n]" >songs.json && # Remove the final comma and append a closing square-bracket
	echo "[{\"songlistVersion\": \"$(date +%Y%m%d)\"}]" >songlistVersion.json

# Make link
cd app
ln -s ../mp3

exit 0
