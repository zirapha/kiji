// text object (alphabetic baseline)

function textDrawItem(ACanvas,AContext,ADx,ADy,AItem) {
  // draw text item
  textDraw(ACanvas,AContext,AItem.Caption,AItem.X,AItem.Y,AItem.Width,AItem.Height,AItem.Font,AItem.Color,AItem.Selected,ADx,ADy);
}

function textDraw(ACanvas,AContext,ACaption,AX,AY,AWidth,AHeight,AFont,AColor,ASelected,ADx,ADy) {
  // actual text drawing
  // color by selection state
  AContext.fillStyle = "rgba(0,0,0,1.0)";
  AContext.textAlign = "left";
  AContext.textBaseline = "alphabetic";
  // color by selection state
  if (ASelected) {
    AContext.fillStyle = "rgba(0,0,255,1.0)";
    AContext.strokeStyle = "rgba(0,0,255,1.0)";
  } else {
    AContext.fillStyle = "rgba(0,0,0,1.0)";
    AContext.strokeStyle = "rgba(0,0,0,1.0)";
  }
  // text
  AContext.save();
  AContext.translate(AX,AY);
  AContext.font = AHeight+'px '+AFont;
  if (ACaption == '')
    AContext.fillText('{EMPTY}',ADx,ADy);
  else
    AContext.fillText(ACaption,ADx,ADy);
  // rectangle around text
  /*
  AContext.lineWidth = 1;
  AContext.beginPath();
  AContext.rect(ADx,ADy-AHeight,AWidth,AHeight);
  AContext.stroke();
  AContext.lineWidth = 1.0;
  */
  AContext.restore();
}

function textCreate(ACanvas,AContext,ACaption,AX,AY) {
  // create new text
  var t = new Object();
  t.Type = 'Text';
  t.Selected = false;
  t.X = AX;
  t.Y = AY;
  t.Height = 13;
  t.Font = 'Sans';
  textChangeCaption(ACanvas,AContext,t,ACaption);
  //AContext.font = t.Height+'px '+t.Font;
  //t.Width = 1*AContext.measureText(ACaption).width;
  return t;
}

function textChangeCaption(ACanvas,AContext,AItem,ACaption) {
  // po zmene caption treba zmenit width
  AItem.Caption = ACaption;
  AContext.font = AItem.Height+'px '+AItem.Font;
  AItem.Width = 1*AContext.measureText(AItem.Caption).width;
  if (ACaption == '')
    AItem.Width = 1*AContext.measureText('{EMPTY}').width;
}

function textWidth(ACanvas,AContext,ACaption,AFont,AHeight) {
  // return text width
  AContext.font = AHeight+'px '+AFont;
  return 1*AContext.measureText(ACaption).width;
}

function textResize(ACanvas,AContext,AItem,ALeft,ARight,AUp,ADown) {
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
  AItem.Width = textWidth(ACanvas,AContext,AItem.Caption,AItem.Font,AItem.Height)
}

