// items manipulating functions

function itemConvert(AReport) {
  // ad-hoc mass conversion code goes here, only for development purposes
  undoPush(AReport);
  for(var i=0; i<AReport.length; i++) {
    if (AReport[i].Type == 'Text') {
      AReport[i].Font = 'Sans';
      AReport[i].Height -= 2;
      AReport[i].Width = textWidth(canvas,context,AReport[i].Caption,AReport[i].Font,AReport[i].Height);
    }
  }
  redraw('itemConvert');
}

function itemBind(AReport) {
  // after report is loaded (from json) add methods depending on type
  for(var i=0; i<AReport.length; i++) {
    switch(AReport[i].Type) {
      case 'Text':
        AReport[i].distance = textDistance;
        AReport[i].draw = textDraw;
        AReport[i].move = textMove;
        break;
      case 'Line':
        AReport[i].distance = lineDistance;
        AReport[i].draw = lineDraw;
        AReport[i].move = lineMove;
        break;
    }
  }
}

function itemSelectedCount(AReport) {
  // return number of selected items
  var s = 0;
  for(var i=0; i<AReport.length; i++)
    if (AReport[i].Selected)
      s++;
  return s;
}

function itemDeleteSelected(AReport) {
  // delete selected items
  for(var i=AReport.length-1; i>0; i--)
    if (AReport[i].Selected)
      AReport.splice(i,1);
}

function itemFirstSelected(AReport) {
  // return first selected item
  for(var i=0; i<AReport.length; i++)
    if (AReport[i].Selected)
      return AReport[i];
  return null;
}

function itemMoveSelected(AReport,ADeltaX,ADeltaY) {
  // move selected items by given delta
  for(var i=0; i<AReport.length; i++)
    if (AReport[i].Selected)
      AReport[i].move(ADeltaX,ADeltaY);
}

function itemSelect(AReport,AX,AY,AThreshold,AAddToSelection) {
  // select item by clicking on or near it, returns any of the items that was selected, handle multiselection using shift
  console.log('itemSelect(AReport[0..'+(AReport.length-1)+'], x:'+AX+', y:'+AY+', tr:'+AThreshold+', add:'+AAddToSelection+')');
  var currently_selected_item = null;

  // did user clicked something already selected? if so do not remove previous selection
  var already_selected = false;
  for (var i=0; i<AReport.length; i++)
    if (AReport[i].distance(AX,AY) <= AThreshold)
      if (AReport[i].Selected)
        already_selected = true;

  // cancel previous selection
  if ( (!AAddToSelection)&&(!already_selected) )
    for (var i=0; i<AReport.length; i++)
      AReport[i].Selected = false;

  // select all items within threshold
  var s = 0;
  for (var i=0; i<AReport.length; i++)
    if (AReport[i].distance(AX,AY) <= AThreshold) {
      if (!AReport[i].Selected)
        s++;
      if (AAddToSelection)
        AReport[i].Selected = !AReport[i].Selected;
      else
        AReport[i].Selected = true;
      currently_selected_item = AReport[i];
    }

  return currently_selected_item;
}



