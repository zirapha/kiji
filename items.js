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
    if (AReport[i].Selected) {
      // Text
      if (AReport[i].Type == 'Text') {
        AReport[i].X += ADeltaX;
        AReport[i].Y += ADeltaY;
      }
      // line
      if (AReport[i].Type == 'Line') {
        AReport[i].X += ADeltaX;
        AReport[i].Y += ADeltaY;
        AReport[i].EndX += ADeltaX;
        AReport[i].EndY += ADeltaY;
      }
    }
}

var current_item = null; // FIXME: change it to be result of itemSelect

function itemSelect(AReport,AX,AY,AThreshold,AAddToSelection) {
  // select item by clicking on or near it, returns true if something was selected, handle multiselection using shift
  // FIXME: this code needs serious cleanup
  console.log('itemSelect(AReport[0..'+(AReport.length-1)+'], x:'+AX+', y:'+AY+', tr:'+AThreshold+', add:'+AAddToSelection+')');
  var m = AThreshold, mi = -1, d, s = 0;

  // find exact match
  var exact_match_index = -1;
  for(var i=0; i<AReport.length; i++) {
    // Text
    if (AReport[i].Type == 'Text') {
      if (pointInsideLTWH(AX,AY,AReport[i].X,AReport[i].Y-AReport[i].Height,AReport[i].Width,AReport[i].Height)) {
        exact_match_index = i;
        break;
      }
    }
    // line
    if (AReport[i].Type == 'Line') {
      if (distancePointLineSegment(AX,AY,AReport[i].X,AReport[i].Y,AReport[i].EndX,AReport[i].EndY) <= 1) {
        exact_match_index = i;
        break;
      }
    }
  }

  // if 2 items are selected, and I click on one that is already selected, do nothing, this is to allow moving multiple items without holding shift
  if ( (!AAddToSelection) && (exact_match_index >= 0) && (AReport[exact_match_index].Selected) )
    return false;

  // unselect selected item if shift is pressed and user click on something that is already selected
  if ( (AAddToSelection) && (exact_match_index >= 0) && (AReport[exact_match_index].Selected) ) {
    AReport[exact_match_index].Selected = false;
    return false;
  }

  // unselect all previous items
  if (!AAddToSelection)
    for(var i=0; i<AReport.length; i++)
      AReport[i].Selected = false;

  // test all items
  for(var i=0; i<AReport.length; i++) {

    // Text
    if (AReport[i].Type == 'Text') {
      // exact match?
      if (pointInsideLTWH(AX,AY,AReport[i].X,AReport[i].Y-AReport[i].Height,AReport[i].Width,AReport[i].Height)) {
        AReport[i].Selected = true;
        current_item = AReport[i];
        s++;
        if (!AAddToSelection)
          return true;
      } else {
        // searching nearest item
        d = distancePointLTWH(AX,AY,AReport[i].X,AReport[i].Y-AReport[i].Height,AReport[i].Width,AReport[i].Height);
        if (d < m) {
          m = d;
          mi = i;
        }
        if ( (d < AThreshold) && AAddToSelection) {
          AReport[i].Selected = true;
        }
      }
    }

    // line (always nearest withing threshold because line does not have LTWH bounding box - or that is goal at least)
    if (AReport[i].Type == 'Line') {
      // calculate distance to line
      d = distancePointLineSegment(AX,AY,AReport[i].X,AReport[i].Y,AReport[i].EndX,AReport[i].EndY);
      if (d < m) {
        m = d;
        mi = i;
      }
      // select
      if ( (d < AThreshold) && (AAddToSelection) )
        AReport[i].Selected = true;
    }
  }

  // select nearest item (if it is within threshold distance)
  if (mi >= 0) {
    AReport[mi].Selected = true;
    current_item = AReport[mi];
    return true;
  }
  return s > 0;
}

function itemDraw(ADx,ADy,AItem) {
  // draw items respecting their type
  // Text
  if (AItem.Type == 'Text')
    textDrawItem(ADx,ADy,AItem);
  // Line
  if (AItem.Type == 'Line')
    lineDrawItem(ADx,ADy,AItem);
}


