// line

function lineCreate(ACanvas,AContext,AX,AY,AEndX,AEndY) {
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
  return t;
}

function lineDrawItem(ACanvas,AContext,ADx,ADy,AItem) {
  // draw AB line
  lineDraw(ACanvas,AContext,ADx,ADy,AItem.X,AItem.Y,AItem.EndX,AItem.EndY,AItem.Selected,AItem.Color,AItem.Thicknes);
}

function lineDraw(ACanvas,AContext,ADx,ADy,AX1,AY1,AX2,AY2,ASelected,AColor,AThicknes,AGrip) {
  // line drawing from point A to B (used for new lines)
  AContext.fillStyle = "black";
  AContext.strokeStyle = 'black';
  // color by selection state
  if (ASelected) {
    AContext.fillStyle = "rgba(0,0,255,1.0)";
    AContext.strokeStyle = "rgba(0,0,255,1.0)";
    // grips
    // origin
    if (mouse_handler.start_handle == 1)
      AContext.fillStyle = "rgba(0,255,255,1.0)";
    else
      AContext.fillStyle = "rgba(0,255,0,1.0)";
    AContext.fillRect(ADx+AX1-2,ADy+AY1-2,4,4);
    // end
    if (mouse_handler.start_handle == 2)
      AContext.fillStyle = "rgba(0,255,255,1.0)";
    else
      AContext.fillStyle = "rgba(0,255,0,1.0)";
    AContext.fillRect(ADx+AX2-2,ADy+AY2-2,4,4);
  } else {
    AContext.fillStyle = "rgba(0,0,0,1.0)";
    AContext.strokeStyle = AColor;
  }
  // line
  AContext.save();
  AContext.lineWidth = AThicknes;
  AContext.beginPath();
  AContext.moveTo(ADx+AX1,ADy+AY1);
  AContext.lineTo(ADx+AX2,ADy+AY2);
  AContext.stroke();
  AContext.restore();
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

