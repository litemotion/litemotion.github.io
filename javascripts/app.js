/**! 
*	@copyright Copyright (c) 2016 Simon CHAM
*	@description app.js - client side library for equot
*	@version 1.0
*/
if(typeof jQuery === 'undefined') { throw new Error('app.js\'s implementation requires jQuery')}


/**
 * Set up members of the following namespace: app, app.ajax
 */
!function(w,d){
var _c_ = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
if(!w.app) w.app = {}

/**
 * default noop function
 */
app.noop = function(){}

/**
 * Salt string generator
 * @param {number} i - (Optional) length of salt generated.
 * @return {string} - the salt string
 */
app.salt = function(i) {
	if(!i) i = parseInt(Math.random()*1024 % 10) + 1
	var x = ""
	for(var j=0;j<i;j++) {
		x +=_c_[parseInt(Math.random()*1024%62)]
	}
	return x
}
/**
 * Determine a string containing Chinese Chars
 * @param {string} s - string to be examined
 * @return {array|null} - array contains the first Chinese char matched, or null if no matched.
 */
app.hasChinese = function(s) {
	return s.match(/[\u3400-\u9FBF]/)
}

/**
 * Get date from mongodb ObjectId
 * @param {string} id - string of _id (mongodb format)
 * @return {date} - the date object encoded in id
 */
app.dateById =function(id) {
	if(!id) return;
	var h = parseInt(id.substr(0,8),16)
	if(isNaN(h)) return;
	return new Date(h*1000);
}

/* vms.objectify( Object , String , Any) */
/* vms.objectify( Hosting Object , Attribute Path , Attribute) */
app.objectify = function(o, s, v) {
	var arr = s.split(".")
	//var o ={}
	if(!o) o = {}
	if(o.__proto__) o.__proto = null
	var x = {}
	if(x.__proto__) x.__proto = null
	for(var i=0;i<arr.length;i++) {
		if(i==0) {
			if(!o[arr[i]]) o[arr[i]] = {} // new code to replace the next line
			if(o[arr[i]].__proto__) o[arr[i]].__proto__ = null
			//o[arr[i]]= {}
			x = o[arr[i]] // x = o.a
			if(arr.length==1) {
				if(!v) v = ""
				o[arr[i]] = v
			}
		} else {
			if(i==(arr.length-1)) {
				//console.log(i, arr[i], v, x[arr[i]], x, JSON.stringify(o))
				if(!v) v = ""
				x[arr[i]] = v
				//console.log(i, arr[i], v, x[arr[i]], x, JSON.stringify(o))
			} else {
				if(!x[arr[i]]) x[arr[i]] = {} // new code to replace the next line
				if(x[arr[i]].__proto__ ) x[arr[i]].__proto__ = null
				//x[arr[i]] = {} // o.a.b = {}
				x = x[arr[i]]		// x = o.a.b
			}
		}
	}
	return o
}
/* vms.arrayer(Object) */
app.arrayer=function(o) {
	var p = []
	var _hasIndex = false
	for(var i in o) {
		//console.log(i, o[i])
		if(isFinite(i)) {
			_hasIndex = true
			p[i] = o[i]
		}
	}
	if(!_hasIndex) {
		for(var i in o) {
			if('object' == typeof o[i]) o[i] = app.arrayer(o[i])
		}
	} else {
		for(var i=0;i<p.length;i++) {
			//console.log('check',i,p[i])
			if(!p[i]) {
				//console.log('remove',i,p[i])
				p.splice(i, 1);
				i--;
			}
		}
	}
	if(p.length) return p
	else return o
}

/**
	datafields(selector, data, excluded)
	@input selector (String) - the selector of element containing the data-fields
	@input data (Object) - <not in use yet>
	@input excluded (String) - the selector of element which is not included in the collection.
 */
app.datafields = function(selector, data, excluded) {
	var $container = $(selector)
	if(excluded) {
		$container = $container.clone()
		$container.find(excluded).remove()
	}
	var els = $container.find("[data-field]")
	var o ={}; 
	if(o.__proto__) o.__proto__ = null	// remove the __proto__
	els.each(function(i){
		var $el = $(els[i])
		var field = $el.data('field')
		var val = $el.val()
		
		if($el.attr('type')&&($el.attr('type').toLowerCase()=='checkbox')) val = $el.prop('checked')
		if($el.attr('type')&&($el.attr('type').toLowerCase()=='radio')) {
			var n = $el.attr("name")
			if(n) val = $container.find("[data-field][name="+n+"]:checked").val()
		}
		if((!val)&&$el.attr("value")) {
			val = $el.attr("value")
		}
		//console.log('before objectify:\n',o)
		app.objectify(o,field,val)
		
		//console.log(field,val)
	})
	// the following line unremarked for debug
	//console.log('before arrayer:\n',o)
	// 
	o = app.arrayer(o)
	return o
}

/* under development */
app.datapaths=function(o,prefix,fields) {
	if(!prefix) prefix = ""
	var _prefix = prefix
	if(prefix) prefix += "."
	if(!fields) fields = {}
	//console.log('input:',o,prefix,fields)
	if(Array.isArray(o)) {
		//console.log('o is array', o)
		for(var i=0;i<o.length;i++) {
			if('object' === typeof o[i]) jQuery.extend(fields,app.datapaths(o[i],prefix+i,fields))
			else fields[prefix +i ] = o[i]
		}
		//return fields
	}else if('object' !== typeof o) {
		//console.log('o is not arrany or object', o)
		fields[_prefix] = o
		//return fields
	} else {
		//console.log('o is an object', o)
		for(var n in o) {
			jQuery.extend(fields, app.datapaths(o[n],prefix +n,fields))
		}
	}
	return fields
	//console.log('fields:')
	//console.log(fields)
}

app._datafields=function(selector,data) {
	var $container = $(selector)
	if(!$container.length) return
	var fields = app.datapaths(data)
	for(var n in fields) {
		var $el = $container.find("[data-field='" + n +"']")
		if($el.length&&($el[0].tagName=='SELECT')) $el.val(fields[n].toString()) // special handle when the qualified is boolean
		else $el.val(fields[n])
	}
}

/**
 * Parse a String and convert to Interval Object
 * String must has interval indicator char (>, < ,-, ≤ , ≥ )
 * '>200' --> range:[200,Infinity]
 * '10-20K' --> {"label":"10-20K", "range":[9999,20000]}
 * '10-20' -->  {"label":"10-20", "range":[9,20]}
 */
app.toIntervalObject=function(s) {
	if(!s) return;
	s = s.replace('>=','≥')
	s = s.replace('<=','≤')
	var _patternIndicator = /[><\-≤≥]/ig;
	var b = s.match(_patternIndicator)
	if(!b) return;
	if(b.length>1) return;
	b = b[0]
	var K = 1
	var arr = s.split(b)
	arr[0] = arr[0].trim()
	arr[1] = arr[1].trim()
	if(arr[0].match(/K/i)) K = 1000
	if(arr[1].match(/K/i)) K = 1000
	arr[0] = parseInt(arr[0])
	arr[1] = parseInt(arr[1])
	if(isNaN(arr[0])&&isNaN(arr[1])) return;
	arr[0] = arr[0]*K ; arr[1] = arr[1]*K
	// case 1
	if((b==">")||(b=="≥")) {
		if(!isNaN(arr[0]+arr[1])) return
		if(isNaN(arr[0])) {
			arr[0] = Infinity
			if(b == ">") arr[1] = arr[1]+1
		}
		if(isNaN(arr[1])) {
			arr[1] = 0
			if(b == ">") arr[0] = arr[0]-1
		}
		return {label:s,range:[arr[1],arr[0]]}
	}
	// case 2
	if((b=="<")||(b=="≤")) {
		if(!isNaN(arr[0]+arr[1])) return
		if(isNaN(arr[0])) {
			arr[0] = 0
			if(b == "<") arr[1] = arr[1]-1
		}
		if(isNaN(arr[1])) {
			arr[1] = Infinity
			if(b == "<") arr[0] = arr[0]+1
		}
		return {label:s,range:[arr[0],arr[1]]}
	}
	// case 3
	if(isNaN(arr[0]+arr[1])) return
	if(arr[0]>arr[1]) { b = arr[1]; arr[1] = arr[0]; arr[0] = b } // reorder array
	arr[0] = arr[0]-K +1
	return {label:s,range:[arr[0],arr[1]]}
}


app.ajax = function(type,url,data,callback) {
	if(!callback) {callback = function() {}}
	if(!data) data = {}
	$.ajax({type:type,url:url,data:data}).always(function(message){
		var o;
		if('string' === typeof message) {
			try { o = JSON.parse(message)}
			catch(e) {
				if(e.toString().toLowerCase().indexOf("unexpected token")>=0) {
					callback("Server Response Message Issue - Unexpected Token")
					return
				}
			}
		}
		if(!o) {
			if('object'=== typeof message) {
				o = message
			} else {
				callback("Server Response Message Issue - No Result Object")
				return
			}
		}
		if(o.result) callback(null,o.result)
		else callback(o) // this line was newly added on 19 Oct 2016
	})
}

/* vms.ajax.post(String url, Object data, Function callback) */
/* - ajax.post is a short-hand for vms.ajax when posting */
app.ajax.post =function(url,data,callback) {
	app.ajax('post',url,data,callback)
}

/* vms.ajax.get(String url, Function callback) */
/* - ajax.get is a short-hand for vms.ajax when geting */
app.ajax.get = function(url,callback) {
	app.ajax('get',url,null,callback)
}

/* vms.ajax.CALLBACK - generic callback function to just log the err and result in browser console */ 
app.ajax.CALLBACK =function(err,result) {
	console.log(err,result)
}

/* this is special handling for empty array
   because empty array will not be sent as form data in $.ajax
	 convert empty array [] to a string "EMPTY.ARRAY"
*/
app.ajax.patchEmptyArray = function(d) {
	if(Array.isArray(d)&&(d.length==0)) d = "EMPTY.ARRAY"
	return d
}

}(window,document)

