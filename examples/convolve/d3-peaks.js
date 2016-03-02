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
    var KERNELS = {
      "ricker": ricker()
    };
    
    var kernel = KERNELS.ricker;
    var reach = kernel.std * 5; 
    
    /**
     * y[n] = Sum_k{x[k] * h[n-k]}
     * y: output
     * x: input
     * h: smoother
     */
    var convolve = function(signal) {
      var deltas = range(reach),
          size = signal.length,
          n = -1,
          convolution = new Array(size);
          
      while (++n < size) {
        var y = 0;
        deltas.forEach(function(δ) {
          var k = n + δ;
          if (k < 0 || k >= size) return;
          
          y += signal[k] * kernel(δ);
        });
        convolution[n] = y;
      }
      
      return convolution;
    };
    
    convolve.kernel = function(_) {
      return arguments.length ? (kernel = KERNELS[_], convolve) : kernel;
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
    
    return convolve;
  };

  var version = "0.0.1";

  exports.version = version;
  exports.ricker = ricker;
  exports.convolve = convolve;

}));