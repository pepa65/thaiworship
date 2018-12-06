#!/bin/bash
##
## pdf.sh
##
## Produces 2 html files with embedded css with all the songs that can be used
##  by Weasyprint http://weasyprint.org to make pdf documents, one with a
##  single column and one with a double column.
## Needs: head_file, head2_file (html-head), songs_file (song content)
##  and index_file (song indexes).
##  All these files are expected in the same directory.
## Outputs: worship.htm, worship2.htm
##
## The head_file is the html with the head section and the body with the title.
##  will be closed at the end of this script.

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
cat <<-\EOP |tee -a "$html_file" >>"$html2_file"
	<br /><br />
	<h2>เกี่ยวกับเพลงนมัสการ</h2>
	<p class="footer">
	<a href="https://4e4.win/thws" title="Browser-based Thai worship projection for online usage">เพลงนมัสการสำหรับเครื่องฉายใช้งานออนไลน์</a><br /><br />
	<a href="https://4e4.win/thaiworship.html" title="Download browser-based Thai worship projection for offline usage">ดาวน์โหลดเพลงนมัสการสำหรับเครื่องฉายใช้งานออฟไลน์ได้</a><br /><br />
	<a href="http://gitlab.com/pepa65/thaiworship" title="Thai worship download page">เพจดาวน์โหลดเพลงนมัสการ</a><br /><br />
	<a href="mailto:worship@teamlampang.org?subject=Thai%20worship%20PDF" title="contact">ติดต่อ</a><br /><br />
	<a href="http://omf.org/thailand" title="OMF International © 2018">โอเอ็มเอฟ อินเทอร์เนชันนัล © 2018</a>
	</p></body>
	</html>
EOP

if w=$(type -P weasyprint)
then
	"$w" "$html_file" "$pdf_file"
	"$w" "$html2_file" "$pdf2_file"
else
  echo "Cannot make $pdf_file and $pdf2_file,"
  echo " weasyprint is not installed, see:"
  echo " http://weasyprint.readthedocs.io/en/latest/install.html"
  echo "Do: 'sudo pip install WeasyPrint'"
  exit 1
fi

exit 0