/*!
* setup members of namespace app.ui - applicaiton ui specific methods 
* @namespace app.ui
*/
!function(w,d) {

	/** @namespace app.ui */
	app.ui = {}
	
	/** 
	* internal history array
	*/
	var __history = [];
	var __current;
	var __last;
	
	/**
	* internal init function for base html
	* define all jQuery-based shorthand members under app.ui
	* @note: app.ui._init() must be called before you can use the shorthand members
	*/
	app.ui._init = function() {
		app.ui.$nav = $(".app-nav")
		app.ui.$nav.on('click',function(evt){ if(evt.target == this) app.ui.$nav.hide() })
		app.ui.$messenger = $(".app-messenger")
		app.ui.$main = $(".app-main");
		app.ui.$file = $("input.app-file-hidden");
		app.ui.$toast = $(".app-toast");
		app.ui.$back = $(".app-back-btn");
		app.ui.$reload = $(".app-reload-btn");
		app.ui.$spinner = $(".app-spinner")
		$(".app-nav-btn").click(function(){ app.ui.$nav.show() })
		$(".app-messenger-btn").on('click',function(){ $(".app-messenger").show() })
		$(".app-messenger-close-btn").on('click',function(){ $(".app-messenger").hide() })
		app.registerHelpers(window,document,Handlebars)
		window.pagelet = {} // make pagelet global to prevent issue
		/**
		* custom method to select file for upload with app.ui.$file
		* @param {Sting} url 
		* @param options
		* @param cb
		*/
		app.ui.$file.choose = function(url, options,cb) {
			if(!url) throw new Error('app.ui.$file.choose(url,...), argument url is missing.')
			if(('function' === typeof options)&&(!cb)) {
				cb = options; options = {};
			}
			if(!cb) cb = app.noop;
			
			var $file = app.ui.$file
			for(var n in options) { $file.attr(n,options[n]) }
			
			$file.off('change').on('change',function(){
				var f = $file[0].files[0]
				if(!f) return
				var fd = new FormData
				fd.append('file',f)
				
				var xhr = new XMLHttpRequest()
				xhr.onreadystatechange=function() {
					if(this.readyState == 4) {
						var msg = this.responseText
						var rm = JSON.parse(msg)
						cb(rm)
					}
				}
				xhr.open('post',url)
				xhr.send(fd)
			})
			$file.click()
		}
		
		/**
		* custom method of app.ui.$back button
		* which is to handle pagelet loading
		*/
		app.ui.$back.on('click',function(){
			if(pagelet&&pagelet.__dirty) {
				app.ui.prompt(
					"此頁數據已變更但未保存。<BR> 是否確定不保存而離開 ?",
					{"確定":"1","取消":"0"},function(v){
						if(v=="0") return;
						app.ui.$back.__doBack()
					})
			} else {
				app.ui.$back.__doBack()
			}
		})
		app.ui.$back.__doBack =function() {
			var url = __history.pop();
			if(url) {
				app.ui.load(url, null , "back");
			}
		}
		/**
		* custom method of app.ui.$reload button
		* which is to handle pagelet loading
		*/
		app.ui.$reload.on('click',function(){
			if(pagelet&&pagelet.__dirty) {
				app.ui.prompt(
					"此頁數據已變更但未保存。<BR> 是否確定不保存而刷新 ?",
					{"確定":"1","取消":"0"},function(v){
						if(v=="0") return;
						app.ui.reload()
					})
			} else {
				app.ui.reload()
			}
		})
		
		app.__history = __history
		app.__current= function() {return __current}
		app.__last = function() {return __last}
	}
	
	/**
	* arithmetic
	*/
	app.ui.ARITHMETIC = /[0-9x÷×\.\+\-\*\/ ]/ig  // pattern of arithmetic symbols allowed
	app.ui.arithmetic = function(selector) {
		$(selector).off('focus.arithmetics').on('focus.arithmetics',function(){
			var $this = $(this);
			var v = $this.attr("arithmetics")
			if(v) $this.val(v)
		}).off('blur.arithmetics').on('blur.arithmetics',function(){
			var $this = $(this)
			var v = $this.val()
			var m = v.match(app.ui.ARITHMETIC)
			//console.log(m)
			if(!m) {$this.val(""); return;}
			if(m.length != v.length) {$this.val("");return;}
			try{
				var s = v.replace(/[x×]/ig,"*").replace("÷","/")
				var a = eval(s)
				a = a.toFixed(8)*1
				$this.val(a);
				$this.attr("arithmetics",v)
			} catch(e) {
				$this.val(""); return;
			}
		})
	}
	
	/**
	* 
	*/
	app.ui.filterStat =function(url,map,selector) {
		if(!url) return console.log('url string is missing in the first argument');
		if(!selector) selector = '.filter'
		if(!map) return console.log('map object is missing in the second argument');
		if(url.indexOf('/data/stat/')<0) url = '/data/stat/'+url
		app.ajax.get(url,function(er,rm){
			if(rm.result) rm = rm.result
			if(!rm.ok) return;
			var o = {}
			rm.data.forEach(function(d){
				o[d._id] = d.count
			})
			$(selector).each(function(){
				var $this = $(this)
				if(!$this.attr('data-tab-text')) $this.attr('data-tab-text',$this.text())
				for(var n in map) {
					if($this.hasClass(n)) {
						var arr = map[n].split(",")
						//console.log(arr)
						var c = 0
						arr.forEach(function(a){
							c +=(o[a]||0)
						})
						$this.text($this.attr('data-tab-text') + ' ('+ (c)+')')
					}
					/*})*/
				}
				//if($this.hasClass('general')) $this.text($this.attr('data-tab-text') + ' ('+ (o['general']||0)+')')
				//if($this.hasClass('loadingPlan')) $this.text($this.attr('data-tab-text') + ' ('+ (o['loadingPlan']||0)+')')
			})
		})
	}
	
	/**
	* gridify a collection of input element so that 
	* they can accept arrow keys to access them as cell in grid
	* based on the x and y attr of elements of the grid
	* @param {String} selector - the selector of all cells in the grid
	*/
	app.ui.gridify = function(selector) {
		//console.log('app.ui.gridify on ' , selector)
		var $cells = $(selector)
		
		// accept key up/down events
		$cells.on('keydown',function(evt){
			if((evt.which<37)||(evt.which>40)) return;
			var $this = $(this)
			var x = parseInt($this.attr("x"))
			var y = parseInt($this.attr("y"))
			var $next  ={}
			//console.log('current coor:',x,y)
			
			if(evt.which==39) { // right arrow
				// only trigger when the cursor at the end of the text
				if(this.value.length ==this.selectionEnd) {
					var xx = x+1
					$next = $(selector + "[x="+xx+"][y="+y+"]")
				}
			}
			if(evt.which==37) { // left
				// only trigger when the cursor at the beginning of the text
				if(0==this.selectionStart) {
					var xx = x-1
					$next = $(selector + "[x="+xx+"][y="+y+"]")
				}
			}
			if(evt.which==40) {// down
				var yy = y+1
				var $next = $(selector + "[x="+x+"][y="+yy+"]")
				if(!$next.length) {
					$last = $(selector + "[y="+yy+"]").last()
					$first = $(selector + "[y="+yy+"]").first()
					if($first.length) {
						if(parseInt($first.attr("x"))< x) $next = $last
						else $next = $first
					}
				}
			}
			if(evt.which==38) {// up
				var yy = y-1
				var $next = $(selector + "[x="+x+"][y="+yy+"]")
				if(!$next.length) {
					$last = $(selector + "[y="+yy+"]").last()
					$first = $(selector + "[y="+yy+"]").first()
					if($first.length) {
						if(parseInt($first.attr("x"))< x) $next = $last
						else $next = $first
					}
				}
			}
			if($next.length) $next.focus()
		})
	}
	
	/**
	* helper function to handle attachments of a document or subdocument
	* @param {String} url - file upload path - refer app.ui.$file.choose
	* @param options - refer app.ui.$file.choose
	* @param attachBtnObj {String|HTMLElement|jQueyObject} 
	* @param {Function} cb - callback - refer app.ui.$file.choose
	*/
	app.ui.helperAttach = function(url,options, attachBtnObj, cb) {
		var $btn = $(attachBtnObj);
		var $holder = $btn.attr("data-holder");
		var field = $btn.attr("data-field")
		if(!$holder) throw new Error("the element has no `data-holder` attribute.")
		var $holder = $($holder)
		if(!$holder.length) throw new Error("`data-holder` not found.")
		var html ='<div class="w3-card-2 w3-tag w3-padding w3-white w3-tiny app-file">' +
							'<i class="fa {{fileicon contentType}} w3-margin-right"></i> {{filename}} '+
							'<i class="fa fa-times" onclick="app.ui.helperDeAttach(this)"></i>'+
							'<input type="hidden" data-field="{{dataField}}.{{i}}" value="{{_id}}">'+
							'</div>'
		//console.log('html',html)
		var t = Handlebars.compile(html)
		app.ui.$file.choose(url,options,function(rm){
			if(rm.result) rm = rm.result
			var i = $holder.find(".app-file").length;
			if(!rm.ok) return cb(rm)
			var o = {"i":i,"filename":rm.data.filename,"_id":rm.data._id,"contentType":rm.data.metadata.contentType,"dataField":field}
			html = t(o);
			$holder.append(html)
			cb(rm)
		})
	}
	app.ui.helperDeAttach = function(o) {
		var $this = $(o)
		var parent = $this.parents('.app-file')
		if(!parent.length) return 
		console.log(parent)
		parent.find("input[type=hidden]").attr("data-field","").val("")
		parent.hide()
	}
	
	/**
	* loading pagelet and place it in holder
	* @param {String} url 
	* @param {String|Object} holder (Option)
	*/
	app.ui.load = function(url, holder, back, cb) {
		if(!cb) cb = app.noop;
		app.ui.$spinner.show()
		if(!holder) holder = app.ui.$main
		$.get(url,function(r){
			$(holder).html(r)
			__last = url
			if(back=="no") {
				/* no thing on __history*/
			}else if(back=="back") {
				__current = url
			} else {
				__history.push(__current)
				__current = url
			}
			app.ui.$nav.hide()
			app.ui.$spinner.hide()
			cb()
		})
	}
	/**
	* reload the current page without new record in history
	* keep scroll position as before
	*/
	app.ui.reload =function() {
		var $window = $(window)
		var _x = $window.scrollLeft()
		var _y = $window.scrollTop()
		app.ui.load(__current, null , "no", function(){
			setTimeout(function(){
				$window.scrollTop(_y)
				$window.scrollLeft(_x)	
			},150)
		})	
		
	}
	
	/**
	* render the content of the selector content with Handlebars
	* the selector content itself is a template
	* @param {String|Object} selector
	* @param {Object} data
	*/
	app.ui.render = function(selector,data) {
		var $o = $(selector)
		var t = Handlebars.compile($o.html())
		$o.html(t(data));
	}
	
	/**
	* create a template object based on selector
	*/
	app.ui.template = function(selector,option) {
		var $o = $(selector)
		var t = Handlebars.compile($o.html())
		t._selector = selector
		t.render = function(obj,selector) {
			var $selector = $o
			if(selector) $selector = $(selector)
			$selector.html(t(obj))
			//console.log($o,t(obj))
		}
		return t;
	}
	
	/**
	* display a toast message to ui
	* @param {String} message
	* @param {Numer|String|Object} options - When String "red"|"green"|"yellow" is the color of the toast 
	* @param {String|Object} selector (Optional) - the holder of the toast message
	*/
	app.ui.toast = function(message,options,selector) {
		if(!message) return console.warn('no toast will display as no message.');
		var $holder = app.ui.$toast
		var opt = {color:'green',duration:5000}
		var colors = ['red','yellow','green'];
		if(arguments.length>=2) {
			if('number' === typeof options) {opt.duration = options;}
			if('string' === typeof options) {
				var i = colors.indexOf(options)
				opt.color = (i>=0)?colors[i]:'green'
			}
			if('object' === typeof options) {
				if(options.color) {
					var i = colors.indexOf(options.color)
					opt.color = (i>=0)?colors[i]:'green'
				}
				if(options.duration) opt.duration = options.duration
			}
		}
		if(selector) $holder = $(selector) 
		var html =''+
			'<div class="w3-container w3-pale-green w3-leftbar w3-border-green w3-animate-right w3-small"><span>'+message+'</span></div>'
		html = html.replace('w3-pale-green','w3-pale-'+opt.color).replace('w3-border-green','w3-border-'+opt.color) 
		//console.log($holder)
		if($holder.length) {
			$holder.html(html)
			$holder.show();
			setTimeout(function(){
				$holder.fadeOut();	
			},opt.duration)
		}
	}
	/**
	* short hand method for app.ui.toast
	* @param {Object} rm - ResultMessage object
	* @param {String|Object} selector (Optional) - the holder of the toast message
	* @param {String} okMessage - Optional message of ok. default is "Success".
	* @param {String} erMessage - Optional message of er. default is `ResultMessage.error`
	*/
	app.ui.toastRM = function(rm, selector, okMessage,erMessage) {
		if(!rm) throw new Error("app.ui.toastRM(rm,...) rm is missing.");
		if(!okMessage) okMessage = "Success";
		if(rm.result) rm = rm.result
		if(rm.ok) app.ui.toast(okMessage,"green",selector)
		else app.ui.toast(rm.error,"red",selector)
	}
	
	/**
	* app prompt dialog
	* @param {String} message - the html or plaintext message of the prompt
	* @param {Object} buttons - JSON representation of buttons {"button text":value,...}
	* @param {Function} cb - callback function cb(v) where v is the returned value. All returned value is a String.
	* 
	* When there are 4 params, the signature will be (title,messag,buttons, cb).
	*/
	app.ui.prompt = function(message,buttons,cb) {
		var title
		if(arguments.length==4) {
			title = arguments[0]
			message = arguments[1]
			buttons = arguments[2]
			cb = arguments[3]
		}
		if(!cb) cb = app.noop;
		if(!buttons) buttons = {"OK":0} // default 
		var $m = app.ui.nextModal()
		var html ='';
		if(title) html = '<h4 class="w3-cotainer 1w3-text-blue w3-padding">'+title+'</h4>'
		html += '<div class="app-prompt-content w3-container w3-text-grey w3-padding">'+message+'</div>'
		var bhtml = ''
		for(var n in buttons) {
			bhtml += '<button class="w3-btn w3-margin w3-white w3-text-blue app-prompt-btn" data-value="'+buttons[n]+'">'+n+'</button>'
		}
		html += '<div class="w3-light-grey w3-container">'+bhtml+'</div>'
		$m.$content.html(html)
		$m.show()
		$m.find(".app-prompt-btn").click(function(){
			var v = $(this).attr("data-value")
			cb(v)
			$m.close()
		})
	}
	
	/**
	* mutli modal system
	*/
	__modal =0;
	__$modal = function(n) {
		var $appModal = $(".app-modal."+n);
		$appModal.$content = $(".app-modal."+n + " .w3-modal-content");
		$appModal.$closeBtn = $(".app-modal."+n + " .app-modal-close-btn");
		if($appModal.$closeBtn) {
			$appModal.$closeBtn.on('click',function(){
				$appModal.close();
			})
		}
		$appModal.close = function() {
			$appModal.fadeOut(function(){
				$appModal.$content.html("")
				if(__modal>0) __modal--
			})
		}
		$appModal.deferClose =function() {
			setTimeout(function(){
				$appModal.close()
			},500)
		}
		return $appModal;
	}
	/**
	* retrive the next modal
	*/
	app.ui.nextModal =function() {
		if(__modal>=4) return;
		__modal++; return __$modal(__modal);
	}
	app.ui.activeModal = function() {
		return __$modal(__modal);
	}
	
	/**
	* predefine client users roles and supplier user roles
	*/
	app.ui.CLIENTROLES = [
		{key:"Client Administrator"	, desc:"可以管理公司用戶，及供應商管理員。"},
		{key:"Applicant"						, desc:"可以提交 RFQ 申請。"},
		{key:"Applicant Manager"		, desc:"可以查閱所有 RFQ 申請，並且可得知一個物料的第一次報價結果。"},
		{key:"Reviewer"							, desc:"可以查閱 RFQ 申請，並作出接受或拒絕決定。"},
		{key:"Reviewer Manager"			, desc:"可以設定非 ERP 供應商。"},
		{key:"Top"									, desc:"Top Management，決定 RFQ 結果。"}
	]
	app.ui.SUPPLIERROLES = [
		{key:"Supplier Administrator"	, desc:"可以管理供應商用戶。"},
		{key:"Supplier Manager"				, desc:"所有提交必需經此角色審批。"},
		{key:"Supplier Staff"					, desc:"可以處理回應所有 RFQ , Bidsheet 。"}
	]
	
	/**
	* predefine standard UOM (ie. perUnit) 
	*/
	app.ui.UOM = {
		"S#PCS":{symbol:"pcs",name:{en:"pieces",tc:"件"},class:"產品單位"},
		"S#M":{symbol:"m",name:{en:"meter",tc:"米"},class:"產品長度"},
		"S#MW":{symbol:"m",name:{en:"meter",tc:"米"},class:"產品闊度"},
		"S#MH":{symbol:"m",name:{en:"meter",tc:"米"},class:"產品高度"},
		"S#M2":{symbol:"m²",name:{en:"square meter",tc:"平方米"},class:"產品面積"},
		"S#M3":{symbol:"m³",name:{en:"cubic meter","tc":"立方米"},class:"產品體積"},
		"S#SET":{symbol:"set",name:{en:"set",tc:"套"},class:"產品單位套 (1 產品單位為 1 套)"},
		"S#CM":{symbol:"cm",name:{en:"centimeter",tc:"厘米"},class:"產品長度"},
		"S#CMW":{symbol:"cm",name:{en:"centimeter",tc:"厘米"},class:"產品闊度"},
		"S#CMH":{symbol:"cm",name:{en:"centimeter",tc:"厘米"},class:"產品高度"},
		"S#CM2":{symbol:"cm²",name:"square centimeter",class:"產品面積"},
		"S#CM3":{symbol:"cm³",name:"cubic centimeter",class:"產品體積"},
		"S#%SCRAP":{symbol:"%",name:{en:"% per unit",tc:"每產品單位之 %"},class:"每產品單位的損耗% (基于各項物料及工序成本總和,計算損耗所佔的%)"},
		"S#%MANAGEMENT":{symbol:"%",name:{en:"% per unit",tc:"每產品單位之 %"},class:"每產品單位的管理費用%(基于以上各項物料,工序及損耗總和,計算管理費用及工资所佔的%)"},
		"S#%PROFIT":{symbol:"%",name:{en:"% per unit",tc:"每產品單位之 %"},class:"每產品單位的利潤%(基于以上各項物料,工序,損耗及管理費用總和,計算利潤所佔的%)"}
	}
	
}(window,document)



