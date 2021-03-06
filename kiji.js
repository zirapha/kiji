// main js code

var
  kiji = new Object();
  kiji.report = [];
  kiji.canvas = null;
  kiji.context = null;
  kiji.bg = null;
  kiji.guide = null;
  kiji.zoom = 1.0;
  kiji.tool = 'Move';
  kiji.old_tool = kiji.tool;
  kiji.mouse_handler = null;
  kiji.attributes_focused = false;
  kiji.dx = 0;
  kiji.dy = 0;
  kiji.current_item = null;
  kiji.button = null;
  kiji.threshold_color = 'RGBA(255,0,155,0.2)';
  kiji.line_threshold_orig = 5;
  kiji.text_threshold_orig = 2;
  kiji.line_threshold = kiji.line_threshold_orig;
  kiji.text_threshold = kiji.text_threshold_orig;
  kiji.show_threshold = false;
  kiji.line_ortogonal = false;
  kiji.temporal_misclick_threshold = 300;

function bodyOnLoad() {
  // initialize form
  // canvas
  kiji.canvas = document.getElementById('canvas');
  kiji.context = kiji.canvas.getContext('2d');
  // load background
  kiji.bg = new Image();
  kiji.bg.onload = bgOnLoad;
  kiji.bg.src = 'report1.png';
  // restore bg pan
  kiji.dx = 1*localStorage.getItem('KIJI_DX');
  kiji.dy = 1*localStorage.getItem('KIJI_DY');
  kiji.zoom = 1.0*localStorage.getItem('KIJI_ZOOM');
  document.getElementById('show_threshold').checked = (localStorage.getItem('KIJI_ST') == 'true');
  document.getElementById('line_ortogonal').checked = (localStorage.getItem('KIJI_ORTO') == 'true');
  if (localStorage.hasOwnProperty('KIJI_ST'))
    kiji.show_threshold = (localStorage.getItem('KIJI_ST') == 'true');
  if (localStorage.hasOwnProperty('KIJI_ORTO'))
    kiji.line_ortogonal = (localStorage.getItem('KIJI_ORTO') == 'true');
  if (kiji.zoom <= 0) kiji.zoom = 1;
  updateThreshold();
  // load report from local storage
  if (localStorage.getItem('KIJI_REPORT')) {
    kiji.report = JSON.parse(localStorage.getItem('KIJI_REPORT'));
    itemBind(kiji.report);
    // I tend to screw things during development, so I push clean report straight into undo
    undoPush(kiji.report);
  }
  // restore guide
  if (localStorage.hasOwnProperty('KIJI_GUIDE')) {
    kiji.guide = localStorage.getItem('KIJI_GUIDE');
    document.getElementById('guide').value = 100*kiji.guide;
  }
  // mouse handler
  kiji.mouse_handler = new MouseHandler();
  // fill selected item to inputs
  kiji.current_item = itemFirstSelected(kiji.report);
  attributesShow(kiji.current_item);
  // initial tool = move
  setTool(document.getElementById(kiji.tool));
}

function bodyOnUnload() {
  // remember basic settings (probably only during development so I don't have to scroll and pan every refresh)
  localStorage.setItem('KIJI_DX',kiji.dx);
  localStorage.setItem('KIJI_DY',kiji.dy);
  localStorage.setItem('KIJI_ZOOM',kiji.zoom);
  localStorage.setItem('KIJI_REPORT',JSON.stringify(kiji.report));
  localStorage.setItem('KIJI_ST',document.getElementById('show_threshold').checked);
  localStorage.setItem('KIJI_ORTO',document.getElementById('line_ortogonal').checked);
  localStorage.setItem('KIJI_GUIDE',kiji.guide);
}

function bgOnLoad() {
  // when background image is loaded set propper canvas resolution
  //console.log('bgOnLoad(): bg.w='+bg.width+' bg.h='+bg.height);
  kiji.canvas.width = kiji.bg.width / kiji.zoom;
  kiji.canvas.height = kiji.bg.height / kiji.zoom;
  redraw('bgOnLoad');
}

function updateThreshold() {
  // calculate optimal threshold
  kiji.line_threshold = kiji.line_threshold_orig / kiji.zoom;
  kiji.text_threshold = kiji.text_threshold_orig / kiji.zoom;
  if (kiji.line_threshold < 1.5)
    kiji.line_threshold = 1.5;
  console.log('zoom='+kiji.zoom+' LT='+kiji.line_threshold);
  document.getElementById('thr').innerHTML = 'Z:'+kiji.zoom.toFixed(2)+' T:'+kiji.line_threshold.toFixed(2);
}

