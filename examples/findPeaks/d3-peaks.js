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
    
    return ricker;
  };

  function convolve() {
    var kernel = ricker();
    var reach = kernel.std * 5; 
    
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
        
        var box = boundingBox(n, reach, 0, size - 1);
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
    
    /**
     * Mid-range of the kernel we want to sample from.
     */
    convolve.reach = function(_) {
      return arguments.length ? (reach = _, convolve) : reach;
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

  function findPeaks() {
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

  var version = "0.0.1";

  exports.version = version;
  exports.ricker = ricker;
  exports.convolve = convolve;
  exports.findPeaks = findPeaks;

}));