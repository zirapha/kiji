// text object (alphabetic baseline)

function textCreate(ACaption,AX,AY) {
  // create new text
  var t = new Object();
  t.Type = 'Text';
  t.Selected = false;
  t.X = AX;
  t.Y = AY;
  t.Height = 13;
  t.Font = 'Sans';
  textChangeCaption(t,ACaption);
  t.move = textMove;
  t.distance = textDistance;
  t.draw = textDraw;
  return t;
}

function textDraw(ADx,ADy) {
  // draw text item
  textDrawPrimitive(this.Caption,this.X,this.Y,this.Width,this.Height,this.Font,this.Color,this.Selected,ADx,ADy);
}

function textDrawPrimitive(ACaption,AX,AY,AWidth,AHeight,AFont,AColor,ASelected,ADx,ADy) {
  // draw text item
  // threshold indicator
  if (kiji.show_threshold) {
    kiji.context.fillStyle = "RGBA(0,155,155,0.2)";
    kiji.context.fillRect(AX+ADx-kiji.threshold,AY+ADy-AHeight-kiji.threshold,AWidth+2*kiji.threshold,AHeight+2*kiji.threshold);
    //kiji.context.stroke();
  }
  // color by selection state
  kiji.context.fillStyle = "rgba(0,0,0,1.0)";
  kiji.context.textAlign = "left";
  kiji.context.textBaseline = "alphabetic";
  // color by selection state
  if (ASelected) {
    kiji.context.fillStyle = "rgba(0,0,255,1.0)";
    kiji.context.strokeStyle = "rgba(0,0,255,1.0)";
  } else {
    kiji.context.fillStyle = "rgba(0,0,0,1.0)";
    kiji.context.strokeStyle = "rgba(0,0,0,1.0)";
  }
  // text
  kiji.context.save();
  kiji.context.translate(AX,AY);
  kiji.context.font = AHeight+'px '+AFont;
  if (ACaption == '')
    kiji.context.fillText('{EMPTY}',ADx,ADy);
  else
    kiji.context.fillText(ACaption,ADx,ADy);
  // rectangle around text
  /*
  kiji.context.lineWidth = 1;
  kiji.context.beginPath();
  kiji.context.rect(ADx,ADy-AHeight,AWidth,AHeight);
  kiji.context.stroke();
  kiji.context.lineWidth = 1.0;
  */
  kiji.context.restore();
}

function textChangeCaption(AItem,ACaption) {
  // po zmene caption treba zmenit width
  AItem.Caption = ACaption;
  kiji.context.font = AItem.Height+'px '+AItem.Font;
  AItem.Width = 1*kiji.context.measureText(AItem.Caption).width;
  if (ACaption == '')
    AItem.Width = 1*kiji.context.measureText('{EMPTY}').width;
}

function textWidth(ACaption,AFont,AHeight) {
  // return text width
  kiji.context.font = AHeight+'px '+AFont;
  return 1*kiji.context.measureText(ACaption).width;
}

function textResize(AItem,ALeft,ARight,AUp,ADown) {
  // text resize using arrows while holding shift
  // NOTE: currently only up and down are used, because width is fixed to caption width
  // decrease height
  if (ADown) {
    AItem.Height--;
    if (AItem < 1)
      AItem.Height = 1;
  }
  // increase height
  if (AUp) {
    AItem.Height++;
  }
  // recalculate new width
  AItem.Width = textWidth(AItem.Caption,AItem.Font,AItem.Height)
}

function textDistance(AX,AY) {
  // return nearest distance to text, 0 if point is inside text
  if (pointInsideLTWH(AX,AY,this.X,this.Y-this.Height,this.Width,this.Height))
    return 0;
  return distancePointLTWH(AX,AY,this.X,this.Y-this.Height,this.Width,this.Height);
}

function textMove(ADeltaX,ADeltaY) {
  // move text by some delta
  this.X += ADeltaX;
  this.Y += ADeltaY;
}