/*!
* Handlebars helper functions 
*
*/
app.registerHelpers= function(w,d,hb) {
	
	/**
	* helper `fileicon`
	*/
	hb.registerHelper('fileicon', function(contentType){
		if(!contentType) contentType = ""
		switch (contentType.toLowerCase()) {
			case 'application/pdf':
				return 'fa-file-pdf-o';
			case 'image/png':
			case 'image/gif':
				return 'fa-file-image-o';
			case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
			case 'application/msword':
				return 'fa-file-word-o';
			default:
				return 'fa-file-o'
		}
	})
	
	/**
	* helper flowTag
	*/
	hb.registerHelper('flowTag', function(o){
		var s = o||""
		switch (o) {
			case "simple":
					s = '<span class="w3-tag w3-tiny 1w3-green">簡易</span>';break;
			case "detail":
					s = '<span class="w3-tag w3-tiny 1w3-red">詳細</span>';break;
			default:
					break;
		}
		s = s.replace('<span ','<span title="'+o+'"')
		return new Handlebars.SafeString(s);
	})

	/**
	* helper 'member'
	*/
	hb.registerHelper('member',function(obj , field, member, options){
		if(!obj[field]) return "";
		if(!obj[field][member]) return "";
		return obj[field][member]
	})
	
	/**
	* helper `ifCond` - conditional comparison.
	* @param {Any} v1
	* @param {String} operator
	* @param {Any} v2 
	*/
	hb.registerHelper('ifCond', function (v1, operator, v2, options) {
			switch (operator) {
					//case '=':
					//		return (v1 == v2) ? options.fn(this) : options.inverse(this);
					case '==':
							return (v1 == v2) ? options.fn(this) : options.inverse(this);
					case '===':
							return (v1 === v2) ? options.fn(this) : options.inverse(this);
					case '<':
							return (v1 < v2) ? options.fn(this) : options.inverse(this);
					case '<=':
							return (v1 <= v2) ? options.fn(this) : options.inverse(this);
					case '>':
							return (v1 > v2) ? options.fn(this) : options.inverse(this);
					case '>=':
							return (v1 >= v2) ? options.fn(this) : options.inverse(this);
					case '&&':
							return (v1 && v2) ? options.fn(this) : options.inverse(this);
					case '||':
							return (v1 || v2) ? options.fn(this) : options.inverse(this);
					default:
							return options.inverse(this);
			}
	});
	
	/**
	* helper `name` - return name string of the parameter is a nameObject.
	* @param {Object} o - a JS Object
	* @return {String}
	*/
	hb.registerHelper('name',function(o){
		if('string' === typeof o) return o
		if(o&&(o.en||o.tc)) {
			var s = ""
			if(o.en) s = o.en
			if(o.en&&o.tc) s+= ", "
			if(o.tc) s+= o.tc
			return s
		}
		return ""
	})
	
	/**
	* helper `keys` - return a string of a list of attrs of the object, separated by comma.
	* @param {Object} o - a JS Object
	* @return {String}
	*/
	hb.registerHelper('keys',function(o){
		return Object.keys(o).join(", ")
	})
	
	hb.registerHelper('length',function(o){
		return o.length||0
	})
	
	/**
	* heper `hasKey` - return the value of key
	* @param {Object} context - object containing keyName
	* @param {String} keyName - the key name to check
	*/
	/*hb.registerHelper('hasKey', function(context,keyName,options){
		if(context[keyName]) {
			return options.fn(this)
		} else {
			return options.inverse(this)
		}
	})*/
	
	/**
	* heper `hasKey` - return the code if one key matched, almost at 5 keys to match.
	* @param {Object} context - object containing keyName
	* @param {String} keyNames - the key name to check
	*/
	hb.registerHelper('hasKey', function(context,k1,k2,k3,k4,k5,options){
		//console.log('hasKey start:')
		//console.log('hasKey:arguments:',arguments)
		if(arguments.length<3) return options.inverse(this)
		context = arguments[0]
		var m = arguments.length-1
		options = arguments[m]
		var k = arguments;
		//console.log('checking preparation:',context,options,k,m,this)
		//console.log(options.fn(this))
		var b = false;
		if(k[1]&&(1<m)) { if(context[k[1]]) { return options.fn(this) } ; /*b=true*/}
		if(k[2]&&(2<m)) { if(context[k[2]]) { return options.fn(this) } ; /*b=true*/}
		if(k[3]&&(3<m)) { if(context[k[3]]) { return options.fn(this) } ; /*b=true*/}
		//console.log('second last line b:',b , k[1],k[1]&&(1<m),k[2]&&(2<m))
		if(!b) return options.inverse(this)
	})
	
	/**
	* helper `numberMask` - mask a number
	* @param {Number} x - number
	* @return {String}
	* http://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
	*/
	hb.registerHelper('numberMask',function(x){
		x = parseInt(x)
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	})
	
	/**
	* helper `timestamp` - generate a timestamp number
	* @param {Object} o - a JavaScript Object to be stringified
	* @return {String}
	*/
	hb.registerHelper('timestamp',function(o){
		return Date.now()
	})
	
	/**
	* helper timetext
	* this is not fully implemented
	*/
	hb.registerHelper('timetext', function(o){
		var d = Date.parse(o)
		if(isNaN(d)) return o
		d = new Date(d)
		return d.getMonth()+1 + "月" +　d.getDate() + "日"
	})
	
	/**
	* helper timetextById
	* this is not fully implemented
	*/
	hb.registerHelper('timetextById', function(o){
		var d = app.dateById(o)
		if(isNaN(d)) return o
		d = new Date(d)
		return d.getMonth()+1 + "月" +　d.getDate() + "日"
	})
	
	
	/**
	* hepler `stringify` - make JSON.stringify on the input object
	* @param {Object} o - a JavaScript Object to be stringified
	* @return {String}
	*/
	hb.registerHelper('stringify',function(o){
		return JSON.stringify(o)
	})
	
	hb.registerHelper('oneBasedIndex', function(o){
		return o+1 
	})
	
	/**
	* helper statusTag
	*/
	hb.registerHelper('statusTag', function(o){
		var s = o||""
		switch (o) {
			case true:
					s = '<span class="w3-tag w3-tiny w3-green">是</span>';break;
			case false:
					s = '<span class="w3-tag w3-tiny w3-red">否</span>';break;
			case "accepted":
					s = '<span class="w3-tag w3-tiny w3-orange">已接受</span>';break;
			case "active":
					s = '<span class="w3-tag w3-tiny w3-green">正式</span>';break;
			case "approved":
					s = '<span class="w3-tag w3-tiny w3-yellow">已審批</span>';break
			case "awarded":
					s = '<span class="w3-tag w3-tiny w3-yellow">勝出</span>';break
			case "closed":
					s = '<span class="w3-tag w3-tiny w3-green">完結</span>';break;
			case "created":
					s = '<span class="w3-tag w3-tiny w3-light-grey">已產生</span>';break;
			case "draft":
					s = '<span class="w3-tag w3-tiny w3-yellow">草擬中</span>';break;
			case "frozen":
					s = '<span class="w3-tag w3-tiny w3-green">已凍結</span>';break;
			case "issued":
					s = '<span class="w3-tag w3-tiny w3-yellow">新發放</span>';break
			case "issuing":
					s = '<span class="w3-tag w3-tiny w3-orange">RFQ發送中</span>';break;
			case "manager-approved":
					s = '<span class="w3-tag w3-tiny w3-orange">已批准</span>';break;
			case "manager-rejected":
					s = '<span class="w3-tag w3-tiny w3-orange">已拒絕</span>';break;
			case "rejected":
					s = '<span class="w3-tag w3-tiny w3-red">已退回 <i class="fa fa-exclamation-circle"></i></span>';break;
			case "released":
					s = '<span class="w3-tag w3-tiny w3-green">已發放</span>';break;
			case "responded-timeup":
					s = '<span class="w3-tag w3-tiny w3-green">已回覆</span>';break;
			case "suspended":
					s = '<span class="w3-tag w3-tiny w3-red">停用</span>';break;
			case "unresponded-timeup":
					s = '<span class="w3-tag w3-tiny w3-red">未回覆</span>';break;
			case "waiting-for-manager-approval":
					s = '<span class="w3-tag w3-tiny w3-orange">待審批</span>';break;
			case "working":
					s = '<span class="w3-tag w3-tiny w3-yellow">編輯中</span>';break
			default:
					break;
		}
		s = s.replace('<span ','<span title="'+o+'"')
		return new Handlebars.SafeString(s);
	})
	
	/**
	* hepler `uom` - covert uom if it is a standard UOM defined in app.ui.UOM
	* @param {Object} o - string
	* @return {String}
	*/
	hb.registerHelper('uom', function(o){
		if(!app.ui.UOM) return o
		var arr = o.split("/")
		//if(arr.length != 2) return o
		var h = arr[0], c = arr[1]
		if(!app.ui.UOM[h]) return o
		var a = app.ui.UOM[h]
		if(!c) c = a.class;
		var s = '<span class="w3-tag w3-round w3-pale-blue w3-tooltip">'+a.symbol+
							'<div class="w3-text w3-nowrap" style="top:100%;left:-50%">'+c+'</div>'+
						'</span>'
		return new Handlebars.SafeString(s);
	})
	
}


