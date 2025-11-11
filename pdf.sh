#!/usr/bin/env bash

# pdf.sh - Make single and double column html files for WeasyPrint
#
# Produces 2 pdf files (a single-column and a double column file)
# by transforming 2 html files with embedded css with all the songs
# by Weasyprint (http://weasyprint.org).
# Needs: $head_file, $head2_file (html-head), $songs_file (song content)
#  and $index_file (song indexes).
#  All these files are expected in the same directory.
# Outputs: worship.pdf and worship2.pdf (and: worship.htm, worship2.htm)
#
# The $head_file is the html with the head section and the body with the title.
#  will be closed at the end of this script.
# Required: weasyprint (https://github.com/Kozea/WeasyPrint)

self=$(readlink -e "$0")
dir=${self%/*}  ## directory where the build-script resides has all necessary files
html_file="$dir/worship.htm"
html2_file="$dir/worship2.htm"
head_file="$dir/pdf.head"
head2_file="$dir/pdf2.head"
songs_file="$dir/worship.songs"
index_file="$dir/worship.index"
pdf_file="$dir/worship.pdf"
pdf2_file="$dir/worship2.pdf"
t1='-'  ## Song Title
s1='='  ## Verse Separator
h1='+'  ## Section Header
c1='#'  ## Comment
nl=$'\n'  ## Newline
pt=$(stat -c%Y "$pdf2_file") wit=$(stat -c%Y "$index_file") wst=$(stat -c%Y "$songs_file")
wt=$((wit<wst ? wst : wit))
((wt < pt)) &&
  echo "--- The pdf files are up-to-date already" &&
  exit 0

## Reading song index, key, Thai title, English title from the index_file
declare -A title_indexes
while read line
do
	[[ ${line:0:1} = $c1 ]] && continue
	index=$(cut -d';' -f1 <<<"$line")
	th_title=$(cut -d';' -f3 <<<"$line")
	en_title=$(cut -d';' -f5 <<<"$line")
	## number or no-number index
	[[ ${index:0:1} == [1-9] ]] && num="$index. " || num=""
	## English subtitle or not
	[[ $en_title ]] && title='<h3 class="sub">' || title='<h3>'
	title+="$num$th_title</h3><p>"
	[[ $en_title ]] && title+="$nl<span lang=\"en\">($en_title)</span><br />"
	title_indexes[$index]=$title
done <"$index_file"

/bin/cat "$head_file" >"$html_file"
/bin/cat "$head2_file" >"$html2_file"
p_open=0
div_open=0
while read line
do
	first=${line:0:1}
	rest=${line:1}
	[[ $first = $c1 ]] && continue
	if [[ $first = $t1 ]]
	then  ## title
		((p_open)) && echo -n "</p>" |tee -a "$html_file" >>"$html2_file"
		echo "${title_indexes[${rest%% *}]}" |tee -a "$html_file" >>"$html2_file"
		p_open=1
	elif [[ $first = $h1 ]]
	then  ## h2 section header
		((p_open)) && echo -n "</p>" |tee -a "$html_file" >>"$html2_file" && p_open=0
		((div_open)) && echo -n "</div>" >>"$html2_file"
		echo "<h2>$rest</h2>" >>"$html_file"
		echo "<h2>$rest</h2><div>" >>"$html2_file"
		div_open=1
	elif [[ $first = $s1 ]]
	then  ## verse separator
		echo "</p><p>" |tee -a "$html_file" >>"$html2_file"
		[[ $rest ]] && echo "$(sed -e 's@\[@<i>[@g' -e 's@]@]</i>@g' <<<"$rest")<br />" |tee -a "$html_file" >>"$html2_file"
	else  ## songline -- if not empty
		[[ $line ]] && echo "$(sed -e 's@\[@<i>[@g' -e 's@]@]</i>@g' <<<"$line")<br />" |tee -a "$html_file" >>"$html2_file"
	fi
done <"$songs_file"

## Write ending
echo -n "</p>" |tee -a "$html_file" >>"$html2_file"
echo -n "</div>" >>"$html2_file"
cat <<-EOP |tee -a "$html_file" >>"$html2_file"
	<br /><br />
	<div class="footer">
	<h2>เกี่ยวกับเพลงนมัสการ</h2>
	<a href="https://godat.work/w" title="Browser-based Thai worship projection for online usage">เพลงนมัสการสำหรับเครื่องฉายใช้งานออนไลน์</a><br /><br />
	<a href="https://godat.work/w" download="thaiworship.html" title="Download browser-based Thai worship projection for offline usage">ดาวน์โหลดเพลงนมัสการสำหรับเครื่องฉายใช้งานออฟไลน์ได้</a><br /><br />
	<a href="http://songs.godat.work" title="Thai worship songs on one page">เพลงนมัสการในเพจเดียวกัน</a><br /><br />
	<a href="https://play.google.com/store/apps/details?id=net.surehope.songbook.thai" title="Song Book app">ลงแอพเพลงนมัสการไทย <img src="googleplay.png"></a><br /><br />
	<a href="mailto:worship@godat.work?subject=Thai%20worship%20PDF" title="contact">ติดต่อ</a><br /><br />
	<a href="http://omf.org/thailand" title="OMF International © $(date +%Y)">โอเอ็มเอฟ อินเทอร์เนชันนัล © $(date +%Y)</a><br /><br />
	</div></body>
	</html>
EOP

if ! w=$(type -P weasyprint)
then # WeasyPrint not in PATH
  echo "Cannot make $pdf_file and $pdf2_file, weasyprint not installed, see:"
  echo " http://weasyprint.readthedocs.io/en/latest/install.html"
  echo "Either do:"
	echo " sudo apt install weasyprint"
	echo "or:"
	echo " sudo pip install WeasyPrint"
  exit 1
fi

"$w" -v "$html_file" "$pdf_file"
"$w" -v "$html2_file" "$pdf2_file"

exit 0
