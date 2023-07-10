# Worship lyrics presentation suite v0.9.0

**The common 636 (+3) Thai worship songs as gathered together by OMF Thailand.**

The Doxology is included in the beginning, and the songs "The Lord's Prayer" as song 637
and "The Lord is our shelter" as song 638.

* Build: All files can be built with the bash script `build-all.sh`.

## worship.sh

### Produce single-page browser application for song lyrics display

The bash script `worship.sh` builds the single-page browser application `worship.html` and `worship.html5`
from the html-head file `worship.head`, the javascript code part `worship.js` 
and the CSS style sheet `worship.css`.

The content is provided by the files `worship.songs` and `worship.index`

[View the output](https://good4.eu/thws)

## worshipp.sh

### Produce single-webpage of all song lyrics for easy use on handhelds

The bash script `worshipp.sh` builds the single-webpage `worshipp.html` and `worshipp.html5`
from the html-head file `worshipp.head` and the CSS style sheet `worshipp.css`.

The content is provided by the files `worship.songs` and `worship.index`

[View the output](https://good4.eu/thw)

## songbook.sh

## Produce png files for use in Song Book (Soli Deo Gloria app on Android & iOS)

The bash script `songbook.sh` builds the files necessary: `songbook/*.png` and
`songs.csv` plus intermediate files `songbook/*.htm` and `songbook/*.pdf`.

## openlp.sh

### Produce xml files for import in OpenLP presentation software

The bash script `openlp.sh` makes xml song files for import into
[OpenLP](http://openlp.org), a presentation application.

## pdf.sh

### Produce the single-column and double-column pdf documents 

The bash script `pdf.sh` builds the single-column `worship.pdf` and
the double-column `worship2.pdf` documents using [Weasyprint](http://weasyprint.org),
which uses `worship.htm` and `worship2.htm` as input.

## Booklet

The BookletA5.pdf is editable with LibreOffice. The a5toa4 script in
[pepa65's misc gitlab repo](https://gitlab.com/pepa65/misc) can convert it into
BookletA4.pdf for printing. Just call it like: `bash a5toa4 -r BookletA5.pdf`
