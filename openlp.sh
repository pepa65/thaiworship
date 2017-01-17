#!/bin/bash
## openlp.sh
## Expects worship.songs in the same directory
## Outputs xml files for each song in the subdirectory OpenLP
## (These can be imported by the OpenLP presentation software)
##
## Syntax worship.songs:
## - Title starts song, hyphen in the first character, followed by index-string (number/id), 1 space, title
## - First line of the verse can be (or contain) [ร้องรับ] for chorus to be marked
## - Verses with a line on each line
## - End of verse/song by equals sign as the first character (rest empty)
## - Lines starting with plus sign are section headers, appear in the index of titles
## - Conventions: no double spaces, starting or trailing spaces; 'instructions' in square brackets

self=$(readlink -e "$0")
dir=${self%/*}  ## directory where the build-script resides has all necessary files
xml="$dir/OpenLP"
songs="$dir/worship.songs"

mkdir -p "$xml"
chorus=0

p0="<?xml version='1.0' encoding='UTF-8'?>
<song xmlns=\"http://openlyrics.info/namespace/2009/song\" version=\"0.8\" createdIn=\"OpenLP 2.0.5\" modifiedIn=\"OpenLP 2.0.5\" modifiedDate=\""
md=$(date -Iseconds)
p1='">
 <properties>
  <titles><title>'
ti='999 Title'
p2='</title></titles>
  <authors><author> </author></authors>
 </properties>
 <lyrics>'
p3v='  <verse name="v'
p3c='  <verse name="c'
vn=0  ## verse number
cn=0  ## chorus number
p4='"><lines>'
br='<br/>'  ## apparently, the <line> tags can be used as well
p5='</lines></verse>
'
p6=' </lyrics>
</song>
'
while read line
do
	case ${line:0:1} in
		-) ## title: finish song
			((vn+cn)) && echo "$p6" >>"$name"  ## unless it's the very first one!
			## Start new song
			ti=${line:1}
			name="$xml/${ti%% *}.xml"  ## filename is songnumber
			echo "$p0$md$p1$ti$p2" >"$name"
			vn=0 cn=0 lines='' ;;
		+) ## h3 section header: ignored
			true ;; 
		=) ## verse end: finish verse
			echo -n "$lines$p5" >>"$name"
			lines='' ;;
		*) ## songline
			if [[ $lines ]]
			then  ## not the first line
				lines+=$br
			else  ## first line
				[[ $line =~ '[ร้องรับ]' ]] && chorus=1 || chorus=0
				((chorus)) && p3="$p3c$((++cn))" || p3="$p3v$((++vn))"
				echo -n "$p3$p4" >>"$name"
			fi
			lines+="$line" ;;
	esac
done <"$songs"

echo -n "$p6" >>"$name"

exit 0