/**
* old ui methods
*/


!function(w,d){
	if(!w.ui) w.ui = {}
	ui.page = {}
	ui.page.load =function(url,holder) {
		closeSideNav()
		$.get(url,function(r){
			$(holder).html(r)
			ui.page.prepareFileInput()
		})
	}
	
	
	// e.g.:
	// ui.page.updateSelectUI(
	//	"[data-field='businessClasses']",
	//	pagelet.businessClasses, 
	//	{"data-field":"businessClass._id",value:"$_id$",text:"$code$ $name$" }
	// )
	ui.page.updateSelectUI = function(uiSelector,dataArray, op) { 
		
		var $el = $(uiSelector)
		if(!$el.length) return console.warn("No elements found");
		if(!$.isArray(dataArray)) return console.warn("The second param must be array");
		if(!dataArray.length) return;
		var pattern = /\$[a-zA-Z_.-]+\$/ig // pattern for variables defined in string. (i.e. $xxx$ )
		if(op&&op.value) {
			var vp = op.value.match(pattern) // value placeholders
			if(vp) var v = vp.map(function(s){ return s.replace(/\$/g,"")}) // value vars
			for(var i=0;i<v.length;i++) {
				if('undefined' === typeof dataArray[0][v[i]]) return console.warn("value attr error. no such fields " + v[i]  )
			}
		}
		if(op&&op.text) {
			var tp = op.text.match(pattern) // text placeholders
			if(tp) var t = tp.map(function(s){ return s.replace(/\$/g,"")}) //text vars
			for(var i=0;i<t.length;i++) {
				if('undefined' === typeof dataArray[0][t[i]]) return console.warn("text attr error. no such fields " + t[i]  )
			}
		}
		
		$el.each(function(){
			var $this = $(this)
			var s = ''
			if(this.tagName!='SELECT') {$this = $this.find("SELECT")}
			//console.log($this)
			
			if($this.length&&($this[0].tagName=='SELECT')) {
				var placeholder = $this.attr("placeholder")
				if(placeholder) s += '<option class="app-placeholder-option" value="">' + placeholder + '</option>'
				if(op["data-field"]) $this.attr("data-field",op["data-field"])
				for(var i=0;i<dataArray.length;i++) {
					var vs = op.value||""
					for(var j=0;j<v.length;j++){
						vs = vs.replace(vp[j],dataArray[i][v[j]])
					}
					var ts = op.text||""
					for(var j=0;j<t.length;j++){
						ts = ts.replace(tp[j],dataArray[i][t[j]])
					}
					s += '<option value="'+ vs+'">' + ts + '</option>'
				}
				if(placeholder) {
					$this.css('color','#bbb');
					$this.on('change',function(){
						var current = $this.val();
						if (current != 'null') {
								$this.css('color','');
						} else {
								$this.css('color','#bbb');
						}
					})
				}
			} else {
				console.warn('no select element found')
			}
			//console.log(s)
			$this.html(s)
		})
		
	}
	
	ui.page.loadTemplate =function(selector) {
		if(!Handlebars) return console.warn('Cannot process. ui.page.loadTemplate method requires Hanldebars.')
		return Handlebars.compile($(selector).html())
	}
	
	ui.page.toast=function(s,color) {
		if(!s) return;
		if(!color) color ='green'
		var $toast = $(".app-toast"),
			colors = ['red','yellow','green'],
			i = colors.indexOf(color),
			color = (i>=0)?colors[i]:'green'
		var html ='<div class="w3-container w3-pale-green w3-leftbar w3-border-green w3-animate-right w3-small" style="postion:absolute;top:0px;">'+
								'<span style="line-height:30px;">'+s+'</span>' +
							'</div>'
		html = html.replace('w3-pale-green','w3-pale-'+color).replace('w3-border-green','w3-border-'+color)
		console.log(html)
		if($toast.length) {
			console.log($toast)
			$toast.html(html)
			$toast.show();
			setTimeout(function(){
				$toast.fadeOut();	
			},2000)
		}
	}
	
	ui.page.prepareFileInput=function() {
		
		$(".app-file").on("click",function(){
			var $this = $(this)
			var field = $this.attr("data-field");
			var $fileHolder = $(".app-file-holder")
			var $f = $(".app-file-hidden")
			if(!$f.length) return console.warn('The element "'+$f.selector +'" not found.')
			$f.unbind();
			$f.on('change',function(){
				var i = $fileHolder.find(".file").length
				var html ='<div class="w3-card-2 w3-margin w3-padding file" style="display:inline-block">'+
							'{{name}}  <i class="fa fa-times"></i>' +
							'<input type="hidden" data-field="'+field+'.{{i}}" value="{{_id}}">' +
							'</div>'
						
				var f = $f[0].files[0]
				if(!f) return // no file selected
				console.log('file for this upload:\n',f)
				
				// using FormData object
				var fd = new FormData()
				fd.append('file',f)
				console.log(fd)
				
				var url = "/data/file"
				
				var xhr = new XMLHttpRequest()
				xhr.onreadystatechange=function() {
					if(this.readyState == 4) {
						var msg = this.responseText
						var r = JSON.parse(msg)
						var result = r.result
						var file = result.data
						
						html = html.replace("{{i}}", i)
						html = html.replace("{{_id}}",file._id)
						html = html.replace("{{name}}",file.filename)
						$fileHolder.append(html)
						//pagelet.files.push(file)
						
						//a.download = file.filename
						//a.href="/data/file/raw/" + file._id
						//a.innerText = file.filename
					}
				}
				xhr.open('post',url)
				xhr.send(fd)
				
			})
			$f.click()
			
		})
	}
	
	$(".app-select-mask").on('focus',function(){
		var $this = $(this)
		var $next = $this.next()
		if($next.length) {
			var $select = ($next[0].tagName=='SELECT')?$next:$next.find("SELECT")
			var filler = $select.attr("data-post")
			if(filler) eval(filler)
			var $select = ($next[0].tagName=='SELECT')?$next:$next.find("SELECT")
			$this.hide()
			$next.show()
			window.$next = $next
			$select.focus()
		}
	})
	
}(window,document)

