// main js code

var
  report = [];
  canvas = null;
  context = null;
  bg = null;
  white = false;
  zoom = 1.0;
  tool = 'Move';
  mouse_handler = null;
  focused_input = null;
  focused_input_old = null;
  focused_input_no_del = null;

function bodyOnLoad() {
  // initialize form
  // canvas
  canvas = document.getElementById('canvas');
  context = canvas.getContext('2d');
  // load background
  bg = new Image();
  bg.onload = bgOnLoad;
  bg.src = 'report1.png';
  // restore bg pan
  dx = 1*localStorage.getItem('KIJI_DX');
  dy = 1*localStorage.getItem('KIJI_DY');
  zoom = 1.0*localStorage.getItem('KIJI_ZOOM');
  if (zoom <= 0) zoom = 1;
  // load report from local storage
  if (localStorage.getItem('KIJI_REPORT')) {
    report = JSON.parse(localStorage.getItem('KIJI_REPORT'));
    // I tend to screw things during development, so I push clean report straight into undo
    undoPush(report);
  }
  // mouse handler
  mouse_handler = new MouseHandler(canvas,context,report);
  // fill selected item to inputs
  current_item = itemFirstSelected(report);
  this.current = current_item;
  attributesShow(current_item);
  // initial tool = move
  setTool(document.getElementById(tool));
}

function bodyOnUnload() {
  // remember basic settings (probably only during development so I don't have to scroll and pan every refresh)
  localStorage.setItem('KIJI_DX',dx);
  localStorage.setItem('KIJI_DY',dy);
  localStorage.setItem('KIJI_ZOOM',zoom);
  localStorage.setItem('KIJI_REPORT',JSON.stringify(report));
}

function bgOnLoad() {
  // when background image is loaded set propper canvas resolution
  //console.log('bgOnLoad(): bg.w='+bg.width+' bg.h='+bg.height);
  canvas.width = bg.width / zoom;
  canvas.height = bg.height / zoom;
  redraw('bgOnLoad');
}

function updateZoom(AThis,AEvent,AKoefMul,AKoefAdd) {
  // arbitrary zoom
  //console.log('zoom('+AKoefMul+'*'+zoom+'+'+AKoefAdd+'): zoom='+zoom+' cw='+canvas.width+' ch='+canvas.height+' dx='+dx+' dy='+dy);
  // qx,qy = real coords on paper (background), e.g. 200,400 control point
  var cx = AEvent.pageX-AThis.offsetLeft;
  var cy = AEvent.pageY-AThis.offsetTop;
  var qx = cx*(canvas.width/canvas.clientWidth)-dx;
  var qy = cy*(canvas.height/canvas.clientHeight)-dy;
  //console.log('    cx='+cx+' cy='+cy+' qx='+qx+' qy='+qy);

  // actual zoom
  zoom = AKoefMul*zoom + AKoefAdd;
  if (zoom < 0.5) {
    zoom = 0.5;
    return false;
  }
  if (zoom > 20) {
    zoom = 20;
    return false;
  }
  canvas.width = bg.width / zoom;
  canvas.height = bg.height / zoom;

  // now return pan back to origin, so that zoomed point remain under mouse cursor
  dx = -qx + cx*(canvas.width/canvas.clientWidth);
  dy = -qy + cy*(canvas.height/canvas.clientHeight);
  //console.log('    dx='+dx+' dy='+dy);

  redraw('updateZoom');
}

function zoom100() {
  // restore zoom to 100% and move report to origin
  zoom = 1.0;
  canvas.width = bg.width / zoom;
  canvas.height = bg.height / zoom;
  dx = 0;
  dy = 0;
  redraw('zoom100');
}

function redraw(AIdentifier) {
  // redraw entire canvas
  console.log('redraw('+AIdentifier+'): c.w='+canvas.width+' c.h='+canvas.height+' bg.w='+bg.width+' bg.h='+bg.height+' dx='+dx+' dy='+dy)
  // clear canvas
  context.clearRect(0,0,canvas.width,canvas.height);
  // background
  context.fillRect();
  context.drawImage(bg, dx, dy);
  // 90% white overlay
  if (white) {
    context.fillStyle = 'rgba(255,255,255,0.90)';
    context.fillRect(dx, dy, bg.width, bg.height);
  }
  // report items
  for (i=0; i<report.length; i++)
    itemDraw(canvas,context,dx,dy,report[i]);
}

function toolUndo() {
  // undo last change
  if (undoAvailable()) {
    report = undoPop(report);
    redraw('toolUndo');
  } else
    console.log('undo: not available');
}

