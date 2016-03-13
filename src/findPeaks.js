import ricker from "./ricker";
import convolve from "./convolve";
import Point from "./Point";
import RidgeLine from "./RidgeLine";
import {maximas, nearestNeighbor, percentile} from "./search";

export default function() {
  var kernel = ricker,
      gapThreshold = 1,
      minLineLength = 2,
      minSNR = 1.0,
      widths = [1];
  
  var findPeaks = function(signal) {
    var M = CWT(signal);
    var n = widths.length,
        m = signal.length;
    
    var ridgeLines = initializeRidgeLines(M, n);
    ridgeLines = connectRidgeLines(M, n, ridgeLines);
    ridgeLines = filterRidgeLines(M, ridgeLines);
    
    return peaks(ridgeLines);
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
  
  var SNR = function(line, M) {
    var points = line.points;
    var x = -1,
        scale = 0;
    // Signal strength is the maximum CWT coefficient.
    var signal = Number.NEGATIVE_INFINITY;
    points.forEach(function(point) {
      if (point.y > signal) {
        signal = point.y;
        x = point.x;
        scale = point.scale;
      }
    });
    
    width = widths[scale];
    var lowerBound = Math.max(0, x - width);
    var upperBound = Math.min(M[0].length, x + width);
    var noise = percentile(M[0].slice(lowerBound, upperBound), 0.95);
    
    if (noise === 0) return 0;
    return signal/noise;
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
      var snr = SNR(line, M);
      return (snr >= minSNR) && (line.length() >= minLineLength);
    });
    return ridgeLines
  }
  
  /**
   * Pick the median for every ridge line.
   */
  var peaks = function(ridgeLines) {
    var peaks = ridgeLines.map(function(line) {
      var points = line.points;
      points = points.map(function(point) { return point.x });
      points.sort(function(a, b) { return a - b });
      return points[Math.floor(points.length / 2)];
    });
    return peaks;
  }
  
  return findPeaks;
};