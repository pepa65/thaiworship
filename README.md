# worship suite v0.7

## Example output

The bash script `worship.sh` builds the single-page browser application
`worship.html` and `worship.html5` from the html-head file `worship.head`,
the javascript code part `worship.js` and the CSS style sheet `worship.css`.

The bash script `worshipp.sh` builds the single-webpage `worshipp.html` and
`worshipp.html5` from the html-head file `worshipp.head` (which includes the css).

These are the output samples, index.html is worship.html and index.htm is worshipp.html

The general content is provided by `worship.songs` and `worship.index`.

The bash script `pdf.sh` builds the html files `worship.htm` and `worship2.htm`
that serve as input for Weasyprint (version 0.34 or higher) which makes them
into the single-column and double-column pdf files `worship.pdf` and `worship2.pdf`.

The bash script `openlp.sh` makes xml files in directory OpenLP for each song
that can be imported by the presentation application OpenLP.