function updateZoom(AThis,AEvent,AKoefMul,AKoefAdd) {
  // arbitrary zoom
  //console.log('zoom('+AKoefMul+'*'+zoom+'+'+AKoefAdd+'): zoom='+zoom+' cw='+kiji.canvas.width+' ch='+kiji.canvas.height+' dx='+kiji.dx+' dy='+kiji.dy);
  // qx,qy = real coords on paper (background), e.g. 200,400 control point
  var cx = AEvent.pageX-AThis.offsetLeft;
  var cy = AEvent.pageY-AThis.offsetTop;
  var qx = cx*(kiji.canvas.width/kiji.canvas.clientWidth)-kiji.dx;
  var qy = cy*(kiji.canvas.height/kiji.canvas.clientHeight)-kiji.dy;
  //console.log('    cx='+cx+' cy='+cy+' qx='+qx+' qy='+qy);

  // actual zoom
  kiji.zoom = AKoefMul*kiji.zoom + AKoefAdd;
  if (kiji.zoom < 0.5) {
    kiji.zoom = 0.5;
    return false;
  }
  if (kiji.zoom > 20) {
    kiji.zoom = 20;
    return false;
  }
  kiji.canvas.width = kiji.bg.width / kiji.zoom;
  kiji.canvas.height = kiji.bg.height / kiji.zoom;

  // now return pan back to origin, so that zoomed point remain under mouse cursor
  kiji.dx = -qx + cx*(kiji.canvas.width/kiji.canvas.clientWidth);
  kiji.dy = -qy + cy*(kiji.canvas.height/kiji.canvas.clientHeight);
  //console.log('    dx='+kiji.dx+' dy='+kiji.dy);

  // calculate optimal threshold
  updateThreshold();

  redraw('updateZoom');
}

function zoom100() {
  // restore zoom to 100% and move report to origin
  kiji.zoom = 1.0;
  updateThreshold();
  kiji.canvas.width = kiji.bg.width / kiji.zoom;
  kiji.canvas.height = kiji.bg.height / kiji.zoom;
  kiji.dx = 0;
  kiji.dy = 0;
  redraw('zoom100');
}

function redraw(AIdentifier) {
  // redraw entire canvas
  console.log('redraw('+AIdentifier+'): c.w='+kiji.canvas.width+' c.h='+kiji.canvas.height+' bg.w='+kiji.bg.width+' bg.h='+kiji.bg.height+' dx='+kiji.dx+' dy='+kiji.dy)
  // clear canvas
  kiji.context.clearRect(0,0,kiji.canvas.width,kiji.canvas.height);
  // background
  if (kiji.guide>0) {
    kiji.context.drawImage(kiji.bg, kiji.dx, kiji.dy);
    // transparent white overlay
    kiji.context.fillStyle = 'rgba(255,255,255,'+(1-kiji.guide)+')';
    kiji.context.fillRect(kiji.dx, kiji.dy, kiji.bg.width, kiji.bg.height);
  } else {
    // 100% white overlay
    kiji.context.fillStyle = 'white';
    kiji.context.fillRect(kiji.dx, kiji.dy, kiji.bg.width, kiji.bg.height);
  }
  // report items
  for (var i=0; i<kiji.report.length; i++)
    kiji.report[i].draw(kiji.dx,kiji.dy);
}

function toolUndo() {
  // undo last change
  if (undoAvailable()) {
    kiji.report = undoPop(kiji.report);
    redraw('toolUndo');
  } else
    console.log('undo: not available');
}

