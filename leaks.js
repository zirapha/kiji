// show all global js variables, objects and functions

function leaks() {
  // inspect all javascript global variables and functions and print what is not part of browser
  // this functions is intended to show if you accidentaly declared global variable
  var n = 0;
  var leaked_objects = [];
  var leaked_functions = [];
  var leaked_others = [];
  var leaked_problems = [];

  for (g in window) {
    try {

      // dont show this function itself
      if (g=='leaks')
        continue;

      // ignore standard objects (some of them depends on browsers)
      // chrome 20.0
      if (['applicationCache','Audio','blur','clientInformation','close','closed',
           'console','crypto','defaultstatus','defaultStatus','devicePixelRatio',
           'document','event','frameElement','localStorage','onabort','onbeforeunload',
           'onblur','oncanplay','oncanplaythrough','onclick','oncontextmenu','ondblclick',
           'ondeviceorientation','ondrag','ondragend','ondragenter','ondragleave',
           'ondragover','ondragstart','ondrop','ondurationchange','onemptied',
           'onended','onerror','onfocus','onhashchange','onchange','oninput',
           'oninvalid','onkeydown','onkeypress','onkeyup','onload','onloadeddata',
           'onloadedmetadata','onloadstart','onmessage','onmousedown','onmousemove',
           'onmouseout','onmouseover','onmouseup','onmousewheel','onoffline','ononline',
           'onpagehide','onpageshow','onpause','onplay','onplaying','onpopstate',
           'onprogress','onratechange','onreset','onresize','onscroll','onsearch',
           'onseeked','onseeking','onselect','onstalled','onstorage','onsubmit',
           'onsuspend','ontimeupdate','onunload','onvolumechange','onwaiting',
           'onwebkitanimationend','onwebkitanimationiteration','onwebkitanimationstart',
           'onwebkittransitionend','opener','sessionStorage','webkitIndexedDB',
           'external','focus','frames','history','chrome','Image','innerHeight',
           'innerWidth','leaks','length','location','locationbar','menubar','name',
           'navigator','offscreenBuffering','Option','outerHeight','outerWidth',
           'pageXOffset','pageYOffset','parent','performance','PERSISTENT',
           'personalbar','postMessage','screen','screenLeft','screenTop',
           'screenX','screenY','scrollbars','scrollX','scrollY','self','status',
           'statusbar','styleMedia','TEMPORARY','toolbar','top','v8Locale',
           'webkitAudioContext','webkitAudioPannerNode','webkitIDBCursor',
           'webkitIDBDatabase','webkitIDBDatabaseException','webkitIDBFactory',
           'webkitIDBIndex','webkitIDBKeyRange','webkitIDBObjectStore',
           'webkitIDBRequest','webkitIDBTransaction','WebKitIntent',
           'webkitNotifications','webkitPostMessage','webkitStorageInfo',
           'webkitURL','XMLDocument','applicationCache','Audio','blur',
           'clientInformation','close','closed','console','crypto','defaultstatus',
           'defaultStatus','devicePixelRatio','document','event','frameElement',
           'localStorage','onabort','onbeforeunload','onblur','oncanplay',
           'oncanplaythrough','onclick','oncontextmenu','ondblclick',
           'ondeviceorientation','ondrag','ondragend','ondragenter',
           'ondragleave','ondragover','ondragstart','ondrop','ondurationchange',
           'onemptied','onended','onerror','onfocus','onhashchange','onchange',
           'oninput','oninvalid','onkeydown','onkeypress','onkeyup','onload',
           'onloadeddata','onloadedmetadata','onloadstart','onmessage','onmousedown',
           'onmousemove','onmouseout','onmouseover','onmouseup','onmousewheel',
           'onoffline','ononline','onpagehide','onpageshow','onpause','onplay',
           'onplaying','onpopstate','onprogress','onratechange','onreset','onresize',
           'onscroll','onsearch','onseeked','onseeking','onselect','onstalled',
           'onstorage','onsubmit','onsuspend','ontimeupdate','onunload',
           'onvolumechange','onwaiting','onwebkitanimationend','onwebkitanimationiteration',
           'onwebkitanimationstart','onwebkittransitionend','opener','sessionStorage',
           'webkitIndexedDB','external','focus','frames','history','chrome','Image',
           'innerHeight','innerWidth','leaks','length','location','locationbar',
           'menubar','name','navigator','offscreenBuffering','Option','outerHeight',
           'outerWidth','pageXOffset','pageYOffset','parent','performance','PERSISTENT',
           'personalbar','postMessage','screen','screenLeft','screenTop','screenX',
           'screenY','scrollbars','scrollX','scrollY','self','status','statusbar',
           'styleMedia','TEMPORARY','toolbar','top','v8Locale','webkitAudioContext',
           'webkitAudioPannerNode','webkitIDBCursor','webkitIDBDatabase',
           'webkitIDBDatabaseException','webkitIDBFactory','webkitIDBIndex',
           'webkitIDBKeyRange','webkitIDBObjectStore','webkitIDBRequest',
           'webkitIDBTransaction','WebKitIntent','webkitNotifications',
           'webkitPostMessage','webkitStorageInfo','webkitURL','XMLDocument'].indexOf(g) >= 0)
        continue;

      // standard but non-enumerable objects
      if (['window'].indexOf(g) >= 0)
        continue;

      // ignore native functions
      if (eval(g).toString() == 'function '+g+'() { [native code] }')
        continue;

      // print and count leaked object to console
      console.log(g+' ('+typeof(eval(g))+')');
      n++;

      // sort leaks by type
      var t = typeof(eval(g));
      switch (t) {
        case 'function': leaked_functions.push(g); break;
        case 'object': leaked_objects.push(g); break;
        default: leaked_others.push(g);
      }
    } catch(e) {
      // anything that is null cannot be called with .toString()
      n++;
      console.log('error: cannot eval "'+g+'"');
      leaked_problems.push(g);
    }

  }
  console.log(n+' leaked objects total');
  var summary = '';
  if (leaked_objects.length > 0)
    summary += 'Global objects: '+leaked_objects.length+'\n\n'+leaked_objects.join(', ')+'\n\n';
  if (leaked_functions.length > 0)
    summary += 'Global functions: '+leaked_functions.length+'\n\n'+leaked_functions.join(', ')+'\n\n';
  if (leaked_others.length > 0)
    summary += 'Global others: '+leaked_others.length+'\n\n'+leaked_others.join(', ')+'\n\n';
  if (leaked_problems.length > 0)
    summary += 'Eval problems: '+leaked_problems.length+'\n\n'+leaked_problems.join(', ')+'\n\n';
  summary += 'Found '+n+' leaks total.';
  alert(summary);
}

