// line

function lineCreate(AX,AY,AEndX,AEndY) {
  // create new line
  var t = new Object();
  t.Type = 'Line';
  t.Thicknes = 1;
  t.Selected = false;
  t.Color = 'black';
  t.X = AX;
  t.Y = AY;
  t.EndX = AEndX;
  t.EndY = AEndY;
  t.move = lineMove;
  t.distance = lineDistance;
  t.draw = lineDraw;
  return t;
}

function lineDraw(ADx,ADy) {
  // draw AB line
  lineDrawPrimitive(ADx,ADy,this.X,this.Y,this.EndX,this.EndY,this.Selected,this.Color,this.Thicknes);
}

function lineDrawPrimitive(ADx,ADy,AX1,AY1,AX2,AY2,ASelected,AColor,AThicknes,AGrip) {
  // line drawing from point A to B
  // threshold indicator
  if (kiji.show_threshold) {
    kiji.context.fillStyle = "red";
    kiji.context.strokeStyle = kiji.threshold_color;
    kiji.context.lineWidth = 2*kiji.line_threshold;
    kiji.context.lineCap = 'round';
    kiji.context.beginPath();
    kiji.context.moveTo(ADx+AX1,ADy+AY1);
    kiji.context.lineTo(ADx+AX2,ADy+AY2);
    kiji.context.stroke();
    kiji.context.closePath();
    kiji.context.lineCap = 'miter';
  }
  // color by selection state
  kiji.context.fillStyle = "green";
  kiji.context.strokeStyle = 'black';
  if (ASelected) {
    kiji.context.fillStyle = "rgba(0,0,255,1.0)";
    kiji.context.strokeStyle = "rgba(0,0,255,1.0)";
    // grips
    // origin
    if (kiji.mouse_handler.start_handle == 1)
      kiji.context.fillStyle = "rgba(0,255,255,1.0)";
    else
      kiji.context.fillStyle = "rgba(0,255,0,1.0)";
    kiji.context.fillRect(ADx+AX1-2,ADy+AY1-2,4,4);
    // end
    if (kiji.mouse_handler.start_handle == 2)
      kiji.context.fillStyle = "rgba(0,255,255,1.0)";
    else
      kiji.context.fillStyle = "rgba(0,255,0,1.0)";
    kiji.context.fillRect(ADx+AX2-2,ADy+AY2-2,4,4);
  } else {
    kiji.context.fillStyle = "rgba(0,0,0,1.0)";
    kiji.context.strokeStyle = AColor;
  }
  // line
  kiji.context.lineWidth = AThicknes;
  kiji.context.beginPath();
  kiji.context.moveTo(ADx+AX1,ADy+AY1);
  kiji.context.lineTo(ADx+AX2,ADy+AY2);
  kiji.context.stroke();
  kiji.context.closePath();
}

function lineHandle(AItem,AX,AY) {
  // detect where we clicked on the line (-1=not selected, 0=in the middle, 1=begin of the line, 2=end of line)
  //console.log('lineHandle('+AItem+'.s='+(AItem?AItem.Selected:'-')+','+AX+','+AY+')');
  if (!AItem)
    return -1;
  if (!AItem.Selected)
    return -1;
  var d0 = distancePointPoint(AX,AY,(AItem.X+AItem.EndX)/2,(AItem.Y+AItem.EndY)/2);
  var d1 = distancePointPoint(AX,AY,AItem.X,AItem.Y);
  var d2 = distancePointPoint(AX,AY,AItem.EndX,AItem.EndY);
  //console.log('  d0='+d0.toFixed(2)+' d1='+d1.toFixed(2)+' d2='+d2.toFixed(2));
  if ( (d1 <= d0) && (d1 <= 5) ) // FIXME: use propper threshold value
    return 1;
  if ( (d2 <= d0) && (d2 <= 5) )
    return 2;
  return 0;
}

function lineOrtogonalize(AItem,AHandle,ADoNotChange) {
  // make line that is almost horizontal/vertical exactly horizontal/vertical by aligning points
  // if ADoNotChange is true, no actual change is made but true is returned, meaning that line needs to be ortogonalized
  // already ortogonal?
  if ( (AItem.X == AItem.EndX) || (AItem.Y == AItem.EndY) )
    return false;
  // get line length
  var l = distancePointPoint(AItem.X,AItem.Y,AItem.EndX,AItem.EndY);
  // is slope lower than 10%?
  if (Math.abs(AItem.X-AItem.EndX) < l/10) {
    // almost horizontal
    if (ADoNotChange)
      return true;
    if (AHandle == 1)
      AItem.EndX = AItem.X;
    else
      AItem.X = AItem.EndX;
  } else if (Math.abs(AItem.Y-AItem.EndY) < l/10) {
    // almost vertical
    if (ADoNotChange)
      return true;
    if (AHandle == 1)
      AItem.EndY = AItem.Y;
    else
      AItem.Y = AItem.EndY;
  }
  return false;
}

function lineResize(AItem,ALeft,ARight,AUp,ADown,AHandle) {
  // resize line (move active handle) using arrow keys
  var dx = 0;
  if (ALeft) dx = -1;
  if (ARight) dx = 1;
  var dy = 0;
  if (AUp) dy = -1;
  if (ADown) dy = 1;
  // origin
  if (AHandle == 1) {
    AItem.X += dx;
    AItem.Y += dy;
    console.log('lineResize: moving origin by '+dx+','+dy);
  } else
  // end
  if (AHandle == 2) {
    AItem.EndX += dx;
    AItem.EndY += dy;
    console.log('lineResize: moving end by '+dx+','+dy);
  } else
    console.log('lineResize: moving nothing, handle='+AHandle);
}