function bodyOnKeyDown(AThis,AEvent) {
  // special keys (like del)
  //console.log(AEvent);

  // ctrl+z = undo
  if ( AEvent.ctrlKey && (AEvent.keyCode==90) )
    toolUndo();

  // delete = delete selected items
  console.log('bodyOnKeyDown(keyCode='+AEvent.keyCode+', shiftKey='+AEvent.shiftKey+', ctrlKey='+AEvent.ctrlKey+', focus='+(focused_input?focused_input.id:null)+')');
  if ((!focused_input)&&(AEvent.keyCode == 46)&&(itemSelectedCount(report)>0)) {
    console.log('DEL');
    document.activeElement = canvas;
    undoPush(report);
    itemDeleteSelected(report);
    current_item = null;
    mouse_handler.current = null;
    redraw('bodyOnKeyDown 1');
    attributesShow(null);
    return true;
  }

  // esc = if input element is focused, unfocus it (so that DEL will work)
  if (AEvent.keyCode==27) {
    console.log('ESC');
    focused_input_old = null;
    focused_input = null;
    focused_input_no_del = null;
    document.getElementById(tool).focus();
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
    for (i=0; i<report.length; i++) {
      if (report[i].Selected) {
        switch (report[i].Type) {
          case "Line": lineResize(report[i],left,right,up,down,mouse_handler.start_handle); break;
          case "Text": textResize(canvas,context,report[i],left,right,up,down); break;
        }
      }
    }
    // done
    redraw('bodyOnKeyDown 2');
    attributesShow(current_item);
    return false;
  } else {
    // arrow movements (1px normal, 8px when ctrl is pressed)
    if (AEvent.ctrlKey) {   // temporal workaround - to prevent movement of item when cursor moves in input
      var delta = AEvent.ctrlKey ? 1 : 8;
      // up
      if (AEvent.keyCode==38) {
        itemMoveSelected(report,0,-delta);
        redraw('bodyOnKeyDown 3');
        return true;
      }
      // down
      if (AEvent.keyCode==40) {
        itemMoveSelected(report,0,delta);
        redraw('bodyOnKeyDown 4');
        return true;
      }
      // left
      if (AEvent.keyCode==37) {
        itemMoveSelected(report,-delta,0);
        redraw('bodyOnKeyDown 5');
        return true;
      }
      // right
      if (AEvent.keyCode==39) {
        itemMoveSelected(report,delta,0);
        redraw('bodyOnKeyDown 6');
        return true;
      }
    } else {
      //
      return true;
    }
  }

  return true;
}

function setTool(AThis) {
  // set tool and mark it's button as selected (blue)
  tool = AThis.id;
  document.getElementById('Move').setAttribute('class',(AThis.id=='Move')?'selected':'');
  document.getElementById('Text').setAttribute('class',(AThis.id=='Text')?'selected':'');
  document.getElementById('Line').setAttribute('class',(AThis.id=='Line')?'selected':'');
  document.getElementById('Help').setAttribute('class',(AThis.id=='Help')?'selected':'');
  // show/hide help
  document.getElementById('HelpContent').style.display = (tool=='Help')?'block':'none';
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
  console.log('attrOnFocus('+AThis.id+')');
  focused_input_old = focused_input;
  focused_input = AThis;
  focused_input_no_del = AThis; // this is not nulled for "DEL" workaround
}

function attrOnInput(AThis,AEvent) {
  // user changed input, change selected item(s)
  console.log('attrOnInput: '+AThis.id+' := '+AThis.value);
  var AReport = report;
  var r = false;
  for(var i=0; i<AReport.length; i++)
    if (AReport[i].Selected) {
      switch (AThis.id) {
        case 'attr_caption'  : textChangeCaption(canvas,context,AReport[i],AThis.value); r=true; break;
        case 'attr_color'    : AReport[i].Color = AThis.value; r=true; break;
        case 'attr_height'   : AReport[i].Height = 1*AThis.value; if (AReport[i].Type == 'Text') textChangeCaption(canvas,context,AReport[i],AReport[i].Caption); r=true; break;
        case 'attr_thicknes' : AReport[i].Thicknes = 1*AThis.value; r=true; break;
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
  // workaround for this: select none, f5, select text, click caption, select text, click caption, del - entire text is deleted instead of letter in caption
  focused_input = AThis;
  // workarond to prevent linux middle button clipboard to interfere with e.g. pasting thincknes into input while pan
  return true;
}

function attrOnKeyDown(AThis,AEvent) {
  // workaround for DEL to erase entire item instead of character in caption
  focused_input = AThis;
}