function bodyOnKeyDown(AThis,AEvent) {
  // special keys (like del)
  //console.log(AEvent);

  // if any input element is focused, disable items shortcuts because they would
  // interfere with text input key bindings (arrows, ctrl+arrows, ctrl+shift+arrows,
  // ctrl+a, del, ...)
  if (kiji.attributes_focused)
    return true;

  // if tool is help, esc hides it and set tool to move
  if ( (kiji.tool=='Help')&&(AEvent.keyCode==27) )
    setTool(document.getElementById(kiji.old_tool));

  // ctrl+z = undo
  if ( AEvent.ctrlKey && (AEvent.keyCode==90) )
    toolUndo();

  // delete = delete selected items
  console.log('bodyOnKeyDown(keyCode='+AEvent.keyCode+', shiftKey='+AEvent.shiftKey+', ctrlKey='+AEvent.ctrlKey+')');
  if ((AEvent.keyCode == 46)&&(itemSelectedCount(kiji.report)>0)) {
    console.log('DEL');
    document.activeElement = kiji.canvas;
    undoPush(kiji.report);
    itemDeleteSelected(kiji.report);
    kiji.current_item = null;
    kiji.mouse_handler.current = null;
    redraw('bodyOnKeyDown 1');
    attributesShow(null);
    return true;
  }

  // was arrows used
  var left  = (AEvent.keyCode == 37);
  var right = (AEvent.keyCode == 39);
  var up    = (AEvent.keyCode == 38);
  var down  = (AEvent.keyCode == 40);
  var arrows = (left||right||up||down);

  // shift+arrows changes item size
  if (AEvent.shiftKey && arrows) {
    // text: up/down changes Height
    for (var i=0; i<kiji.report.length; i++) {
      if (kiji.report[i].Selected) {
        switch (kiji.report[i].Type) {
          case "Line": lineResize(kiji.report[i],left,right,up,down,kiji.mouse_handler.start_handle); break;
          case "Text": textResize(kiji.report[i],left,right,up,down); break;
        }
      }
    }
    // done
    redraw('bodyOnKeyDown 2');
    attributesShow(kiji.current_item);
    return true;
  }

  // arrow movements (1px normal, 8px when ctrl is pressed)
  if (arrows) {
    var delta = AEvent.ctrlKey ? 8 : 1;
    // up
    if (up) {
      itemMoveSelected(kiji.report,0,-delta);
      redraw('bodyOnKeyDown 3');
      return false;
    }
    // down
    if (down) {
      itemMoveSelected(kiji.report,0,delta);
      redraw('bodyOnKeyDown 4');
      return false;
    }
    // left
    if (left) {
      itemMoveSelected(kiji.report,-delta,0);
      redraw('bodyOnKeyDown 5');
      return false;
    }
    // right
    if (right) {
      itemMoveSelected(kiji.report,delta,0);
      redraw('bodyOnKeyDown 6');
      return false;
    }
  }

  return true;
}

function setTool(AThis) {
  // set tool and mark it's button as selected (blue)
  kiji.old_tool = kiji.tool;
  kiji.tool = AThis.id;
  document.getElementById('Move').setAttribute('class',(AThis.id=='Move')?'selected':'');
  document.getElementById('Text').setAttribute('class',(AThis.id=='Text')?'selected':'');
  document.getElementById('Line').setAttribute('class',(AThis.id=='Line')?'selected':'');
  document.getElementById('Help').setAttribute('class',(AThis.id=='Help')?'selected':'');
  document.getElementById('Corner').setAttribute('class',(AThis.id=='Corner')?'selected':'');
  // let some tools use different cursor
  canvas.style.cursor = 'default';
  if (kiji.tool == 'Corner')
    canvas.style.cursor = 'crosshair';
  // show/hide help or canvas
  document.getElementById('HelpContent').style.display = (kiji.tool=='Help')?'block':'none';
  document.getElementById('canvas').style.display      = (kiji.tool=='Help')?'none':'block';
  console.log('tool='+kiji.tool);
}

function attributesShow(AItem) {
  // fill attributes inputs with data
  //console.log('attributesShow: '+AItem.Type);
  document.getElementById('attr_x').value        = (AItem&&AItem.X) ? AItem.X : '';
  document.getElementById('attr_y').value        = (AItem&&AItem.Y) ? AItem.Y : '';
  document.getElementById('attr_caption').value  = (AItem&&AItem.Caption) ? AItem.Caption : '';
  document.getElementById('attr_width').value    = (AItem&&AItem.Width) ? AItem.Width : '';
  document.getElementById('attr_height').value   = (AItem&&AItem.Height) ? AItem.Height : '';
  document.getElementById('attr_thicknes').value = (AItem&&AItem.Thicknes) ? AItem.Thicknes : '';
  document.getElementById('attr_font').value     = (AItem&&AItem.Font) ? AItem.Font : '';
  document.getElementById('attr_color').value    = (AItem&&AItem.Color) ? AItem.Color : '';
  document.getElementById('attr_endx').value     = (AItem&&AItem.EndX) ? AItem.EndX : '';
  document.getElementById('attr_endy').value     = (AItem&&AItem.EndY) ? AItem.EndY : '';
}

