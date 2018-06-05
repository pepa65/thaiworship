# Worship lyrics presentation suite v0.73

All files can be built with the bash script `build-all.sh`.

## worship.sh

### Produce single-page browser application for song lyrics display

The bash script `worship.sh` builds the single-page browser application `worship.html` and `worship.html5`
from the html-head file `worship.head`, the javascript code part `worship.js` 
and the CSS style sheet `worship.css`.

The content is provided by the files `worship.songs` and `worship.index`

[View the output](https://pepa65.github.io/thaiworship/index.html)

Shortcut to page: [4e4.win/thaiworship](http://4e4.win/thaiworship)

## worshipp.sh

### Produce single-webpage of all song lyrics for easy use on handhelds

The bash script `worshipp.sh` builds the single-webpage `worshipp.html` and `worshipp.html5`
from the html-head file `worshipp.head` and the CSS style sheet `worshipp.css`.

The content is provided by the files `worship.songs` and `worship.index`

[View the output](https://pepa65.github.io/thaiworship/index.htm)

Shortcut to page: [4e4.win/thworship](http://4e4.win/thworship)

## openlp.sh

### Produce xml files for import in OpenLP presentation software

The bash script `openlp.sh` makes xml song files for import into
[OpenLP](http://openlp.org), a presentation application.

## pdf.sh

### Produce html documents for generating pdf documents with Weasyprint

The bash script `pdf.sh` builds `worship.htm` and `worship2.htm` that can
be used as input for the pdf generation software [Weasyprint](http://weasyprint.org)
to produce a single-column and a double-column pdf document.

```
weasyprint worship.htm worship.pdf
weasyprint worship2.htm worship2.pdf
```

## Booklet

The BookletA5.pdf is editable with LibreOffice. The a5toa4 script in
[pepa65's misc gitlab repo](https://gitlab.com/pepa65/misc) can convert it into
BookletA4.pdf for printing. Just call it like: `bash a5toa4 BookletA5.pdf`
