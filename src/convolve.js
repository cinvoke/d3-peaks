import ricker from "./ricker";

export default function() {
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