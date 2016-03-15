import ricker from "./ricker";
import convolve from "./convolve";
import Point from "./Point";
import RidgeLine from "./RidgeLine";
import {maximas, nearestNeighbor} from "./search";

export default function() {
  var kernel = ricker,
      gapThreshold = 1,
      minLineLength = 1,
      minSNR = 1.0,
      widths = [1];
  
  var findPeaks = function(signal) {
    var M = CWT(signal);
    
    var ridgeLines = initializeRidgeLines(M);
    ridgeLines = connectRidgeLines(M, ridgeLines);
    ridgeLines = filterRidgeLines(M, ridgeLines);
    
    return peaks(M, ridgeLines);
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
    _.sort(function(a, b) { return a - b; });
    return arguments.length ? (widths = _, findPeaks) : widths;
  }
  
  /**
   * Number of gaps that we allow in the ridge lines.
   */
  findPeaks.gapThreshold = function(_) {
    return arguments.length ? (gapThreshold = _, findPeaks) : gapThreshold;
  }
  
  /**
   * Minimum ridge line length.
   */
  findPeaks.minLineLength = function(_) {
    return arguments.length ? (minLineLength = _, findPeaks) : minLineLength;
  }
  
  /**
   * Minimum signal to noise ratio for the peaks.
   */
  findPeaks.minSNR = function(_) {
    return arguments.length ? (minSNR = _, findPeaks) : minSNR;
  }
  
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
  
  
  var initializeRidgeLines = function(M) {
    var n = widths.length;
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
  
  var connectRidgeLines = function(M, ridgeLines) {
    var n = widths.length;
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
        return !line.isDisconnected(gapThreshold);
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
  
  var filterRidgeLines = function(M, ridgeLines) {
    ridgeLines = ridgeLines.filter(function(line) {
      var snr = line.SNR(M[0], widths);
      return (snr >= minSNR) && (line.length() >= minLineLength);
    });
    return ridgeLines
  }
  
  /**
   * Pick the point on the ridgeline with highest SNR.
   */
  var peaks = function(M, ridgeLines) {
    var peaks = ridgeLines.map(function(line) {
      var points = line.points;
      var maxValue = Number.NEGATIVE_INFINITY,
          maxIndex = -1;
      points.forEach(function(point) {
        if (point.snr > maxValue) {
          maxIndex = point.x;
        }
      });
      return maxIndex;
    });
    return peaks;
  }
  
  return findPeaks;
};