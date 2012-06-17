// various helper math functions

function distancePointPoint(x1, y1, x2, y2) {
  // distance of 2 points
  return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
}

function distancePointLineSegment(x, y, x1, y1, x2, y2) {
  // distance of point (x,y) and line segment (x1,y1)-(x2,y2)
  // code from: http://stackoverflow.com/a/6853926/525773
  var A = x - x1;
  var B = y - y1;
  var C = x2 - x1;
  var D = y2 - y1;
  var dot = A * C + B * D;
  var len_sq = C * C + D * D;
  var param = dot / len_sq;
  var xx, yy;
  if (param < 0 || (x1 == x2 && y1 == y2)) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  var dx = x - xx;
  var dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

function distancePointRectangle(x, y, x1, y1, x2, y2, x3, y3, x4, y4) {
  // distance of point (x,y) and arbitrary rectangle (x1,y1)-(x2,y2)-(x3,y3)-(x4,y4)
  var d = distancePointLineSegment(x,y,x1,y1,x2,y2);
  var m = d;
  var d = distancePointLineSegment(x,y,x2,y2,x3,y3);
  m = d < m ? d : m;
  var d = distancePointLineSegment(x,y,x3,y3,x4,y4);
  m = d < m ? d : m;
  var d = distancePointLineSegment(x,y,x4,y4,x1,y1);
  m = d < m ? d : m;
  return m;
}

function distancePointLTWH(x, y, left, top, width, height) {
  // distance of point (x,y) and Left-Top-Width-Height oriented AABB (axis aligned bounding box)
  return distancePointRectangle(x, y, left, top, left+width, top, left+width, top+height, left, top+height);
}

function pointInsideLTWH(x, y, left, top, width, height) {
  // return true if point (x,y) is inside AABB rectangle defined by (left,top) and (left+width,top+height) points
  return (x >= left) && (x <= left + width) && (y >= top) && (y <= top + height);
}

