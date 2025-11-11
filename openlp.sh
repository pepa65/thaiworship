#!/usr/bin/env bash
#
# openlp.sh - Make xml files for OpenLP
#
# Expects worship.songs in the same directory
# For each song xml files are added into the subdirectory OpenLP
# (These can be imported by the OpenLP presentation software)
# Required: coreutils(readlink stat rm mkdir) date

self=$(readlink -e "$0")
dir=${self%/*}  ## directory where the build-script resides has all necessary files
xml="$dir/OpenLP"
songs="$dir/worship.songs"
st=$(stat -c%Y "$songs")
xt=$(stat -c%Y "$xml")
((xt > st)) &&
	echo "--- OpenLP files are up-to-date already" &&
	exit 0

rm -r -- "$xml"
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
	rest=${line:1}
	case ${line:0:1} in
		\#)  ## comment
			continue ;;
		-)  ## title: finish verse and song
			[[ $lines ]] && echo -n "$lines$p5" >>"$name" && lines='' ## finish verse
			((vn+cn)) && echo "$p6" >>"$name"  ## unless it's the very first one!
			## Start new song
			ti=$rest
			name="$xml/${ti%% *}.xml"  ## filename is songnumber
			echo "$p0$md$p1$ti$p2" >"$name"
			vn=0 cn=0 lines='' ;;
		+)  ## h3 section header: ignored, but also verse end
			echo -n "$lines$p5" >>"$name"
			lines='' ;;
		=)  ## verse end: finish verse
			echo -n "$lines$p5" >>"$name"
			lines=''
			line=$rest ;;&  ## Continue with the next case!
		*)  ## songline
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
echo -n "$lines$p5" >>"$name" && lines=''  ## finish verse
echo -n "$p6" >>"$name"  ## finish song

exit 0
