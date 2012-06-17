// mouse events (down-move-up, wheel)

function MouseHandler(ACanvas,AContext,AReport) {
  // mouse events handler

  // attributes
  this.canvas = ACanvas;
  this.context = AContext;
  this.report = AReport;

  // recent real (paper) coordinates
  this.real_x = 0;
  this.real_y = 0;

  // start coordinates of 3-step actions (1=mouse down, 2=mouse move, 3=mouse up)
  this.start_x = 0;
  this.start_y = 0;
  this.start_button = -1;

  // selection
  this.current = null;
  this.sel_count = 0;

  this.updateRealXY = function (AThis, AEvent) {
    // update real_x, real_y after mouse event on canvas
    var mx = AEvent.pageX-AThis.offsetLeft;
    var my = AEvent.pageY-AThis.offsetTop;
    this.real_x = mx * (this.canvas.width / this.canvas.clientWidth) - dx;
    this.real_y = my * (this.canvas.height / this.canvas.clientHeight) - dy;
  }


  this.canvasOnMouseDown = function(AThis,AEvent) {
    // press mouse button above canvas
    this.updateRealXY(AThis,AEvent)
    //console.log('MouseHandler.canvasOnMouseDown(rx:'+this.real_x+', ry:'+this.real_y+', b:'+AEvent.button+')');

    // remember start point
    this.start_x = this.real_x;
    this.start_y = this.real_y;
    this.start_button = AEvent.button;
    this.start_handle = -1;

    // select item
    if (this.start_button==0) {
      if (itemSelect(this.report, this.real_x, this.real_y, 5, AEvent.shiftKey)) {
        this.current = current_item;
      }
    }
    this.sel_count = itemSelectedCount(this.report)

    // nothing is selected
    if (this.sel_count == 0) {
      console.log('note: nothing is selected');
      current_item = null;
      this.current = null;
    } else {
      this.current = current_item;
    }

    // redraw to show selection changes
    redraw('mh.canvasOnMouseDown');

    // if we clicked on line, detect if it is begin/middle/end of line
    if ( (this.sel_count==1)&&(tool == 'Move') ) {
      this.start_handle = lineHandle(current_item, this.start_x, this.start_y);
      //console.log('lineHandle:'+this.start_handle);
    }

    // show attributes of recently selected item
    attributesShow(this.current);

    // if any attribute input is selected, select its value
    var fo = focused_input_no_del;
    if (fo) {
      fo.select();
      //console.log(fo.id+' select');
    }

    // workaround: mark that input is no longer "active" so that DEL would work as expected
    if (focused_input) {
      focused_input_old = focused_input;
      focused_input_no_del = focused_input;
      focused_input = null;
    }

    // workaround for linux clipboard
    if (this.start_button == 1) {
      //console.log('workaround: linux clipboard middle button');
      return true;
    }

    return false;
  }



  this.canvasOnMouseUp = function(AThis,AEvent) {
    // release mouse button
    //console.log('MouseHandler.canvasOnMouseUp(...)');
    this.updateRealXY(AThis,AEvent)

    // finish pan
    if (this.start_button==1) {
      dx = dx + this.real_x - this.start_x;
      dy = dy + this.real_y - this.start_y;
      redraw('mh.canvasOnMouseUp');
    }

    // finish move
    if (tool == 'Move') {
      if ((this.start_button==0) && (this.sel_count>=0)) {
        undoPush(this.report);
        // finished moving line begin
        if (this.start_handle == 1) {
          //console.log('finished moving line begin');
          current_item.X = this.real_x;
          current_item.Y = this.real_y;
        }
        // finished moving line end
        if (this.start_handle == 2) {
          //console.log('finished moving line end');
          current_item.EndX = this.real_x;
          current_item.EndY = this.real_y;
        }
        // ortogonalize line after editing
        if (this.start_handle > 0)
          lineOrtogonalize(current_item,this.start_handle);
        // finish moving normal objects or middle of line
        if (this.start_handle <= 0)
          itemMoveSelected(this.report, this.real_x-this.start_x, this.real_y-this.start_y);
        // redraw
        redraw('mh.canvasOnMouseUp 2');
      }
    }

    // text: click where new text is supposed to be added
    if ( (tool == 'Text') && (this.start_button == 0) ) {
      var s = 'Caption';
      var fs = itemFirstSelected(this.report);
      attributesShow(fs);
      var s = prompt('Add new text',s);
      if (s) {
        undoPush(this.report);
        // add new text
        var t = textCreate(this.canvas,this.context,s,this.real_x,this.real_y);
        current_item = t;
        report.push(t);
      }
      redraw('mh.canvasOnMouseUp 3');
    }

    // line: end of line
    if ( (tool == 'Line') && (this.start_button == 0) ) {
      // add new line
      undoPush(this.report);
      var l = lineCreate(this.canvas, this.context, this.start_x, this.start_y, this.real_x, this.real_y);
      lineOrtogonalize(l);
      current_item = l;
      report.push(l)
      redraw('mh.canvasOnMouseUp 4');
    }

    // button is no longer down
    var o = this.start_button;
    this.start_button = -1;

    // workaround for linux clipboard and pan (focus some input and while you pan with middle button, it will paste text from clipboard to input)
    if (o == 1) {
      //console.log('focused_input='+focused_input_old);
      var fo = focused_input_old;
      if (fo) {
        fo.focus();
        fo.select();
      }
      return true;
    }
    return false;
  }



  this.canvasOnMouseMove = function(AThis,AEvent) {
      // mouse move on canvas
    this.updateRealXY(AThis,AEvent)
    rxy.innerHTML = 'X:'+this.real_x.toFixed(1)+', Y:'+this.real_y.toFixed(1);

    // pan
    if (this.start_button==1) {
      // redraw bg on new position
      context.clearRect(0,0,canvas.width,canvas.height);
      context.fillRect();
      context.drawImage(bg, dx+this.real_x-this.start_x, dy+this.real_y-this.start_y);
    }

    // draw items being moved
    if (tool == 'Move') {
      if ((this.start_button==0) && (this.sel_count>=0)) {
        // background
        context.clearRect(0,0,this.canvas.width,this.canvas.height);
        context.fillRect();
        context.drawImage(bg, dx, dy);
        // single line is moved differently
        if ( (current_item)&&(current_item.Type == 'Line') && (this.sel_count==1) && (this.start_handle > 0) ) {
          // move begin/all/end of single line
          // move begin if line
          if (this.start_handle==1) {
            lineDraw(this.canvas,this.context,dx,dy,
              this.real_x,
              this.real_y,
              current_item.EndX,
              current_item.EndY,
              current_item.Selected,current_item.Color,current_item.Thickness);
          }
          // move end of line
          if (this.start_handle==2) {
            lineDraw(this.canvas,this.context,dx,dy,
              current_item.X,
              current_item.Y,
              this.real_x,
              this.real_y,
              current_item.Selected,current_item.Color,current_item.Thickness);
          }
        } else {
          // move other items (Text)
          var dx2 = dx + this.real_x - this.start_x;
          var dy2 = dy + this.real_y - this.start_y;
          for (var i=0; i<this.report.length; i++)
            if (this.report[i].Selected) {
              itemDraw(this.canvas,this.context,dx2,dy2,this.report[i]);
            }
        }
      }
    }

    // redraw line while it is being added
    if ( (tool == 'Line')&&(this.start_button==0) ) {
      // background
      context.clearRect(0,0,this.canvas.width,this.canvas.height);
      context.fillRect();
      context.drawImage(bg, dx, dy);
      // cline
      lineDraw(this.canvas,this.context,dx,dy,
        this.start_x,
        this.start_y,
        this.real_x,
        this.real_y,
        false,'black',1);
    }

    return true;
  }



  this.canvasOnMouseWheel = function (AThis,AEvent) {
    // zoom in/out canvas
    //console.log('canvasOnMouseWheel(x:'+AEvent.clientX+', y:'+AEvent.clientY+', b:'+AEvent.button+')');
    if (AEvent.wheelDelta > 0)
      updateZoom(AThis,AEvent,1,0.5)
    else
      updateZoom(AThis,AEvent,1,-0.5);
    return false;
  }

}


