(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.d3_peaks = global.d3_peaks || {})));
}(this, function (exports) { 'use strict';

  /**
   * See https://en.wikipedia.org/wiki/Mexican_hat_wavelet
   */
  function ricker() {
    var σ = 1;
    
    var ricker = function(t) {
      var t2 = t*t,
          variance = σ*σ;
      
      var C = 2.0 / ( Math.sqrt(3 * σ) * (Math.pow(Math.PI, 0.25)) );
      var norm = (1.0 - (t2)/(variance));
      var gauss = Math.exp( -(t2) / (2*variance) );
      
      return C*norm*gauss;
    }
    
    ricker.std = function(_) {
      return arguments.length ? (σ = _, ricker) : σ;
    }
    
    /**
     * Range of points to sample from the wavelet. [-reach, reach]
     */
    ricker.reach = function() {
      return 5 * σ;
    }
    
    return ricker;
  };

  function convolve() {
    var kernel = ricker();
    
    /**
     * y[n] = Sum_k{x[k] * h[n-k]}
     * y: output
     * x: input
     * h: smoother
     */
    var convolve = function(signal) {
      var size = signal.length,
          n = -1,
          convolution = new Array(size);
          
      while (++n < size) {
        var y = 0;
        
        var box = boundingBox(n, kernel.reach(), 0, size - 1);
        box.forEach(function(δ) {
          var k = n + δ;
          y += signal[k] * kernel(δ);
        });
        convolution[n] = y;
      }
      
      return convolution;
    };
    
    convolve.kernel = function(_) {
      return arguments.length ? (kernel = _, convolve) : kernel;
    }
    
    function range(reach) {
      reach = +reach;
      var i = -1,
          n = 2*reach + 1,
          range = new Array(n);
      while(++i < n) {
        range[i] = (-reach) + i;
      }
      return range;
    }
    
    function boundingBox(n, reach, lo, hi) {
      for (var i = 1; i <= reach; i++) {
        var left  = n - i,
            right = n + i;
        if (left >= lo && right <= hi) continue;
        return range(i - 1);
      }
      return range(reach);
    }
    
    return convolve;
  };

  function Point(x, y, scale) {
    this.x = x;
    this.y = y;
    this.scale = scale;
  }

  function RidgeLine() {
    this.points = [];
    this.gap = 0;
  }

  /**
   * If the point is valid append it to the ridgeline, and reset the gap.
   * Otherwise, increment the gap and do nothing.
   * 
   * @param {point} Point object.
   */
  RidgeLine.prototype.add = function(point) {
    if (point === null || point === undefined) {
      this.gap += 1;
      return;
    } else {
      this.points.push(point);
      this.gap = 0;
    }
  }

  /**
   * @return {Point} Last point added into the ridgeline.
   */
  RidgeLine.prototype.top = function() {
    return this.points[this.points.length - 1];
  }

  /**
   * @return {number} Length of points on the ridgeline.
   */
  RidgeLine.prototype.length = function() {
    return this.points.length;
  }

  /**
   * @return {boolean} True if the gap in the line is above a threshold. False otherwise.
   */
  RidgeLine.prototype.isDisconnected = function (threshold) {
    return this.gap >= threshold;
  }

  /**
   * @param {arr} row in the CWT matrix.
   * @param {window} Sliding window range.
   * @return Array of indices with relative maximas.
   */
  function maximas(arr, window) {
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

  function nearestNeighbor(line, maximas, window) {
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

  function findPeaks() {
    var kernel = ricker,
        gap = 1,
        lineLength = 2,
        snr = 1.0,
        widths = [1];
    
    var findPeaks = function(signal) {
      var M = CWT(signal);
      var n = widths.length,
          m = signal.length;
      
      var ridgeLines = initializeRidgeLines(M, n);
      console.log(ridgeLines);
      ridgeLines = connectRidgeLines(M, n, ridgeLines);
      console.log(ridgeLines);
    };
    
    /**
     * Smoothing function.
     */
    findPeaks.kernel = function(_) {
      return arguments.length ? (kernel = _, findPeaks) : kernel;
    }
    
    /**
     * Expected widths of the peaks.
     */
    findPeaks.widths = function(_) {
      return arguments.length ? (_.sort(), widths = _, findPeaks) : widths;
    }
    
    /**
     * Number of gaps that we allow in the ridge lines.
     */
    findPeaks.gap = function(_) {
      return arguments.length ? (gap = _, findPeaks) : gap;
    }
    
    /**
     * Minimum ridge line length to consider.
     */
    findPeaks.lineLength = function(_) {
      return arguments.length ? (lineLength = _, findPeaks) : lineLength;
    }
    
    /**
     * Minimum signal to noise ratio for the peaks.
     */
    findPeaks.snr = function(_) {
      return arguments.length ? (snr = _, findPeaks) : snr;
    }
    
    /**
     * @return The convolution matrix.
     */
    var CWT = function(signal) {
      var M = new Array(widths.length);
      widths.forEach(function(width, i) {
        var smoother = kernel()
          .std(width);
        var transform = convolve()
          .kernel(smoother);
        
        var convolution = transform(signal);
        M[i] = convolution;
      });
      return M;
    }
    
    var initializeRidgeLines = function(M, n) {
      var locals = maximas(M[n - 1], widths[n - 1]);
      var ridgeLines = [];
      locals.forEach(function(d) {
        var point = new Point(d.x, d.y, n - 1);
        var line = new RidgeLine();
        line.add(point);
        ridgeLines.push(line);
      });
      return ridgeLines;
    }
    
    var connectRidgeLines = function(M, n, ridgeLines) {
      for (var row = n - 2; row >= 0; row--) {
        var locals = maximas(M[row], widths[row]);
        var addedLocals = [];
        
        // Find nearest neighbor at next scale and add to the line
        ridgeLines.forEach(function(line, i) {
          var x = nearestNeighbor(line, locals, widths[row]);
          line.add(x === null ? null : new Point(x, M[row][x], row));
          
          if (x !== null) {
            addedLocals.push(x);
          }
        });
        
        // Remove lines that has exceeded the gap threshold
        ridgeLines = ridgeLines.filter(function(line) {
          return !line.isDisconnected(gap);
        });
        
        // Add all the unitialized ridge lines
        locals.forEach(function(d) {
          if (addedLocals.indexOf(d.x) !== -1) return;
          
          var point = new Point(d.x, d.y, row);
          var ridgeLine = new RidgeLine();
          ridgeLine.add(point);
          ridgeLines.push(ridgeLine);
        });
      }
      return ridgeLines;
    }
    
    return findPeaks;
  };

  var version = "0.0.1";

  exports.version = version;
  exports.ricker = ricker;
  exports.convolve = convolve;
  exports.findPeaks = findPeaks;

}));