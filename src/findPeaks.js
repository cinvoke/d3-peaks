import ricker from "./ricker";
import convolve from "./convolve";
import Point from "./Point";
import RidgeLine from "./RidgeLine";
import {maximas, nearestNeighbor} from "./search";

export default function() {
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
    ridgeLines = connectRidgeLines(M, n, ridgeLines);
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