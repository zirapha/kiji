// text object (alphabetic baseline)

function textDrawItem(ADx,ADy,AItem) {
  // draw text item
  textDraw(AItem.Caption,AItem.X,AItem.Y,AItem.Width,AItem.Height,AItem.Font,AItem.Color,AItem.Selected,ADx,ADy);
}

function textDraw(ACaption,AX,AY,AWidth,AHeight,AFont,AColor,ASelected,ADx,ADy) {
  // actual text drawing
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
  //kiji.context.font = t.Height+'px '+t.Font;
  //t.Width = 1*kiji.context.measureText(ACaption).width;
  return t;
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