function attrOnFocus(AThis) {
  // attribute input get focus
  console.log('attrOnFocus('+AThis.id+')');
  document.getElementById('attributes').setAttribute('class','focus');
  kiji.attributes_focused = true;
}

function attrOnBlur(AThis) {
  // attribute input lost focus
  console.log('attrOnBlur('+AThis.id+')');
  document.getElementById('attributes').setAttribute('class','');
  kiji.attributes_focused = false;
}

function attrOnInput(AThis,AEvent) {
  // user changed input, change selected item(s)
  console.log('attrOnInput: '+AThis.id+' := '+AThis.value);
  var r = false;
  for(var i=0; i<kiji.report.length; i++)
    if (kiji.report[i].Selected) {
      switch (AThis.id) {
        case 'attr_caption'  : textChangeCaption(kiji.report[i],AThis.value); r=true; break;
        case 'attr_color'    : kiji.report[i].Color = AThis.value; r=true; break;
        case 'attr_height'   : kiji.report[i].Height = 1*AThis.value; if (kiji.report[i].Type == 'Text') textChangeCaption(kiji.report[i],kiji.report[i].Caption); r=true; break;
        case 'attr_thicknes' : kiji.report[i].Thicknes = 1*AThis.value; r=true; break;
        default: throw "Attribute '"+AThis.id+"' change is not yet supported!";
      }
    }
  if (r)
    redraw('attrOnInput');
}

function backup(AReport) {
  // save report backup on server (so that it would be versioned in git too)
  var xhr = new XMLHttpRequest();
  xhr.open("POST", 'backup.php', true);
  xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
  xhr.onreadystatechange =
  function() {
    if (xhr.readyState == 4 && xhr.status == 200) {
      if (xhr.responseText=='')
        alert('Backup successfull');
      else
        alert(xhr.responseText);
    }
    if (xhr.readyState == 4 && xhr.status != 200) {
      alert('Error: '+xhr.status);
    }
  };
  xhr.send('json='+JSON.stringify(AReport));
}

function attrOnMouseDown(AThis,AEvent) {
  // workarond: linux middle button clipboard would paste text into input while pan
  return true;
}

function attrOnKeyDown(AThis,AEvent) {
  // special shortcuts when attribute input is selected

  // esc = if input element is focused, unfocus it (switch to items editing)
  if (AEvent.keyCode==27) {
    console.log('ESC');
    document.getElementById(kiji.tool).focus();
  }
}

function bodyOnMouseDown(AThis,AEvent) {
  // remember mouse button for onmousewheel event
  kiji.button = AEvent.button;
}

function bodyOnMouseUp(AThis,AEvent) {
  // remember mouse button for onmousewheel event
  kiji.button = null;
}

function bodyOnMouseWheel(AThis,AEvent) {
  // override standard browser ctrl+wheel to kiji's own zoom
  //console.log('bodyOnMouseWheel c='+AEvent.ctrlKey+' kmb='+kiji.button);


/*  if (kiji.button == 1) {
    if (AEvent.wheelDelta > 0)
      updateZoom(canvas,AEvent,1,0.5)
    else
      updateZoom(canvas,AEvent,1,-0.5);

    return false;
  }
*/

  // shift+wheel = alternative zoom
  if (AEvent.shiftKey) {
    if (AEvent.wheelDelta > 0)
      updateZoom(canvas,AEvent,1,0.5)
    else
      updateZoom(canvas,AEvent,1,-0.5);
    return false;
  }
  //  return false;
}

function changeThresholdVisibility(AChecked) {
  // change whether threshold indicator should be visible or not
  kiji.show_threshold = AChecked;
  redraw();
}

function changeLineOrtogonal(AChecked) {
  // change whether new lines will be ortogonalized
  kiji.line_ortogonal = AChecked;
}

function changeGuide(AThis,AEvent) {
  // change level of white overlay
  kiji.guide = 1*AThis.value/100;
  console.log('changeGuide: value='+AThis.value+' guide='+kiji.guide);
  redraw();
}

function dot(AX,AY) {
  // draw helper dot, last until next refresh
  kiji.context.fillStyle = "red";
  kiji.context.strokeStyle = "green";
  kiji.context.fillRect(AX-2+kiji.dx,AY-2+kiji.dy,4,4);
}
