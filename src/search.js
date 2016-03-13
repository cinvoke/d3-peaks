/**
 * @param {arr} row in the CWT matrix.
 * @param {window} Sliding window range.
 * @return Array of indices with relative maximas.
 */
export function maximas(arr, window) {
  var cache = {};
  var maximas = [];
  var length = arr.length;
  arr.forEach(function(value, index) {
    var maxValue = Number.NEGATIVE_INFINITY,
        maxIndex = -1;
    
    // TODO Use a max-heap
    for (var w = 0; w <= window; w++) {
      var right = index + w;
      var left = index - w;
      
      if (left >= 0) {
        if (arr[left] > maxValue) {
          maxValue = arr[left];
          maxIndex = left;
        }
      }
      if (right < length) { 
        if (arr[right] > maxValue) {
          maxValue = arr[right];
          maxIndex = right;
        }
      }
    }
    
    if (!(maxIndex in cache)) {
      maximas.push({x: maxIndex, y: maxValue});
      cache[maxIndex] = maxValue;
    }
  });
  return maximas;
};

export function nearestNeighbor(line, maximas, window) {
  var cache = {};
  maximas.forEach(function(d) {
    cache[d.x] = d.y;
  });
  
  var point = line.top();
  for (var i = 0; i <= window; i++) {
    var left = point.x + i;
    var right = point.x - i;
    
    if ( (left in cache) && (right in cache) ) {
      if (cache[left] > cache[right]) {
        return left;
      }
      return right;
    }
    else if (left in cache) {
      return left;
    }
    else if (right in cache) {
      return right;
    }
  }
  return null;
}