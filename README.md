# Worship lyrics presentation suite

**The common 636 (+3) Thai worship songs as gathered together by OMF Thailand.**

The Doxology is included in the beginning, and the songs "The Lord's Prayer" as song 637
and "The Lord is our shelter" as song 638.

* Repo: https://github.com/pepa65/thaiworship
* Build: All files can be built with the bash script `build-all.sh`.

## songbook.sh

### Produce files for worship apps
#### Produce files for use in the Worship app (PWA)
* Command: `songbook.sh`

The bash script `songbook.sh` builds all files in the `app` directory:
* Icons
* `app.webmanifest` and `index.html`
* The html-files for each song: `*.html`
* When matching mp3 files are present in the `mp3` directory, they get linked.

#### Produce files for use in Song Book (Soli Deo Gloria app on Android & iOS)
* Command: `songbook.sh pdf` (alternatively: `songbook.sh png`)

The bash script `songbook.sh` can build all files necessary: `songbook/*.pdf` and
`songs.json` (with intermediate files `songbook/*.htm`) [or `songbook/*.png`].
The files `songs.json` and `songlistVersion.json` need to be present at
https://good4.eu/ and the song files need to be located wherever the URL in the
`lyrics` field in the json file points to (`good4.eu/pdf/*.pdf`).
The json file could also include URLs to audio files in a `audio` field
(all matching mp3 files in the `mp3` directory), right now `good4.eu/mp3/*.mp3`.
The file `songlistVersion.json` needs to be updated whenever any of the files
gets changed/updated, so the app knows to refresh its cache.

## worship.sh

### Produce single-page browser application for song lyrics display

The bash script `worship.sh` builds the single-page browser application `worship.html` and `worship.html5`
from the html-head file `worship.head`, the javascript code part `worship.js` 
and the CSS style sheet `worship.css`.

The content is provided by the files `worship.songs` and `worship.index`

<!--[View the result online](https://good4.eu/thws)-->
[View the result online](https://songs.godat.work)

## worshipp.sh

### Produce single-webpage of all song lyrics for easy use on handhelds

The bash script `worshipp.sh` builds the single-webpage `worshipp.html` and `worshipp.html5`
from the html-head file `worshipp.head` and the CSS style sheet `worshipp.css`.

The content is provided by the files `worship.songs` and `worship.index`

<!--[View the result online](https://good4.eu/thw)-->
[View the result online](https://song.godat.work)

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

The booklet is an evangelistic booklet. The BookletA5.pdf is editable with LibreOffice.
The a5toa4 script in [pepa65's misc gitlab repo](https://gitlab.com/pepa65/misc)
can convert it into BookletA4.pdf for printing.
Just call it like: `bash a5toa4 -r BookletA5.pdf`