function lineDistance(AX,AY) {
  // return minimal distance from line item
  return distancePointLineSegment(AX,AY,this.X,this.Y,this.EndX,this.EndY);
}

function lineMove(ADeltaX,ADeltaY) {
  // move line by some delta
  this.X += ADeltaX;
  this.Y += ADeltaY;
  this.EndX += ADeltaX;
  this.EndY += ADeltaY;
}

function lineIsHorizontal(AItem,AThreshold) {
  // return true if line is (almost) horizontal
  return Math.abs(AItem.Y - AItem.EndY) <= AThreshold;
}

function lineIsVertical(AItem,AThreshold) {
  // return true if line is (almost) horizontal
  return Math.abs(AItem.X - AItem.EndX) <= AThreshold;
}

function lineCornerMove(AItem,AWhich,AX,AY) {
  // move specified (AWhich="Start" or "End") corner to certain position, return how much it moved
  // TODO: check if I don't use similar code in mouse move, i use handle=1/2 or something there
  if (AItem.Type != "Line")
    throw 'lineCornerMove error: AItem.Type is not Line but '+AItem.Type;
  var delta;
  if (AWhich == "Start") {
    delta = Math.abs(AItem.X-AX) - Math.abs(AItem.Y-AY);
    AItem.X = AX;
    AItem.Y = AY;
  } else if (AWhich == "End") {
    delta = Math.abs(AItem.EndX-AX) - Math.abs(AItem.EndY-AY);
    AItem.EndX = AX;
    AItem.EndY = AY;
  } else
    throw 'lineCornerMove error: AWhich must be either Start of End, but "'+AWhich+'" was given';
  return delta;
}

function lineCorner(AX,AY) {
  // find any nearby ortogonal line and if corner is nearby try to fix it (so that those line will start in single point)

  // variant 1: real corner |_ (both lines will be adjusted)
  var lines = [];
  var delta = 0;
  // find near lines
  for (var i=0; i<kiji.report.length; i++)
    if (kiji.report[i].Type == 'Line') {
      var line = kiji.report[i];
      // test both ends of line, add it to lines[] if they are near
      if (distancePointPoint(AX,AY,line.X,line.Y) <= kiji.line_threshold_orig)
        lines.push([line,'Start',lineIsHorizontal(line,0),lineIsVertical(line,0)]);
      else if (distancePointPoint(AX,AY,line.EndX,line.EndY) <= kiji.line_threshold_orig)
        lines.push([line,'End',lineIsHorizontal(line,0),lineIsVertical(line,0)]);
      // additionally test line for distance, this will be that middle line
      else if (distancePointLineSegment(AX,AY,line.X,line.Y,line.EndX,line.EndY) <= kiji.line_threshold_orig)
        lines.push([line,'Middle',lineIsHorizontal(line,0),lineIsVertical(line,0)]);
    }

  // test if this is really this variant 1
  // must be 2 lines touching by corner
  if ( (lines.length == 2) && (lines[0][1] != 'Middle') && (lines[1][1] != 'Middle') )
    // must have different slope
    if ( (lines[0][2]!=lines[1][2]) && (lines[0][3]!=lines[1][3]) ) {
      // alert('yes '+lines);
      var x,y;
      if (lines[0][2]) {
        // a) first is horizontal
        var x = lines[1][0].X;
        var y = lines[0][0].Y;
      } else {
        // b) second is horizontal
        var x = lines[0][0].X;
        var y = lines[1][0].Y;
      }
      // tune lines ends
      delta += lineCornerMove(lines[0][0],lines[0][1],x,y);
      delta += lineCornerMove(lines[1][0],lines[1][1],x,y);
    }

  // variant 2: T-junction |- (only 1 line will be adjusted)
  // must be 2 lines and one is always middle and one is alwas corner
  if (lines.length == 2) {
    var x,y;
    if ( (lines[0][1] == 'Middle') && (lines[1][1] != 'Middle') ) {
      //console.log('v2a');
      // first line is middle, second is corner
      if (lines[0][2]) {
        // a) first (middle) line is horizontal, use Y
        var x = lines[1][0].X;
        var y = lines[0][0].Y;
      } else {
        // a) first (middle) line is vertical, use X
        var x = lines[0][0].X;
        var y = lines[1][0].Y;
      }
      // move only second line, middle line never move!
      delta += lineCornerMove(lines[1][0],lines[1][1],x,y);
    }
    if ( (lines[0][1] != 'Middle') && (lines[1][1] == 'Middle') ) {
      //console.log('v2b');
      // first line is corner, second is middle
      if (lines[1][2]) {
        // a) second (middle) line is horizontal, use Y
        var x = lines[0][0].X;
        var y = lines[1][0].Y;
      } else {
        // a) second (middle) line is vertical, use X
        var x = lines[1][0].X;
        var y = lines[0][0].Y;
      }
      // move only first line, middle line never move!
      delta += lineCornerMove(lines[0][0],lines[0][1],x,y);
    }
  }

  console.log('Corner: delta='+delta.toFixed(2)+' lines='+lines);
}

