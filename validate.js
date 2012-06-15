// item validations (mostly for debug purposes during development)

function validate(AReport,ARepair) {
  // check for any inconsistencies in report, log them, try to repair them, etc...
  var i = 0;
  var errors = 0;
  var resolved = 0;
  undoPush(AReport);

  this.missing = function(AProperties) {
    // test for missing properties in item
    for (p in AProperties)
      if (!AReport[i].hasOwnProperty(AProperties[p])) {
        // log
        console.log('#'+i+': missing property "'+p+'"\n      ('+JSON.stringify(AReport[i],null,2)+')');
        errors++;
        // repair
        if (ARepair) {
          var value = 'VALUE';
          switch(AProperties[p]) {
            case 'X': value = 0; break;
            case 'Y': value = 0; break;
            case 'EndX': value = 100; break;
            case 'EndY': value = 100; break;
            case 'Caption': value = 'Caption'; break;
            case 'Width': value = 100; break;
            case 'Height': value = 15; break;
            case 'Thicknes': value = 1; break;
            case 'Font': value = 'Sans'; break;
            case 'Color': value = 'black'; break;
          }
          if (prompt('Add missing property "'+AReport[i].Type+'.'+AProperties[p]+'"',value))
            AReport[i][AProperties[p]] = value;
            resolved++;
        }
      }
  }

  this.forbiden = function(AProperties) {
    // log any forbiden items of item (usually leak from different type, e.g. Caption in Line item)
    for (p in AReport[i])
      if (AProperties.indexOf(p) >= 0) {
        console.log('#'+i+': forbiden property "'+p+'"\n      ('+JSON.stringify(AReport[i],null,2)+')');
        errors++;
        // repair
        if (ARepair&&confirm('Remove forbiden property "'+AReport[i].Type+'.'+p+'"')) {
          delete AReport[i][p];
          resolved++;
        }
      }
  }

  this.range = function(AX,AY,AWhat) {
    // test if point is out of canvas
    //console.log(AX+','+AY+' : '+canvas.clientWidth+','+canvas.clientHeight);
    if ( (AX < 0)||(AY < 0)||(AX >= canvas.clientWidth)||(AY >= canvas.clientHeight) ) {
      console.log('#'+i+': '+AReport[i].Type+' '+AWhat+' point ('+AX+','+AY+') out of range (0,0,'+canvas.clientWidth+','+canvas.clientHeight+')\n      ('+JSON.stringify(AReport[i],null,2)+')');
      errors++;
    }

  }

  this.zero = function(AValue,AWhat,AChange,ADelete) {
    // test if value is zero
    if (AValue <= 0.001) {
      console.log('#'+i+': '+AReport[i].Type+'.'+AWhat+' is zero\n      ('+JSON.stringify(AReport[i],null,2)+')');
      errors++;
      // hint what are we changing
      var s = '';
      if (AReport[i].Type == 'Text')
        s = ' (Caption='+AReport[i].Caption+')';
      // change incorrect value to new value (e.g. Thicknes from 0 to 1)
      if (AChange) {
        AValue = prompt('Change '+AReport[i].Type+'.'+AWhat+' value '+AValue+'?'+s,AValue);
        if (AValue) {
          AReport[i][AWhat] = AValue;
          resolved++;
        }
      }
      // delete entire element (e.g. line with zero length)
      if (ADelete&&confirm('Delete item #'+i+' of type '+AReport[i].Type+' because '+AWhat+'='+AValue+'?\n'+JSON.stringify(AReport[i],null,2))) {
        AReport.splice(i,1);
        resolved++;
        return true;
      }
    }
    return false;
  }

  // check items for old attributes, out of range or zero attributes, missing attributes, attributes from wrong type, etc... It is mostly for debug purposes
  for(i=AReport.length-1; i>=0; i--) {
    // all attributes
    var a = AReport[i];

    // Text
    if (a.Type == 'Text') {
      this.missing(['Type','Selected','X','Y','Caption','Width','Height','Font']);
      this.forbiden(['EndX','EndY','Thicknes','Color']);
      this.range(a.X,a.Y,'origin');
      this.range(a.X+a.Width,a.Y,'right end');
      this.range(a.X+a.Width,a.Y+a.Height,'right bottom end');
      this.range(a.X,a.Y+a.Height,'bottom');
      this.zero(a.Width,'Width');
      this.zero(a.Height,'Height',true);
    }

    // Line
    if (a.Type == 'Line') {
      this.missing(['Type','Selected','X','Y','EndX','EndY','Thicknes','Color']);
      this.forbiden(['Caption','Width','Height','Font']);
      this.range(a.X,a.Y,'origin');
      this.range(a.EndX,a.EndY,'end');
      this.zero(a.Thicknes,'Thicknes',true);
      if (this.zero(Math.abs(a.X-a.EndX)+Math.abs(a.Y-a.EndY),'Length',false,true))
        continue;
      // test for almost horizontal/vertical line
      if (lineOrtogonalize(a,1,true)) {
        console.log('#'+i+': '+AReport[i].Type+' is almost ortogonal\n      ('+JSON.stringify(AReport[i],null,2)+')');
        errors++;
        if (ARepair&&confirm('#'+i+': '+AReport[i].Type+' is almost ortogonal\n      ('+JSON.stringify(AReport[i],null,2)+')\n\nDo you want to straighten it?'))
          lineOrtogonalize(a,1);
      }
    }
  }

  if (errors > 0)
    alert(errors+' errors found, '+(errors-resolved)+' unresolved.\nSee console log for details!');
  else
    alert('Report is valid!');

  return errors;
}

