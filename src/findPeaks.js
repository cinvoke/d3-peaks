import ricker from "./ricker";
import convolve from "./convolve";

export default function() {
  var kernel = ricker,
      reach = function(d) { return 5 * d; },
      widths = [1];
  
  /**
   * Compute the convolution matrix.
   */
  var CWT = function(signal) {
    var M = new Array(widths.length);
    widths.forEach(function(width, i) {
      var smoother = kernel()
        .std(width);
      var transform = convolve()
        .kernel(smoother)
        .reach(reach(width));
      
      var convolution = transform(signal);
      M[i] = convolution;
    })
    return M;
  }
  
  /**
   * Search for local maximas in an array using a sliding window.
   * @return Indices of local maximas.
   */
  var maximas = function(arr, window) {
    var maximas = new Set();
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
      
      maximas.add(maxIndex);
    });
    return maximas;
  }
  
  var findPeaks = function(signal) {
    var M = CWT(signal);
    var n = widths.length,
        m = signal.length;
    
    var locals = maximas(M[n - 1], widths[n - 1]);
    console.log(M[n - 1], locals);
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
  
  return findPeaks;
};