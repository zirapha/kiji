// undo functionality on report data

// FIXME: this file has too many FIXME per LOC
// FIXME: perhaps limit undo to 30 steps or something to save some memory
// FIXME: maybe later there will be som other code that will justify stand alone file for undo, if not, it get cleaned up later

undo = [];

function undoPush(AReport) {
  // FIXME: wtf, why not KISS and just use the code itself: undo.push(report) ???
  if (!AReport)
    throw "undoPush: undefined report";
  // have to use this, otherwise it just store reference to report
  var b = JSON.stringify(AReport);
  var c = JSON.parse(b);
  undo.push(c);
  // FIXME: why is this code here and not after itemSelect?
  document.getElementById('items').innerHTML = 'Items: '+itemSelectedCount(AReport)+'/'+AReport.length;
}

function undoPop(AReport) {
  // restore previous report version from undo stack
  if (!undoAvailable()) {
    console.log('Undo not avalilable!');
    return AReport;
  }
  document.getElementById('items').innerHTML = 'Items: '+itemSelectedCount(AReport)+'/'+AReport.length;
  var r = undo.pop();
  current_item = itemFirstSelected(r);
  mouse_handler.current = current_item;  // FIXME: the hell?
  mouse_handler.report = r; // FIXME: this is just wrong
  attributesShow(current_item);
  return r;
}

function undoAvailable() {
  // return true if we can undo something
  return undo.length > 0;
}


