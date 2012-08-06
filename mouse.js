// mouse events (down-move-up, wheel)

function MouseHandler() {
  // mouse events handler

  // recent real (paper) coordinates
  this.real_x = 0;
  this.real_y = 0;

  // start coordinates of 3-step actions (1=mouse down, 2=mouse move, 3=mouse up)
  this.start_x = 0;
  this.start_y = 0;
  this.start_button = -1;

  // selection
  this.sel_count = 0;

  // log time of mouse down/up to prevent misclicks
  this.time_down = 0;
  this.time_up = 0;

  this.updateRealXY = function (AThis, AEvent) {
    // update real_x, real_y after mouse event on canvas
    var mx = AEvent.pageX-AThis.offsetLeft;
    var my = AEvent.pageY-AThis.offsetTop;
    this.real_x = mx * (kiji.canvas.width / kiji.canvas.clientWidth) - kiji.dx;
    this.real_y = my * (kiji.canvas.height / kiji.canvas.clientHeight) - kiji.dy;
  }


  this.canvasOnMouseDown = function(AThis,AEvent) {
    // press mouse button above canvas
    this.updateRealXY(AThis,AEvent)
    //console.log('MouseHandler.canvasOnMouseDown(rx:'+this.real_x+', ry:'+this.real_y+', b:'+AEvent.button+')');
    this.time_down = AEvent.timeStamp;

    // remember start point
    this.start_x = this.real_x;
    this.start_y = this.real_y;
    this.start_button = AEvent.button;
    this.start_handle = -1;

    // select item
    if ( (this.start_button==0)&&(kiji.tool == 'Move') )
      kiji.current_item = itemSelect(kiji.report, this.real_x, this.real_y, AEvent.shiftKey);
    this.sel_count = itemSelectedCount(kiji.report)

    // nothing is selected
    if (this.sel_count == 0) {
      console.log('note: nothing is selected');
      kiji.current_item = null;
    }

    // redraw to show selection changes
    redraw('mh.canvasOnMouseDown');

    // if we clicked on line, detect if it is begin/middle/end of line
    if ( (this.sel_count==1)&&(kiji.tool == 'Move') ) {
      this.start_handle = lineHandle(kiji.current_item, this.start_x, this.start_y);
      //console.log('lineHandle:'+this.start_handle);
    }

    // show attributes of recently selected item
    attributesShow(kiji.current_item);

    // workaround for linux clipboard
    if (this.start_button == 1)
      return true;

    return false;
  }



  this.canvasOnMouseUp = function(AThis,AEvent) {
    // release mouse button
    //console.log('MouseHandler.canvasOnMouseUp(...)');
    this.updateRealXY(AThis,AEvent)
    this.time_up = AEvent.timeStamp;

    // finish pan
    if (this.start_button==1) {
      kiji.dx = kiji.dx + this.real_x - this.start_x;
      kiji.dy = kiji.dy + this.real_y - this.start_y;
      redraw('mh.canvasOnMouseUp');
    }

    // finish move
    if (kiji.tool == 'Move') {
      if ( (this.start_button==0) && (this.sel_count>=0) ) {
        // prevent misclicks (NOTE: currently it uses only temporal click data, it would be better to use both temporal and spatial click data to decide if it was misclick or regular movement)
        console.log('dt='+(this.time_up-this.time_down));
        if (this.time_up-this.time_down > kiji.temporal_misclick_threshold) {
          undoPush(kiji.report);
          // finished moving line begin
          if (this.start_handle == 1) {
            //console.log('finished moving line begin');
            kiji.current_item.X = this.real_x;
            kiji.current_item.Y = this.real_y;
          }
          // finished moving line end
          if (this.start_handle == 2) {
            //console.log('finished moving line end');
            kiji.current_item.EndX = this.real_x;
            kiji.current_item.EndY = this.real_y;
          }
          // ortogonalize line after editing
          if (this.start_handle > 0)
            lineOrtogonalize(kiji.current_item,this.start_handle);
          // finish moving normal objects or middle of line
          if (this.start_handle <= 0) {
            var mx = this.real_x-this.start_x;
            var my = this.real_y-this.start_y;
            itemMoveSelected(kiji.report, mx, my);
          }
        }
        // redraw
        redraw('mh.canvasOnMouseUp 2');
      }
    }

    // text: click where new text is supposed to be added
    if ( (kiji.tool == 'Text') && (this.start_button == 0) ) {
      var s = 'Caption';
      var fs = itemFirstSelected(kiji.report);
      attributesShow(fs);
      var s = prompt('Add new text',s);
      if (s) {
        undoPush(kiji.report);
        // add new text
        var t = textCreate(s,this.real_x,this.real_y);
        kiji.current_item = t;
        kiji.report.push(t);
      }
      redraw('mh.canvasOnMouseUp 3');
    }

    // line: end of line
    if ( (kiji.tool == 'Line') && (this.start_button == 0) ) {
      // add new line
      undoPush(kiji.report);
      var l = lineCreate(this.start_x, this.start_y, this.real_x, this.real_y);
      lineOrtogonalize(l);
      kiji.current_item = l;
      kiji.report.push(l)
      redraw('mh.canvasOnMouseUp 4');
    }

    // corner: adjust corner of nearby intersecting lines
    if ( (kiji.tool == 'Corner') && (this.start_button == 0) ) {
      undoPush(kiji.report);
      lineCorner(this.real_x, this.real_y);
      redraw('mh.canvasOnMouseUp 5');
    }

    // button is no longer down
    this.start_button = -1;

    return false;
  }



  this.canvasOnMouseMove = function(AThis,AEvent) {
      // mouse move on canvas
    this.updateRealXY(AThis,AEvent)
    document.getElementById('rxy').innerHTML = 'X:'+this.real_x.toFixed(1)+', Y:'+this.real_y.toFixed(1);

    // pan
    if (this.start_button==1) {
      // redraw bg on new position
      kiji.context.clearRect(0,0,kiji.canvas.width,kiji.canvas.height);
      kiji.context.drawImage(kiji.bg, kiji.dx+this.real_x-this.start_x, kiji.dy+this.real_y-this.start_y);
    }

    // draw items being moved
    if (kiji.tool == 'Move') {
      if ((this.start_button==0) && (this.sel_count>=0)) {
        // background
        kiji.context.clearRect(0,0,kiji.canvas.width,kiji.canvas.height);
        kiji.context.drawImage(kiji.bg, kiji.dx, kiji.dy);
        // single line is moved differently
        if ( (kiji.current_item)&&(kiji.current_item.Type == 'Line') && (this.sel_count==1) && (this.start_handle > 0) ) {
          // move begin/all/end of single line
          // move begin if line
          if (this.start_handle==1) {
            lineDrawPrimitive(kiji.dx,kiji.dy,
              this.real_x,
              this.real_y,
              kiji.current_item.EndX,
              kiji.current_item.EndY,
              kiji.current_item.Selected,
              kiji.current_item.Color,
              kiji.current_item.Thickness);
          }
          // move end of line
          if (this.start_handle==2) {
            lineDrawPrimitive(kiji.dx,kiji.dy,
              kiji.current_item.X,
              kiji.current_item.Y,
              this.real_x,
              this.real_y,
              kiji.current_item.Selected,
              kiji.current_item.Color,
              kiji.current_item.Thickness);
          }
        } else {
          // move other items (Text)
          var dx2 = kiji.dx + this.real_x - this.start_x;
          var dy2 = kiji.dy + this.real_y - this.start_y;
          for (var i=0; i<kiji.report.length; i++)
            if (kiji.report[i].Selected)
              kiji.report[i].draw(dx2,dy2);
        }
      }
    }

    // redraw line while it is being added
    if ( (kiji.tool == 'Line')&&(this.start_button==0) ) {
      // background
      kiji.context.clearRect(0,0,kiji.canvas.width,kiji.canvas.height);
      kiji.context.drawImage(kiji.bg, kiji.dx, kiji.dy);
      // cline
      lineDrawPrimitive(kiji.dx,kiji.dy,
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

    if (kiji.button == 2) {
      if (AEvent.wheelDelta > 0)
        updateZoom(AThis,AEvent,1,0.5)
      else
        updateZoom(AThis,AEvent,1,-0.5);
      return false;
    }


    /*
    if (kiji.button == 1) {
      if (AEvent.wheelDelta > 0)
        updateZoom(AThis,AEvent,1,0.5)
      else
        updateZoom(AThis,AEvent,1,-0.5);
      return false;
    }
    */
  }

}


