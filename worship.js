//<![CDATA[<!--
// Copyright (C) 2017 OMF International (GPL-3+ licence)
// Based on slidy, copyright 2005 W3C (MIT licence)
var w3 = {
	// user modifiable: website, email, year, langs, timer, dfont, sizept, minpt, maxpt, steppt
	website: "omf.org/thailand", // Go to website
	email: "worship@teamlampang.org", // Contact by email
	year: "2017", // Copyright year
	langs: ["th", "en", "nl"], // Interface languages offered; empty: all available
	timer: -1, // In minutes; 0: keep time; pos: count down to zero; neg: don't show
	dfont: -1, // Initial font size adjustment (see sizept, minpt, maxpt, steppt)
	sizept: 10, // Base font size
	minpt: 6, // Min.font size
	maxpt: 64, // Max.font size
	steppt: 2, // Font adjustment
	// classify which kind of browser we're running under
	ns_pos: (window.pageYOffset !== undefined),
	khtml: ((navigator.userAgent).indexOf("KHTML") >= 0),
	opera: ((navigator.userAgent).indexOf("Opera") >= 0),
	ipad: ((navigator.userAgent).indexOf("iPad") >= 0),
	iphone: ((navigator.userAgent).indexOf("iPhone") >= 0),
	android: ((navigator.userAgent).indexOf("Android") >= 0),
	ie: (document.all !== undefined && !this.opera),
	ie6: (!this.ns_pos && navigator.userAgent.indexOf("MSIE 6") !== -1),
	ie7: (!this.ns_pos && navigator.userAgent.indexOf("MSIE 7") !== -1),
	ie8: (!this.ns_pos && navigator.userAgent.indexOf("MSIE 8") !== -1),
	ie9: (!this.ns_pos && navigator.userAgent.indexOf("MSIE 9") !== -1),
	// data for swipe and double tap detection on touch screens
	last_tap: 0,
	prev_tap: 0,
	start_x: 0,
	start_y: 0,
	delta_x: 0,
	delta_y: 0,
	max_y: -1,
	// are we running as XHTML? (doesn't work on Opera)
	slide_number: 0, // integer slide count: 0, 1, 2, ...
	counter: null, // element containing timer, slide number and optionally jump
	jump: "", // slide to jump to
	scrollhack: 0,
	song: [], // song numbers for each slide
	slides: [], // set to array of slide divs
	notes: [], // set to array of handout divs
	backgrounds: [], // set to array of background divs
	observers: [], // list of observer functions
	toolbar: null, // element containing toolbar
	title: null, // document title
	last_shown: null, // last incrementally shown item
	//eos: null, // span element for end of slide indicator
	toc: null, // table of contents
	outline: null, // outline element with the focus
	selected_text_len: 0, // length of drag selection on document
	view_all: 0, // 1 to view all slides + handouts
	want_toolbar: 1, // user preference to show/hide toolbar
	mouse_click_enabled: 0, // enables left-click for next slide
	scroll_hack: 0, // IE work around for position: fixed
	time_inc: 0,
	interval: 200, // 200ms interval for timer
	disable_slide_click: 0, // used by clicked anchors
	lang: 0, // The current language index; starts as the first of langs
	tocpage: "#p2",
	help_anchor: null, // used for keyboard focus hack in showToolbar()
	help_page: "#p1", // http://www.w3.org/Talks/Tools/Slidy2/help/help.html
	// needed for efficient resizing
	last_width: 0,
	last_height: 0,
	// Needed for cross browser support for relative width/height on object elements.
	// The work-around is to save width/height attributes and then to recompute absolute width/height dimensions on resizing
	objects: [],
	// attach initialiation event handlers
	set_up: function (){
		var init = function(){ w3.init();};
		if (window.addEventListener !== undefined) window.addEventListener("load", init, 0);
		else window.attachEvent("onload", init);},
	hide_slides: function (){
		if (document.body && !w3.initialized) document.body.style.visibility = "hidden";
		else setTimeout(w3.hide_slides, 50);},
	// hack to persuade IE to compute correct document height as needed for simulating fixed positioning of toolbar
	ie_hack: function (){
		window.resizeBy(0, -1);
		window.resizeBy(0, 1);},
	init: function (){
		this.dfont *= this.steppt;
		w3.setup_lang();
		this.add_toolbar();
		this.wrap_implicit_slides();
		this.collect_slides();
		this.collect_notes();
		this.collect_backgrounds();
		this.objects = document.body.getElementsByTagName("object");
		this.patch_anchors();
		this.slide_number = this.find_slide_number(location.href);
		window.offscreenbuffering = 1;
		this.timer = (isNaN(this.timer) ? -1 : this.timer * 60000); // min to ms
		if (this.timer === 0){
			this.timer = w3.interval;
			this.time_inc = w3.interval;}
		else this.time_inc = -w3.interval;
		this.hide_image_toolbar(); // suppress IE image toolbar popup
		this.init_outliner(); // activate fold/unfold support
		this.title = document.title;
		this.keyboardless = (this.ipad || this.iphone || this.android);
		if (this.keyboardless){
			w3.remove_class(w3.toolbar, "hidden");
			this.want_toolbar = 0;}
		// work around for opera bug
		if (this.slides.length > 0){
			var slide = this.slides[this.slide_number];
			if (this.slide_number > 0){
				this.set_visibility_all_incremental("visible");
				this.last_shown = this.previous_incremental_item(null);
				this.set_eos_status(1);}
			else {
				this.last_shown = null;
				this.set_visibility_all_incremental("hidden");
				this.set_eos_status(!this.next_incremental_item(this.last_shown));}
			this.set_location();
			this.add_class(this.slides[0], "first-slide");
			w3.show_slide(slide);}
		this.toc = this.table_of_contents();
		w3.reset_lang();
		// Bind event handlers without interfering with custom page scripts
		// Tap events behave too weirdly to support clicks reliably on iPhone and iPad, so exclude these from click handler
		if (!this.keyboardless){
			this.add_listener(document.body, "click", this.mouse_button_click);
			this.add_listener(document.body, "mousedown", this.mouse_button_down);}
		this.add_listener(document, "keydown", this.key_down);
		this.add_listener(document, "keypress", this.key_press);
		this.add_listener(window, "resize", this.resized);
		this.add_listener(window, "scroll", this.scrolled);
		this.add_listener(window, "unload", this.unloaded);
		this.add_listener(document, "gesturechange", function (){ return 0;});
		this.attach_touch_handers(this.slides);
		this.single_slide_view();
		this.resized();
		if (this.ie7) setTimeout(w3.ie_hack, 100);
		this.show_toolbar();
		// for back button detection
		setInterval(function (){ w3.check_location();}, w3.interval);
		document.body.style.visibility = "visible";
		document.body.style.display = "inherit";
		w3.initialized = 1;},
	setup_lang: function (){
		var i, j, k, p, b, text, sep, br, langs = [];
		for (i in w3.strings) if (w3.langs.indexOf(i) >= 0) langs.push(i);
		w3.langs = langs;
		w3.lang = 0;
		// If no languages set/left: use all available
		if (w3.langs.length === 0) for (i in w3.strings) w3.langs.push(i);
		if (w3.langs.length === 1){ // Don't offer options if only 1 language
			p = document.getElementById(w3.langs[0]);
			p.style = "display: none;";}
		else for (i = 0; i < w3.langs.length; i++){
			p = document.getElementById(w3.langs[i]);
			for (j = 0; j < w3.langs.length; j++){
				b = document.createElement("b");
				b.innerHTML = "Tab ";
				p.appendChild(b);
				text = document.createTextNode(w3.strings[w3.langs[j]].tab1);
				p.appendChild(text);
				for (k = 0; k < w3.langs.length; k++){
					text = document.createTextNode(w3.strings[w3.langs[j]][w3.langs[k]]);
					p.appendChild(text);
					if (k < w3.langs.length - 1){
						if (k < w3.langs.length - 2) sep = w3.strings[w3.langs[j]].sep1;
						else sep = w3.strings[w3.langs[j]].sep2;
						text = document.createTextNode(sep);
						p.appendChild(text);}}
				text = document.createTextNode(w3.strings[w3.langs[j]].tab2);
				p.appendChild(text);
				b = document.createElement("b");
				b.innerHTML = w3.strings[w3.langs[j]].down;
				p.appendChild(b);
				text = document.createTextNode(w3.strings[w3.langs[j]].tab3);
				p.appendChild(text);
				br = document.createElement("br");
				p.appendChild(br);}}},
	add_translations: function (element, string){
		var span, i;
		for (i = 0; i < this.langs.length; i++){
			span = this.create_element("span");
			this.add_class(span, this.langs[i]);
			span.innerHTML = this.localize(string, this.langs[i]);
			element.appendChild(span);}},
	table_of_contents: function (){
		var toc = this.create_element("div");
		this.add_class(toc, "toc hidden");
		toc.setAttribute("tabindex", "0"); // focusable
		var heading = this.create_element("div");
		this.add_class(heading, "toc-heading");
		this.add_translations(heading, "toc");
		toc.appendChild(heading);
		var previous = null, title, song, a, num, first, name, br;
		// 0: Help, 1: Content, 2+: Verses
		for (var i = 0; i < this.slides.length; i++){
			title = this.has_class(this.slides[i], "title");
			// Storing song numbers for each slide
			song = this.slide_name(i).split(".");
			if (song[1]) w3.song[i] = song[0];
			else song[1] = this.slide_name(i);
			a = this.create_element("a");
			a.setAttribute("href", "#p" + (i + 1));
			if (title) this.add_class(a, "titleslide");
			num = this.create_element("span");
			first = song[0].charAt(0);
			if (first < "1" || first > "9") num.setAttribute("class", "nonum");
			num.innerHTML = w3.song[i] + ". ";
			a.appendChild(num);
			if (i === 0) this.add_translations(a, "help");
			else if (i === 1) this.add_translations(a, "titles");
			else {
				name = document.createTextNode(song[1]);
				a.appendChild(name);}
			a.onclick = w3.toc_click;
			a.onkeydown = w3.toc_key_down;
			a.previous = previous;
			if (previous) previous.next = a;
			if (i === 0) toc.first = a;
			if (this.slide_name(i) !== this.slide_name(i - 1)){ // Only list differing slide names (new song)
				toc.appendChild(a);
				if (i < this.slides.length - 1){
					br = this.create_element("br");
					toc.appendChild(br);}}
			previous = a;}
		// Explicitly set help and contents page
		w3.song[0] = w3.localize("help");
		w3.song[1] = w3.localize("index");
		toc.focus = function (){
			if (this.first) this.first.focus();};
		toc.onmouseup = w3.mouse_button_up;
		toc.onclick = function (e){
			if (!e) e=window.event;
			if (w3.selected_text_len <= 0) w3.hide_table_of_contents(1);
			w3.stop_propagation(e);
			if (e.cancel !== undefined) e.cancel = 1;
			if (e.returnValue !== undefined) e.returnValue = 0;
			return 0;};
		document.body.insertBefore(toc, document.body.firstChild);
		return toc;},
	is_shown_toc: function (){
		return !w3.has_class(w3.toc, "hidden");},
	show_table_of_contents: function (){
		w3.remove_class(w3.toc, "hidden");
		var toc = w3.toc;
		toc.focus();
		if (w3.ie7 && w3.slide_number === 0) setTimeout(w3.ie_hack, 100);},
	hide_table_of_contents: function (focus){
		w3.add_class(w3.toc, "hidden");
		if (focus && !w3.opera && !w3.has_class(w3.toc, "hidden")) w3.set_focus();},
	toggle_table_of_contents: function (){
		if (w3.is_shown_toc()) w3.hide_table_of_contents(1);
		else w3.show_table_of_contents();},
	// called on clicking toc entry
	toc_click: function (e){
		if (!e) e = window.event;
		var target = w3.get_target(e);
		if (target && target.nodeType === 1){
			var uri = target.getAttribute("href");
			if (uri){
				var slide = w3.slides[w3.slide_number];
				w3.hide_slide(slide);
				w3.slide_number = w3.find_slide_number(uri);
				slide = w3.slides[w3.slide_number];
				w3.last_shown = null;
				w3.set_location();
				w3.set_visibility_all_incremental("hidden");
				w3.set_eos_status(!w3.next_incremental_item(w3.last_shown));
				w3.show_slide(slide);
				try {
					if (!w3.opera) w3.set_focus();}
				catch (e){ console.log(e);}}}
		w3.hide_table_of_contents(1);
		if (w3.ie7) w3.ie_hack();
		w3.stop_propagation(e);
		return w3.cancel(e);},
	// called onkeydown for TOC entry
	toc_key_down: function (event){
		var key;
		if (!event) event = window.event;
		// kludge around NS/IE differences
		if (window.event) key = window.event.keyCode;
		else if (event.which) key = event.which;
		else return 1; // Yikes! unknown browser
		// ignore event if key value is zero as for alt on Opera and Konqueror
		if (!key) return 1;
		// check for concurrent control/command/alt key but are these only present on mouse events?
		if (event.ctrlKey || event.altKey) return 1;
		if (key === 13){ // Enter
			var uri = this.getAttribute("href");
			if (uri){
				var slide = w3.slides[w3.slide_number];
				w3.hide_slide(slide);
				w3.slide_number = w3.find_slide_number(uri);
				slide = w3.slides[w3.slide_number];
				w3.last_shown = null;
				w3.set_location();
				w3.set_visibility_all_incremental("hidden");
				w3.set_eos_status(!w3.next_incremental_item(w3.last_shown));
				w3.show_slide(slide);
				try {
					if (!w3.opera) w3.set_focus();}
				catch (e){ console.log(e);}}
			w3.hide_table_of_contents(1);
			if (self.ie7) w3.ie_hack();
			return w3.cancel(event);}
		if (key === 40 && this.next){ // Down
			this.next.focus();
			return w3.cancel(event);}
		if (key === 38 && this.previous){ // Up
			this.previous.focus();
			return w3.cancel(event);}
		return 1;},
	touchstart: function (e){
		// a double touch often starts with a
		// single touch due to fingers touching
		// down at slightly different times
		// thus avoid calling preventDefault here
		this.prev_tap = this.last_tap;
		this.last_tap = (new Date).getTime();
		var touch = e.touches[0];
		this.pageX = touch.pageX;
		this.pageY = touch.pageY;
		this.screenX = touch.screenX;
		this.screenY = touch.screenY;
		this.clientX = touch.clientX;
		this.clientY = touch.clientY;
		this.delta_x = this.delta_y = 0;},
	touchmove: function (e){
		// override native gestures for single touch
		if (e.touches.length > 1) return;
		e.preventDefault();
		var touch = e.touches[0];
		this.delta_x = touch.pageX - this.pageX;
		this.delta_y = touch.pageY - this.pageY;},
	touchend: function (e){
		// default behavior for multi-touch
		if (e.touches.length > 1) return;
		var delay = (new Date).getTime() - this.last_tap;
		var dx = this.delta_x;
		var dy = this.delta_y;
		var abs_dx = Math.abs(dx);
		var abs_dy = Math.abs(dy);
		if (delay < 500 && (abs_dx > 100 || abs_dy > 100)){
			if (abs_dx > abs_dy / 2){
				e.preventDefault();
				if (dx < 0) w3.next_slide("incremental"); // swipe Right
				else w3.previous_slide("incremental");} // swipe Left
			else if (abs_dy > 2 * abs_dx){
				e.preventDefault();
				if (dy < 0) window.location = w3.tocpage; // swipe Up
				else w3.toggle_lang();}}}, // swipe Down
	toggle_view: function (){
		if (this.view_all){
			this.view_all = 0;
			this.single_slide_view();}
		else {
			this.view_all = 1;
			this.show_all_slides();}},
	show_all_slides: function (){
		this.remove_class(document.body, "single_slide");
		this.set_visibility_all_incremental("visible");},
	single_slide_view: function (){
		this.add_class(document.body, "single_slide");
		this.set_visibility_all_incremental("visible");
		this.last_shown = this.previous_incremental_item(null);},
	// suppress IE's image toolbar pop up
	hide_image_toolbar: function (){
		if (!this.ns_pos){
			var images = document.getElementsByTagName("img");
			for (var i = 0; i < images.length; i++) images[i].setAttribute("galleryimg", "no");}},
	unloaded: function (){ console.log("unloaded");},
	// Safari and Konqueror don't yet support getComputedStyle() and they always reload page when location.href is updated
	is_KHTML: function (){
		var agent = navigator.userAgent;
		return (agent.indexOf("KHTML") >= 0);},
	// find slide name from first h1 element default to document title + song number
	slide_name: function (index){
		var name = null;
		var slide = this.slides[index];
		var heading = this.find_heading(slide);
		if (heading) name = this.extract_text(heading);
		if (!name) name = this.title + " " + (index + 1);
		name.replace(/\&/g, "&amp;");
		name.replace(/\</g, "&lt;");
		name.replace(/\>/g, "&gt;");
		return name;},
	// find first h1 element in DOM tree
	find_heading: function (node){
		if (!node || node.nodeType !== 1) return null;
		if (node.nodeName.toLowerCase() === "h1") return node;
		var child = node.firstChild;
		while (child){
			node = this.find_heading(child);
			if (node) return node;
			child = child.nextSibling;}
		return null;},
	// recursively extract text from DOM tree
	extract_text: function (node){
		if (!node) return "";
		// text nodes
		if (node.nodeType === 3) return node.nodeValue;
		// elements
		if (node.nodeType === 1){
			node = node.firstChild;
			var text = "";
			while (node){
				text = text + this.extract_text(node);
				node = node.nextSibling;}
			return text;}
		return "";},
	// find content from specified meta element "name" (unless another attribute is given)
	find_meta: function (element, attr){
		var i, name, meta = document.getElementsByTagName("meta");
		if (!attr) attr = "name";
		for (i = 0; i < meta.length; i++){
			name = meta[i].getAttribute(attr);
			if (name === element) return meta[i].getAttribute("content");}
		return null;},
	// for XHTML do we also need to specify namespace?
	init_outliner: function (){
		var items = document.getElementsByTagName("li");
		for (var i = 0; i < items.length; i++){
			var target = items[i];
			if (!this.has_class(target.parentNode, "outline")) continue;
			target.onclick = this.outline_click;
			if (this.foldable(target)){
				target.foldable = 1;
				target.onfocus = function (){ w3.outline = this;};
				target.onblur = function (){ w3.outline = null;};
				if (!target.getAttribute("tabindex")) target.setAttribute("tabindex", "0"); // focusable
				if (this.has_class(target, "expand")) this.unfold(target);
				else this.fold(target);}
			else {
				this.add_class(target, "nofold");
				target.visible = 1;
				target.foldable = 0;}}},
	foldable: function (item){
		if (!item || item.nodeType !== 1) return 0;
		var node = item.firstChild;
		while (node){
			if (node.nodeType === 1 && this.is_block(node)) return 1;
			node = node.nextSibling;}
		return 0;},
	// ### CHECK ME ### switch to add/remove "hidden" class
	fold: function (item){
		if (item){
			this.remove_class(item, "unfolded");
			this.add_class(item, "folded");}
		var node = item ? item.firstChild : null;
		while (node){
			if (node.nodeType === 1 && this.is_block(node)){ // element
				w3.add_class(node, "hidden");}
			node = node.nextSibling;}
		item.visible = 0;},
	// ### CHECK ME ### switch to add/remove "hidden" class
	unfold: function (item){
		if (item){
			this.add_class(item, "unfolded");
			this.remove_class(item, "folded");}
		var node = item ? item.firstChild : null;
		while (node){
			if (node.nodeType === 1 && this.is_block(node)){ // element
				w3.remove_class(node, "hidden");}
			node = node.nextSibling;}
		item.visible = 1;},
	outline_click: function (e){
		if (!e) e = window.event;
		var rightclick = 0;
		var target = w3.get_target(e);
		while (target && target.visible === undefined)
			target = target.parentNode;
		if (!target) return 1;
		if (e.which) rightclick = (e.which === 3);
		else if (e.button) rightclick = (e.button === 2);
		if (!rightclick && target.visible !== undefined){
			if (target.foldable){
				if (target.visible) w3.fold(target);
				else w3.unfold(target);}
			w3.stop_propagation(e);
			e.cancel = 1;
			e.returnValue = 0;}
		return 0;},
	add_toolbar: function (){
		var toolbar = document.getElementById("toolbar");
		if (toolbar) toolbar.parentNode.removeChild(toolbar);
		var right, left, counter, gap, help, contents, mailto, email, copyright, year;
		mailto = this.find_meta("reply-to") || w3.email;
		var date = this.find_meta("date") || w3.year;
		this.toolbar = this.create_element("div");
		this.toolbar.setAttribute("id", "toolbar");
		this.toolbar.setAttribute("class", "toolbar");
		if (!w3.want_toolbar) this.toolbar.style.display = "none";
		// a reasonably behaved browser
		if (this.ns_pos || !this.ie6){
			right = this.create_element("div");
			right.setAttribute("class", "barright");
			counter = this.create_element("span");
			// counter.innerHTML // added later
			right.appendChild(counter);
			this.toolbar.appendChild(right);
			left = this.create_element("div");
			left.setAttribute("class", "barleft");
			// global end of slide indicator
			//this.eos = this.create_element("span");
			//this.eos.innerHTML = "* ";
			//left.appendChild(this.eos);
			help = this.create_element("a");
			help.setAttribute("href", this.help_page);
			help.setAttribute("title", this.localize("helptext"));
			help.innerHTML = this.localize("help");
			left.appendChild(help);
			this.help_anchor = help; // save for focus hack
			gap = document.createTextNode(" - ");
			left.appendChild(gap);
			contents = this.create_element("a");
			contents.setAttribute("href", "javascript:w3.toggle_table_of_contents()");
			contents.setAttribute("title", this.localize("toc"));
			contents.innerHTML = this.localize("index");
			left.appendChild(contents);
			gap = document.createTextNode(" - ");
			left.appendChild(gap);
			if (mailto){
				email = this.create_element("a");
				email.setAttribute("href", "mailto:" + mailto + "?subject=" + this.localize("subject") + " " + document.title);
				email.setAttribute("title", this.localize("email"));
				email.innerHTML = this.localize("corrections");
				left.appendChild(email);
				gap = document.createTextNode(" - ");
				left.appendChild(gap);}
			copyright = this.create_element("a");
			copyright.setAttribute("href", "//" + w3.website);
			copyright.setAttribute("title", w3.website);
			copyright.setAttribute("target", "_blank");
			copyright.innerHTML = this.localize("org") + " ";
			left.appendChild(copyright);
			year = document.createTextNode(" © " + date.substr(0, 4) + " - ");
			left.appendChild(year);
			// Finalize the toolbar
			this.toolbar.setAttribute("tabindex", "0"); // focusable
			this.toolbar.appendChild(left);}
		else { // IE6 so need to work around its poor CSS support
			this.toolbar.style.position = (this.ie7 ? "fixed" : "absolute");
			this.toolbar.style.zIndex = "200";
			this.toolbar.style.width = "99.9%";
			this.toolbar.style.height = "1.5em";
			this.toolbar.style.top = "auto";
			this.toolbar.style.bottom = "0";
			this.toolbar.style.left = "0";
			this.toolbar.style.right = "0";
			this.toolbar.style.textAlign = "left";
			this.toolbar.style.fontSize = "60%";
			this.toolbar.style.color = "#822";
			this.toolbar.borderWidth = 0;
			this.toolbar.className = "toolbar";
			this.toolbar.style.background = "rgb(240,240,240)";
			// Would like to have help text left aligned and page counter right aligned, floating divs don't work,
			// so instead use nested absolutely positioned divs.
			help = this.create_element("a");
			help.setAttribute("href", this.help_page);
			help.setAttribute("title", this.localize("helptext"));
			help.innerHTML = this.localize("help");
			this.toolbar.appendChild(help);
			this.help_anchor = help; // save for focus hack
			gap = document.createTextNode(" - ");
			this.toolbar.appendChild(gap);
			contents = this.create_element("a");
			contents.setAttribute("href", "javascript:toggleTableOfContents()");
			contents.setAttribute("title", this.localize("toc"));
			contents.innerHTML = this.localize("index");
			this.toolbar.appendChild(contents);
			gap = document.createTextNode(" - ");
			this.toolbar.appendChild(gap);
			if (mailto){
				email = this.create_element("a");
				email.setAttribute("href", "mailto:" + mailto + "?subject=" + this.localize("subject") + " " + document.title);
				email.setAttribute("title", this.localize("email"));
				email.innerHTML = this.localize("corrections");
				left.appendChild(email);
				gap = document.createTextNode(" - ");
				this.toolbar.appendChild(gap);}
			copyright = this.create_element("a");
			copyright.setAttribute("href", "//" + w3.website);
			copyright.setAttribute("title", w3.website);
			copyright.setAttribute("target", "_blank");
			copyright.innerHTML = this.localize("org") + " ";
			this.toolbar.appendChild(copyright);
			year = document.createTextNode(" © " + date.substr(0, 4) + " - ");
			this.toolbar.appendChild(year);
			counter = this.create_element("div");
			counter.style.position = "absolute";
			counter.style.width = "auto";
			counter.style.height = "1.5em";
			counter.style.top = "auto";
			counter.style.bottom = 0;
			counter.style.right = "0";
			counter.style.textAlign = "right";
			counter.style.color = "#822";
			counter.style.background = "rgb(240,240,240)";
			// counter.innerHTML added later
			this.toolbar.appendChild(counter);}
		// ensure that click isn't passed through to the page
		this.toolbar.onclick = function (e){
			if (!e) e = window.event;
			var target = e.target;
			if (!target && e.srcElement) target = e.srcElement;
			// work around Safari bug
			if (target && target.nodeType === 3) target = target.parentNode;
			w3.stop_propagation(e);
			if (target && target.nodeName.toLowerCase() !== "a") w3.mouse_button_click(e);};
		this.counter = counter;
		this.set_eos_status(0);
		document.body.appendChild(this.toolbar);},
	// wysiwyg editors make it hard to use div elements, e.g. amaya loses the div when you copy and paste
	// This function wraps div elements around implicit slides which start with an h1 element and
	// continue up to the next heading or div element
	wrap_implicit_slides: function (){
		var i, heading, node, next, div;
		var headings = document.getElementsByTagName("h1");
		if (!headings) return;
		for (i = 0; i < headings.length; i++){
			heading = headings[i];
			if (heading.parentNode !== document.body) continue;
			node = heading.nextSibling;
			div = document.createElement("div");
			this.add_class(div, "slide");
			document.body.replaceChild(div, heading);
			div.appendChild(heading);
			while (node){
				if (node.nodeType === 1){ // an element
					if (node.nodeName.toLowerCase() === "h1") break;
					if (node.nodeName.toLowerCase() === "div"){
						if (this.has_class(node, "slide")) break;
						if (this.has_class(node, "handout")) break;}}
				next = node.nextSibling;
				node = document.body.removeChild(node);
				div.appendChild(node);
				node = next;}}},
	attach_touch_handers: function(slides){
		var i, slide;
		for (i = 0; i < slides.length; i++){
			slide = slides[i];
			this.add_listener(slide, "touchstart", this.touchstart);
			this.add_listener(slide, "touchmove", this.touchmove);
			this.add_listener(slide, "touchend", this.touchend);}},
	// return new array of all slides
	collect_slides: function (){
		var slides = [], i, div, node, divs = document.body.getElementsByTagName("div");
		for (i = 0; i < divs.length; i++){
			div = divs[i];
			if (this.has_class(div, "slide")){
				// add slide to collection
				slides.push(div);
				// hide each slide as it is found
				this.add_class(div, "hidden");
				// add dummy <br /> at end for scrolling hack
				node = document.createElement("br");
				div.appendChild(node);
				node = document.createElement("br");
				div.appendChild(node);}
			// workaround for Firefox SVG reload bug which otherwise replaces 1st SVG graphic with 2nd
			else if (this.has_class(div, "background")) div.style.display = "block";}
		this.slides = slides;},
	// return new array of all <div class="handout">
	collect_notes: function (){
		var notes = [], div, i, divs = document.body.getElementsByTagName("div");
		for (i = 0; i < divs.length; i++){
			div = divs[i];
			if (this.has_class(div, "handout")){
				notes.push(div);
				this.add_class(div, "hidden");}}
		this.notes = notes;},
	// Make array of all divs with class background
	collect_backgrounds: function (){
		var backgrounds = [], div, i, divs = document.body.getElementsByTagName("div");
		for (i = 0; i < divs.length; i++){
			div = divs[i];
			if (this.has_class(div, "background")){
				backgrounds.push(div);
				this.add_class(div, "hidden");}}
		this.backgrounds = backgrounds;},
	// Set click handlers on all anchors
	patch_anchors: function (){
		var self = w3;
		var handler = function (event){
			// compare this.href with location.href for link to another slide in this doc
			if (self.page_address(this.href) === self.page_address(location.href)){
				// yes, so find new slide number
				var newslidenum = self.find_slide_number(this.href);
				if (newslidenum !== self.slide_number){
					var slide = self.slides[self.slide_number];
					self.hide_slide(slide);
					self.slide_number = newslidenum;
					slide = self.slides[self.slide_number];
					self.show_slide(slide);
					self.set_location();}}
			else w3.stop_propagation(event);
			this.blur();
			self.disable_slide_click = 1;};
		var anchors = document.body.getElementsByTagName("a");
		for (var i = 0; i < anchors.length; i++){
			if (window.addEventListener) anchors[i].addEventListener("click", handler, 0);
			else anchors[i].attachEvent("onclick", handler);}},
	// ### CHECK ME ### see which functions are invoked via setTimeout either directly or indirectly for use of w3 vs this
	show_slide_number: function (){
		var timer = w3.get_timer(), jump = "", fill = Array(6 - w3.jump.length).join("&#8194;"); // ensp
		if (w3.jump) jump = " - " + w3.localize("go") + " <span class=\"go\">&#160;" + w3.jump + fill + "</span>";
		w3.counter.innerHTML = timer + w3.localize("slide") + " " + (w3.slide_number + 1) + "/" + w3.slides.length + jump;},
	// every w3.interval (200ms) check for location changes by Back button (doesn't work for Opera<9.5)
	check_location: function (){
		var hash = location.hash;
		if (w3.slide_number > 0 && (hash === "" || hash === "#")) w3.goto_slide(0);
		else if (hash.length > 2 && hash !== "#p" + (w3.slide_number + 1)){
			var num = parseInt(location.hash.substr(2));
			if (!isNaN(num)) w3.goto_slide(num - 1);}
		if (w3.timer > 0) w3.timer += w3.time_inc;
		w3.show_slide_number();},
	get_timer: function (){
		var timer = "";
		if (w3.timer >= 0){
			var mins, secs;
			secs = Math.floor(w3.timer / 1000);
			mins = Math.floor(secs / 60);
			secs = secs % 60;
			timer = mins + ":" + (secs < 10 ? "0" : "") + secs + " - ";}
		return timer;},
	// This doesn't push location onto history stack for IE, for which a hidden iframe hack is needed: load page into
	// the iframe with script that sets parent's location.hash but that won't work for standalone use unless we can
	// create the page dynamically via a javascript: URL
	set_location: function (){
		var uri = w3.page_address(location.href);
		var hash = "#p" + (w3.slide_number + 1);
		if (w3.slide_number >= 0) uri = uri + hash;
		// use history.pushState if available
		if (history.pushState !== undefined){
			var song = "";
			if (w3.song[w3.slide_number]) song = w3.song[w3.slide_number];
			document.title = w3.title + " " + song;
			history.pushState(0, document.title, hash);
			w3.show_slide_number();
			w3.notify_observers();
			return;}
		// history.pushState not available
		if (w3.ie && (w3.ie6 || w3.ie7)) w3.push_hash(hash);
		if (uri !== location.href) location.href = uri; // && !khtml
		if (this.khtml) hash = w3.slide_number + 1;
		if (!this.ie && location.hash !== hash && location.hash !== "") location.hash = hash;
		document.title = w3.title + " " + (w3.slide_number + 1);
		w3.show_slide_number();
		w3.notify_observers();},
	notify_observers: function (){
		var slide = this.slides[this.slide_number];
		for (var i = 0; i < this.observers.length; i++)
			this.observers[i](this.slide_number + 1, this.find_heading(slide).innerText, location.href);},
	add_observer: function (observer){
		for (var i = 0; i < this.observers.length; i++){
			if (observer === this.observers[i]) return;}
		this.observers.push(observer);},
	remove_observer: function (o){
		for (var i = 0; i < this.observers.length; i++){
			if (o === this.observers[i]){
				this.observers.splice(i, 1);
				break;}}},
	page_address: function (uri){
		var i = uri.indexOf("#");
		if (i < 0) i = uri.indexOf("%23");
		// check if anchor is entire page
		if (i < 0) return uri; // yes
		return uri.substr(0, i);},
	// only used for IE6 and IE7
	on_frame_loaded: function (hash){
		location.hash = hash;
		var uri = w3.page_address(location.href);
		location.href = uri + hash;},
	// history hack
	push_hash: function (hash){
		if (hash === "") hash = "#p1";
		window.location.hash = hash;
		var doc = document.getElementById("historyFrame").contentWindow.document;
		doc.open("javascript:'<html></html>'");
		doc.write("<html><head><script type=\"text/javascript\">window.parent.w3.on_frame_loaded('" +
				hash + "');</script></head><body>Amen</body></html>");
		doc.close();},
	// find current slide by location, find target anchor and then look for enclosing div element, finally map to slide number
	find_slide_number: function (uri){
		// first get anchor from page location
		var i = uri.indexOf("#");
		// check if anchor is entire page
		if (i < 0) return 0; // yes
		return parseInt(uri.substr(i + 2) - 1);},
	previous_slide: function (how){
		if (!w3.view_all){
			if ((how === "incremental" || w3.slide_number === 0) && w3.last_shown !== null){
				w3.last_shown = w3.hide_previous_item(w3.last_shown);
				w3.set_eos_status(0);}
			else if (w3.slide_number > 0){
				var song = w3.song[w3.slide_number];
				var slide = w3.slides[w3.slide_number];
				w3.hide_slide(slide);
				w3.slide_number -= 1;
				if (how === "song"){
					while (w3.song[w3.slide_number] === song && w3.slide_number > 0) w3.slide_number -= 1;
					var previous_song = w3.song[w3.slide_number];
					while (w3.song[w3.slide_number] === previous_song && w3.slide_number >= 0) w3.slide_number -= 1;
					w3.slide_number += 1;}
				slide = w3.slides[w3.slide_number];
				w3.set_visibility_all_incremental("visible");
				w3.last_shown = w3.previous_incremental_item(null);
				w3.set_eos_status(1);
				w3.show_slide(slide);}
			w3.set_location();
			if (!w3.ns_pos) w3.refresh_toolbar();}},
	next_slide: function (how){
		if (!w3.view_all){
			var last = w3.last_shown, slidemax = w3.slides.length - 1;
			if (how === "incremental" || w3.slide_number === slidemax) w3.last_shown = w3.reveal_next_item(w3.last_shown);
			if ((how !== "incremental" || w3.last_shown === null) && w3.slide_number < slidemax){
				var song = w3.song[w3.slide_number];
				var slide = w3.slides[w3.slide_number];
				w3.hide_slide(slide);
				w3.slide_number += 1;
				while (how === "song" && w3.slide_number < slidemax && w3.song[w3.slide_number] === song) w3.slide_number += 1;
				slide = w3.slides[w3.slide_number];
				w3.last_shown = null;
				w3.set_visibility_all_incremental("hidden");
				w3.show_slide(slide);}
			else if (!w3.last_shown && last && how === "incremental") w3.last_shown = last;
			w3.set_location();
			w3.set_eos_status(!w3.next_incremental_item(w3.last_shown));
			if (!w3.ns_pos) w3.refresh_toolbar();}},
	set_eos_status: function (state){
		if (this.eos) this.eos.style.color = (state ? "rgb(240,240,240)" : "#822");},
	// first slide is 0
	goto_slide: function (num){
		var slide = w3.slides[w3.slide_number];
		w3.hide_slide(slide);
		w3.slide_number = num;
		slide = w3.slides[w3.slide_number];
		w3.last_shown = null;
		w3.set_visibility_all_incremental("hidden");
		w3.set_eos_status(!w3.next_incremental_item(w3.last_shown));
		document.title = w3.title + " " + w3.song[num];
		w3.show_slide(slide);
		w3.show_slide_number();},
	show_slide: function (slide){
		this.sync_background(slide);
		this.remove_class(slide, "hidden");
		// work around IE9 object rendering bug
		if (!w3.view_all) setTimeout("window.scrollTo(0, 0);", 1);},
	hide_slide: function (slide){
		this.add_class(slide, "hidden");},
	set_focus: function (){
		w3.help_anchor.focus();
		setTimeout(function (){ w3.help_anchor.blur();}, 1);},
	// Show just the backgrounds pertinent to this slide when slide background-color is transparent, this should now work with rgba color values
	sync_background: function (slide){
		var background, bgColor = "transparent";
		if (slide.currentStyle) bgColor = slide.currentStyle["backgroundColor"];
		else if (document.defaultView){
			var styles = document.defaultView.getComputedStyle(slide, null);
			if (styles) bgColor = styles.getPropertyValue("background-color");}
			// else: broken implementation probably due Safari or Konqueror
		if (bgColor === "transparent" || bgColor.indexOf("rgba") >= 0 || bgColor.indexOf("opacity") >= 0){
			var slideClass = this.get_class_list(slide);
			for (var i = 0; i < this.backgrounds.length; i++){
				background = this.backgrounds[i];
				var bgClass = this.get_class_list(background);
				if (this.matching_background(slideClass, bgClass)) this.remove_class(background, "hidden");
				else this.add_class(background, "hidden");}}
		else this.hide_backgrounds();}, // forcibly hide all backgrounds
	hide_backgrounds: function (){
		var background;
		for (var i = 0; i < this.backgrounds.length; i++){
			background = this.backgrounds[i];
			this.add_class(background, "hidden");}},
	// compare classes for slide and background
	matching_background: function (slideClass, bgClass){
		var i, count, pattern, result;
		// define pattern as regular expression
		pattern = /\w+/g;
		// check background class names
		result = bgClass.match(pattern);
		for (i = count = 0; i < result.length; i++){
			if (result[i] === "hidden") continue;
			if (result[i] === "background") continue;
			count++;}
		if (count === 0) return 1; // default match
		// check for matches and place result in array
		result = slideClass.match(pattern);
		// now check if desired name is present for background
		for (i = count = 0; i < result.length; i++){
			if (result[i] === "hidden") continue;
			if (this.has_token(bgClass, result[i])) return 1;}
		return 0;},
	resized: function (){
		w3.max_y = -1;
		var width = 0;
		if (typeof window.innerWidth === "number") width = window.innerWidth; // Non IE browser
		else if (document.documentElement && document.documentElement.clientWidth)
			width = document.documentElement.clientWidth; // IE6
		else if (document.body && document.body.clientWidth) width = document.body.clientWidth; // IE4
		var height = 0;
		if (typeof window.innerHeight === "number") height = window.innerHeight; // Non IE browser
		else if (document.documentElement && document.documentElement.clientHeight)
			height = document.documentElement.clientHeight; // IE6
		else if (document.body && document.body.clientHeight) height = document.body.clientHeight; // IE4
		if (height && width / height > 1.4) width = height * 1.3333; // 1024/768
		// IE fires onresize even when only font size is changed! So we do a check to avoid blocking < and > actions
		if (width !== w3.last_width || height !== w3.last_height){
			if (width >= 1100) w3.sizept = 20;
			else if (width >= 1000) w3.sizept = 18;
			else if (width >= 800) w3.sizept = 16;
			else if (width >= 600) w3.sizept = 14;
			else if (width) w3.sizept = 10;
			// Add in initial font size adjustment
			if (w3.minpt <= w3.sizept + w3.dfont <= w3.maxpt) w3.sizept += w3.dfont;
			// Enables cross browser use of relative width/height on object elements for use with SVG and Flash media
			w3.adjust_object_dimensions(width, height);
			document.body.style.fontSize = w3.sizept + "pt";
			w3.last_width = width;
			w3.last_height = height;
			// Force reflow to work around Mozilla bug
			if (w3.ns_pos){
				var slide = w3.slides[w3.slide_number];
				w3.hide_slide(slide);
				w3.show_slide(slide);}
			// Force correct positioning of toolbar
			w3.refresh_toolbar();}},
	scrolled: function (){
		if (w3.toolbar && !w3.ns_pos && !w3.ie7){
			w3.hack_offset = w3.scroll_x_offset();
			// hide toolbar
			w3.toolbar.style.display = "none";
			// make it reappear later
			if (w3.scrollhack === 0 && !w3.view_all){
				setTimeout(function (){ w3.show_toolbar();}, 200);
				w3.scrollhack = 1;}}},
	hide_toolbar: function (){
		w3.add_class(w3.toolbar, "hidden");
		window.focus();},
	// used to ensure IE refreshes toolbar in correct position
	refresh_toolbar: function (bar_interval){
		if (!w3.ns_pos && !w3.ie7){
			w3.hide_toolbar();
			if (isNaN(bar_interval)) bar_interval = w3.interval;
			setTimeout(function (){ w3.show_toolbar();}, bar_interval);}},
	// restores toolbar after short delay
	show_toolbar: function (){
		if (w3.want_toolbar){
			w3.toolbar.style.display = "block";
			if (!w3.ns_pos){
				// adjust position to allow for scrolling
				var xoffset = w3.scroll_x_offset();
				w3.toolbar.style.left = xoffset;
				w3.toolbar.style.right = xoffset;
				w3.toolbar.style.bottom = 0;} // bottom
			w3.remove_class(w3.toolbar, "hidden");}
		w3.scrollhack = 0;
		// Set the keyboard focus to the help link on the toolbar to ensure that document has the focus
		// IE doesn't always work with window.focus() and this hack has benefit of Enter for help
		try {
			if (!w3.opera) w3.set_focus();}
		catch (e){ console.log(e);}},
	toggle_toolbar: function (){
		if (!w3.want_toolbar){
			w3.want_toolbar = 1;
			w3.toolbar.style.display = "block";}
		else {
			w3.want_toolbar = 0;
			w3.toolbar.style.display = "none";}},
	scroll_x_offset: function (){
		if (window.pageXOffset) return self.pageXOffset;
		if (document.documentElement && document.documentElement.scrollLeft) return document.documentElement.scrollLeft;
		if (document.body) return document.body.scrollLeft;
		return 0;},
	smaller: function (){
		if (w3.sizept - w3.steppt >= w3.minpt) w3.sizept -= w3.steppt;
		w3.toolbar.style.display = "none";
		document.body.style.fontSize = w3.sizept + "pt";
		var slide = w3.slides[w3.slide_number];
		w3.hide_slide(slide);
		w3.show_slide(slide);
		setTimeout(function (){ w3.show_toolbar();}, 10);},
	bigger: function (){
		if (w3.sizept + w3.steppt <= w3.maxpt) w3.sizept += w3.steppt;
		w3.toolbar.style.display = "none";
		document.body.style.fontSize = w3.sizept + "pt";
		var slide = w3.slides[w3.slide_number];
		w3.hide_slide(slide);
		w3.show_slide(slide);
		setTimeout(function (){ w3.show_toolbar();}, 10);},
	// Enables cross browser use of relative width/height on object elements for use with SVG and Flash media
	adjust_object_dimensions: function (width, height){
		for (var i = 0; i < w3.objects.length; i++){
			var obj = this.objects[i];
			var mimeType = obj.getAttribute("type");
			if (mimeType === "image/svg+xml" || mimeType === "application/x-shockwave-flash"){
				if (!obj.initialWidth) obj.initialWidth = obj.getAttribute("width");
				if (!obj.initialHeight) obj.initialHeight = obj.getAttribute("height");
				if (obj.initialWidth && obj.initialWidth.charAt(obj.initialWidth.length - 1) === "%"){
					var w = parseInt(obj.initialWidth.slice(0, obj.initialWidth.length - 1)) + width / 100;
					obj.setAttribute("width", w);}
				if (obj.initialHeight && obj.initialHeight.charAt(obj.initialHeight.length - 1) === "%"){
					var h = parseInt(obj.initialHeight.slice(0, obj.initialHeight.length - 1)) * height / 100;
					obj.setAttribute("height", h);}}}},
	reset_lang: function (lang){ // hide lang (if given) and show w3.lang
		var classes, i;
		if (!isNaN(lang)){
			classes = document.getElementsByClassName(w3.langs[lang]);
			for (i = 0; i < classes.length; i++) classes[i].style.display = "none";}
		classes = document.getElementsByClassName(w3.langs[w3.lang]);
		for (i = 0; i < classes.length; i++) classes[i].style.display = "inline";},
	toggle_lang: function (){
		var lang = w3.lang;
		w3.lang = (lang + 1) % w3.langs.length;
		w3.reset_lang(lang);
		w3.add_toolbar();},
	// Needed for Opera to inhibit default behavior since Opera delivers keyPress even if keyDown was cancelled
	key_press: function (event){
		if (!event) event = window.event;
		if (!w3.key_wanted) return w3.cancel(event);
		return 1;},
	// See e.g. http://www.quirksmode.org/js/events/keys.html for keycodes
	key_down: function (event){
		var key, target;
		w3.key_wanted = 1;
		if (!event) event = window.event;
		// kludge around NS/IE differences
		if (window.event){
			key = window.event.keyCode;
			target = window.event.srcElement;}
		else if (event.which){
			key = event.which;
			target = event.target;}
		else return 1; // Browser listens for keydown but we don't know how to read them
		// Ignore event if key value is zero as for alt on Opera and Konqueror
		if (!key) return 1;
		// Avoid interfering with keystroke behavior for chrome elements
		if (!w3.chrome(target) && w3.special_element(target)) return 1;
		// Check for concurrent control/command/alt key but are these only present on mouse events?
		if (event.ctrlKey || event.altKey || event.metaKey) return 1;
		// Extra keys: img:I F+:. F-:, +:N -:P bar:T PgU:U PgD:D Enter:G Esc:X Ao1:S Lang:L Idx:C Help:H
		// Dismiss table of contents (if visible), except for: PageDown PageUp 0-9 Tab Shift
		if (w3.is_shown_toc()){ // Doesn't close on PageDown PageUp 0-9 Tab Shift
			if (key !== 33 && key !== 34 && (key < 48 || key > 57) && (key < 96 || key > 105) && key !== 9 && key !== 16) w3.hide_table_of_contents(1);
			else if (key === 32) return w3.cancel(event);} // Close TOC: Space
		// Table of contents popup: Space
		else if (key === 32){
			if (w3.toc) w3.toggle_table_of_contents();
			return w3.cancel(event);}
		// Select background image: CapsLock I
		else if (key === 20 || key === 73){
			document.getElementById("bg").src = prompt(w3.localize("background"), "//www.why-is-the-sky-blue.tv/images/why-sky-is-blue.jpg");
			return w3.cancel(event);}
		// Previous slide or Page up (not on Content page or Index): PageUp U
		else if (!w3.is_shown_toc() && (key === 33 || key === 85)){
			if (w3.view_all) return 1;
			if (w3.slide_number === 1 && window.pageYOffset > 0) return 1;
			w3.previous_slide("song");
			return w3.cancel(event);}
		// Next slide or Page down (not on Content page or Index): PageDown D
		else if (!w3.is_shown_toc() && (key === 34 || key === 68)){
			if (w3.view_all) return 1;
			if (w3.slide_number === 1){
				var cur_y = window.pageYOffset;
				if (w3.max_y > cur_y) return 1; // scroll within index page
				if (w3.max_y < cur_y){ // still finding the end
					w3.max_y = cur_y;
					return 1;}}
			w3.next_slide("song");
			return w3.cancel(event);}
		// Next slide: Right N
		else if (key === 39 || key === 78){
			w3.next_slide(event.shiftKey ? "slide" : "incremental");
			return w3.cancel(event);}
		// Previous slide: Left P
		else if (key === 37 || key === 80){
			w3.previous_slide(event.shiftKey ? "slide" : "incremental");
			return w3.cancel(event);}
		// Collect numbers and A B (and Backspace) pressed for going to a song, only if no TOC
		// This method is limited in what song index it accepts, 0-9,A,B and max length 4!
		else if (!w3.is_shown_toc() && ((key > 95 && key < 106) || (key > 47 && key < 58) || key === 65 || key === 66) || key === 8){ // 0-9 A B Backspace
			if (key === 65) w3.jump += "A";
			else if (key === 66) w3.jump += "B";
			else if (key === 8) w3.jump = w3.jump.substr(0, w3.jump.length - 1); // Backspace
			else w3.jump += (key > 57 ? (key - 96) : (key - 48)); // 0-9
			// No more than 4 characters
			if (w3.jump.length > 4) w3.jump = "";
			return w3.cancel(event);}
		// Cancel gathering numbers: Esc X
		else if (key === 27 || key === 88){
			if (w3.jump.length){ // No jump: try Esc elsewhere
				w3.jump = "";
				return w3.cancel(event);}}
		// Go to song <number> (they don't all exist..!): Enter G
		else if (key === 13 || key === 71){
			if (w3.jump){
				for (var i = 0; i < w3.song.length; i++) if (w3.song[i] === w3.jump){
					window.location = "#p" + (i + 1);
					w3.jump = "";
					if (w3.view_all) window.scrollTo(0, document.getElementByName("#p" + (i + 1)).offsetTop);}
				w3.jump = "";
				return w3.cancel(event);}}
		// Smaller fonts: Down ,
		else if (key === 40 || key === 188){
			if (w3.is_shown_toc()) return 1;
			w3.smaller();
			return w3.cancel(event);}
		// Larger fonts: Up .
		else if (key === 38 || key === 190){
			if (w3.is_shown_toc()) return 1;
			w3.bigger();
			return w3.cancel(event);}
		// Toggle toolbar: Delete T
		else if (key === 46 || key === 84){
			w3.toggle_toolbar();
			return w3.cancel(event);}
		// Toggle View All/Slides: Insert V
		else if (key === 45 || key === 86){
			w3.toggle_view();
			return w3.cancel(event);}
		// Toggle Language: Tab L
		else if (key === 9 || key === 76){
			w3.toggle_lang();
			return w3.cancel(event);}
		// Toggle Left-click for Next slide: M
		else if (key === 77){
			w3.mouse_click_enabled = !w3.mouse_click_enabled;
			alert(w3.localize("mouse") + " " + w3.localize(w3.mouse_click_enabled ? "enabled" : "disabled"));
			return w3.cancel(event);}
		// Help page = first page: Home H
		else if (key === 36 || key === 72){
			window.location = w3.help_page;
			return w3.cancel(event);}
		// Index page: End C
		else if (key === 35 || key === 67){
			window.location = w3.tocpage;
			return w3.cancel(event);}
		return 1;},
	// Safe for both text/html and application/xhtml+xml
	create_element: function (name){
		if (document.createElementNS !== undefined) return document.createElementNS("http://www.w3.org/1999/xhtml", name);
		return document.createElement(name);},
	get_element_style: function (elem, IEStyleProp, CSSStyleProp){
		if (elem.currentStyle){
			return elem.currentStyle[IEStyleProp];}
		else if (window.getComputedStyle){
			var compStyle = window.getComputedStyle(elem, "");
			return compStyle.getPropertyValue(CSSStyleProp);}
		return "";},
	// The string str is a whitespace separated list of tokens; test if str contains a particular token, e.g. "slide"
	has_token: function (str, token){
		if (str){
			// define pattern as regular expression
			var pattern = /\w+/g;
			// check for matches, place result in array
			var result = str.match(pattern);
			// now check if desired token is present
			for (var i = 0; i < result.length; i++){
				if (result[i] === token) return 1;}}
		return 0;},
	get_class_list: function (element){
		if (element.className !== undefined) return element.className;
		return element.getAttribute("class");},
	has_class: function (element, name){
		if (element.nodeType !== 1) return 0;
		var regexp = new RegExp("(^| )" + name + "\W*");
		if (element.className !== undefined) return regexp.test(element.className);
		return regexp.test(element.getAttribute("class"));},
	remove_class: function (element, name){
		var regexp = new RegExp("(^| )" + name + "\W*");
		var clsval = "";
		if (element.className !== undefined){
			clsval = element.className;
			if (clsval){
				clsval = clsval.replace(regexp, "");
				element.className = clsval;}}
		else {
			clsval = element.getAttribute("class");
			if (clsval){
				clsval = clsval.replace(regexp, "");
				element.setAttribute("class", clsval);}}},
	add_class: function (element, name){
		if (!this.has_class(element, name)){
			if (element.className !== undefined) element.className += " " + name;
			else {
				var clsval = element.getAttribute("class");
				clsval = clsval ? clsval + " " + name : name;
				element.setAttribute("class", clsval);}}},
	// HTML elements that can be used with class="incremental"
	// Note that you can also put the class on containers like up, ol, dl, and div to make their contents appear
	// incrementally. Upper case is used since this is what browsers report for HTML node names (text/html).
	incremental_elements: null,
	okay_for_incremental: function (name){
		if (!this.incremental_elements){
			var inclist = [];
			inclist["p"] = 1;
			inclist["pre"] = 1;
			inclist["li"] = 1;
			inclist["blockquote"] = 1;
			inclist["dt"] = 1;
			inclist["dd"] = 1;
			inclist["h2"] = 1;
			inclist["h3"] = 1;
			inclist["h4"] = 1;
			inclist["h5"] = 1;
			inclist["h6"] = 1;
			inclist["span"] = 1;
			inclist["address"] = 1;
			inclist["table"] = 1;
			inclist["tr"] = 1;
			inclist["th"] = 1;
			inclist["td"] = 1;
			inclist["img"] = 1;
			inclist["object"] = 1;
			this.incremental_elements = inclist;}
		return this.incremental_elements[name];},
	next_incremental_item: function (node){
		var slide = w3.slides[w3.slide_number];
		for (;;){
			node = w3.next_node(slide, node);
			if (node === null || node.parentNode === null) break;
			if (node.nodeType === 1){ // ELEMENT
				if (node.nodeName.toLowerCase() === "br") continue;
				if (w3.has_class(node, "incremental") && w3.okay_for_incremental(node.nodeName.toLowerCase()))
					return node;
				if (w3.has_class(node.parentNode, "incremental") && !w3.has_class(node, "non-incremental"))
					return node;}}
		return node;},
	previous_incremental_item: function (node){
		var slide = w3.slides[w3.slide_number];
		for (;;){
			node = w3.previous_node(slide, node);
			if (node === null || node.parentNode === null) break;
			if (node.nodeType === 1){
				if (node.nodeName.toLowerCase() === "br") continue;
				if (w3.has_class(node, "incremental") && w3.okay_for_incremental(node.nodeNametoLowerCase()))
					return node;
				if (w3.has_class(node.parentNode, "incremental") && !w3.has_class(node, "non-incremental"))
					return node;}}
		return node;},
	// set visibility for all elements on current slide with
	// a parent element with attribute class="incremental"
	set_visibility_all_incremental: function (value){
		var node = this.next_incremental_item(null);
		if (value === "hidden"){
			while (node){
				w3.add_class(node, "invisible");
				node = w3.next_incremental_item(node);}}
		else { // value === "visible"
			while (node){
				w3.remove_class(node, "invisible");
				node = w3.next_incremental_item(node);}}},
	// reveal the next hidden item on the slide
	// node is null or the node that was last revealed
	reveal_next_item: function (node){
		node = w3.next_incremental_item(node);
		if (node && node.nodeType === 1) // an element
			w3.remove_class(node, "invisible");
		return node;},
	// exact inverse of revealNextItem(node)
	hide_previous_item: function (node){
		if (node && node.nodeType === 1) // an element
			w3.add_class(node, "invisible");
		return this.previous_incremental_item(node);},
	// left to right traversal of root's content
	next_node: function (root, node){
		if (node === null) return root.firstChild;
		if (node.firstChild) return node.firstChild;
		if (node.nextSibling) return node.nextSibling;
		for (;;){
			node = node.parentNode;
			if (!node || node === root) break;
			if (node && node.nextSibling) return node.nextSibling;}
		return null;},
	// right to left traversal of root's content
	previous_node: function (root, node){
		if (node === null){
			node = root.lastChild;
			if (node){
				while (node.lastChild)
					node = node.lastChild;}
			return node;}
		if (node.previousSibling){
			node = node.previousSibling;
			while (node.lastChild)
				node = node.lastChild;
			return node;}
		if (node.parentNode !== root) return node.parentNode;
		return null;},
	previous_sibling_element: function (el){
		el = el.previousSibling;
		while (el && el.nodeType !== 1)
			el = el.previousSibling;
		return el;},
	next_sibling_element: function (el){
		el = el.nextSibling;
		while (el && el.nodeType !== 1)
			el = el.nextSibling;
		return el;},
	first_child_element: function (el){
		var node;
		for (node = el.firstChild; node; node = node.nextSibling){
			if (node.nodeType === 1) break;}
		return node;},
	first_tag: function (element, tag){
		var node;
		for (node = element.firstChild; node; node = node.nextSibling){
			if (node.nodeType === 1 && node.nodeName.toLowerCase() === tag) break;}
		return node;},
	hide_selection: function (){
		if (window.getSelection){ // Firefox, Chromium, Safari, Opera
			var selection = window.getSelection();
			if (selection.rangeCount > 0){
				var range = selection.getRangeAt(0);
				range.collapse (0);}}
		else { // Internet Explorer
			var textRange = document.selection.createRange ();
			textRange.collapse (0);}},
	get_selected_text: function (){
		try {
			if (window.getSelection) return window.getSelection().toString();
			if (document.getSelection) return document.getSelection().toString();
			if (document.selection) return document.selection.createRange().text;}
		catch (e){ console.log(e);}
		return "";},
	// make note of length of selected text
	// as this evaluates to zero in click event
	mouse_button_up: function (){
		w3.selected_text_len = w3.get_selected_text().length;},
	mouse_button_down: function (e){
		w3.selected_text_len = w3.get_selected_text().length;
		w3.mouse_x = e.clientX;
		w3.mouse_y = e.clientY;},
	// right mouse button click is reserved for context menus
	// it is more reliable to detect rightclick than leftclick
	mouse_button_click: function (e){
		if (!e) e = window.event;
		if (Math.abs(e.clientX - w3.mouse_x) + Math.abs(e.clientY - w3.mouse_y) > 10) return 1;
		if (w3.selected_text_len > 0) return 1;
		var leftclick = 0;
		var target;
		if (!e) e = window.event;
		if (e.target) target = e.target;
		else if (e.srcElement) target = e.srcElement;
		// work around Safari bug
		if (target.nodeType === 3) target = target.parentNode;
		if (e.which) leftclick = (e.which === 1); // all browsers except IE
		// Konqueror gives 1 for left, 4 for middle; IE6 gives 0 for left
		else if (!e.button) leftclick = 1;
		if (w3.selected_text_len > 0){
			w3.stop_propagation(e);
			e.cancel = 1;
			e.returnValue = 0;
			return 0;}
		// dismiss table of contents
		w3.hide_table_of_contents(0);
		// check if target is something that wants clicks, e.g. a, embed, object, input, textarea, select, option
		if (w3.mouse_click_enabled && leftclick && !w3.special_element(target) && !target.onclick){
			w3.next_slide("incremental");
			w3.stop_propagation(e);
			e.cancel = 1;
			e.returnValue = 0;
			return 0;}
		return 1;},
	special_element: function (element){
		if (this.has_class(element, "non-interactive")) return 0;
		var tag = element.nodeName.toLowerCase();
		return element.onkeydown || element.onclick ||
				tag === "a" || tag === "embed" || tag === "object" || tag === "video" || tag === "audio" || tag === "svg" ||
				tag === "canvas" || tag === "input" || tag === "textarea" || tag === "select" || tag === "option";},
	chrome: function (el){
		while (el){
			if (el === w3.toc || el === w3.toolbar || w3.has_class(el, "outline")) return 1;
			el = el.parentNode;}
		return 0;},
	get_key: function (e){
		var key;
		// kludge around NS/IE differences
		if (window.event !== undefined) key = window.event.keyCode;
		else if (e.which) key = e.which;
		return key;},
	get_target: function (e){
		var target;
		if (!e) e = window.event;
		if (e.target) target = e.target;
		else if (e.srcElement) target = e.srcElement;
		if (target.nodeType !== 1) target = target.parentNode;
		return target;},
	// does display property provide correct defaults?
	is_block: function (elem){
		var tag = elem.nodeName.toLowerCase();
		return tag === "ol" || tag === "ul" || tag === "p" || tag === "dl" || tag === "li" || tag === "table" ||
				tag === "pre" || tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4" || tag === "h5" || tag === "h6" ||
				tag === "blockquote" || tag === "address";},
	add_listener: function (element, event, handler){
		if (window.addEventListener) element.addEventListener(event, handler, 0);
		else element.attachEvent("on" + event, handler);},
	// used to prevent event propagation from field controls
	stop_propagation: function (event){
		event = event ? event : window.event;
		event.cancelBubble = 1; // for IE
		if (event.stopPropagation) event.stopPropagation();
		return 1;},
	cancel: function (event){
		if (event){
			event.cancel = 1;
			event.returnValue = 0;
			if (event.preventDefault) event.preventDefault();}
		w3.key_wanted = 0;
		return 0;},
	// Associative array strings with for each language an associative array
	strings: {
		"th": {
			"mouse": "เมาส์ คลิกซ้าย",
			"enabled": "ใช้งานได้",
			"disabled": "ใช้งานไม่ได้",
			"background": "ลิงค์ของรูปภาพสำหรับพื้นหลัง",
			"go": "ไปสู่",
			"slide": "หน้า",
			"help": "ความช่วยเหลือ",
			"index": "สารบัญบทเพลง",
			"org": "โอเอ็มเอ็ฟ อินเทอร์เนชันนัล",
			"subject": "การแก้ไขปรับปรุง เว็บไซต์",
			"email": "ส่งอีเมล์เสนอการแก้ไขปรับปรุงเว็บไซต์นี้",
			"corrections": "แก้ไขปรับปรุงเว็บไซต์",
			"toc": "สารบัญบทเพลง ป๊อปอัพ",
			"titles": "สารบัญบทเพลง",
			"tab1": "สลับกันภาษา ",
			"sep1": " ",
			"sep2": " และ ",
			"th": "ไทย",
			"en": "อังกฤษ",
			"nl": "ดัตช์",
			"tab2": " [ปัด",
			"down": "ลง",
			"tab3": "]",
			"helptext": "F11 เต็มหน้าจอ | ↓ ลดขนาดตัวอักษร | ↑ ขยายตัวอักษร \n Home หน้าความช่วยเหลือ | End หน้าสารบัญบทเพลง | → หน้าต่อไป | ← ไปหน้าก่อน"},
		"en": {
			"mouse": "Mouse: left-click",
			"enabled": "enabled",
			"disabled": "disabled",
			"background": "Link of image for background",
			"go": "go to",
			"slide": "slide",
			"help": "Help",
			"index": "Index",
			"org": "OMF International",
			"subject": "Corrections or suggestions for improvement of the website",
			"email": "Email corrections or suggestions for improvement of this website",
			"corrections": "Corrections",
			"toc": "Table of contents",
			"titles": "Table of song titles",
			"tab1": "Toggle Languages: ",
			"sep1": ", ",
			"sep2": " or ",
			"th": "Thai",
			"en": "English",
			"nl": "Dutch",
			"tab2": " [swipe ",
			"down": "Down",
			"tab3": "]",
			"helptext": "F11 Full screen | ↓ Decrease font size | ↑ Increase font size\n Home Help page | End Table of contents | → Next slide | ← Previous slide"},
		"nl": {
			"mouse": "Muis: links-klikken",
			"enabled": "ingeschakeld",
			"disabled": "uitgeschakeld",
			"background": "Link voor een afbeelding voor de achtergrond",
			"go": "ga naar",
			"slide": "pagina",
			"help": "Help",
			"index": "Inhoudsopgave",
			"org": "OMF International",
			"subject": "Correcties of suggesties voor verbetering van de webpagina",
			"email": "Email correcties of suggesties voor verbetering van de webpagina",
			"corrections": "Correcties",
			"toc": "Titellijst",
			"titles": "Inhoudsopgave",
			"tab1": "Schakel tussen de talen ",
			"sep1": ", ",
			"sep2": " en ",
			"th": "Thais",
			"en": "Engels",
			"nl": "Nederlands",
			"tab2": " [veeg ",
			"down": "Omlaag",
			"tab3": "]",
			"helptext": "F11 Schermvullend | ↓ Verklein letterformaat | ↑ Vergroot letterformaat\n Home Helppagina | End Titellijst | → Volgende pagina | ← Vorige pagina"}},
	localize: function (string, lang){ // lang is two-letter code
		var language;
		if (lang) language = w3.strings[lang];
		else language = w3.strings[w3.langs[w3.lang]];
		if (language && language[string]) return language[string];
		return string;}};
// hack for back button behavior
if (w3.ie6 || w3.ie7) document.write("<iframe id=\"historyFrame\" src=\"javascript:'<html></html>'\"" +
		" height=\"1\" width=\"1\" style=\"position:absolute;left:-800px\"></iframe>");
// attach event listeners for initialization
w3.set_up();
// Hide the slides as soon as body element is available to reduce annoying screen mess before the onload event
setTimeout(w3.hide_slides, 200);
//-->]]>
