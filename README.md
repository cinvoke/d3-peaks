# d3-peaks

Find peaks in an array based on "Improved peak detection" \[1\]

\[1\] Du, Pan, Warren A. Kibbe, and Simon M. Lin. "Improved peak detection in mass spectrum by incorporating continuous wavelet transform-based pattern matching." Bioinformatics 22.17 (2006): 2059-2065.

For examples, please see:
*  [Convolution](http://bl.ocks.org/efekarakus/9e5d933195dee8b4a882)
*  [Ricker Wavelet](http://bl.ocks.org/efekarakus/3c30061ef9e56c2328c6)

## Installing

If you use NPM, `npm install d3-peaks`. Otherwise, download the [latest release](https://github.com/d3/d3-peaks/releases/latest).

## API Reference

### Convolution

<a href="#convolve" name="convolve">#</a> d3_peaks.<b>convolve</b>([<i>signal</i>])

If specified, convolve the <i>signal</i> array with the smoother. Otherwise, returns a function to convolve a signal with the smoother.

<a href="#convolve-reach" name="convolve-reach">#</a> <b>reach</b>(<i>r</i>)

If specified, changes the number of points to sample from the smoother. For example, <i>r</i> = 2 means we sample x-coordinates [-2, -1, 0, 1, 2] from the smoother. Otherwise, returns the current value of reach.

<a href="#convolve-kernel" name="convolve-kernel">#</a> <b>kernel</b>(<i>kernel</i>)

If specified, changes the kernel function or "smoother". Otherwise, returns the current kernel.

```js
var convolve = d3_peaks.convolve()
                        .reach(3);
var signal = convolve([1,2,3,2.5,0,1,4,5,3,-1,-2]);
```

### Kernels

<a href="#ricker" name="ricker">#</a> d3_peaks.<b>ricker</b>(<i>x</i>)

If specified , it returns φ(<i>x</i>). Otherwise, returns a function to compute the ricker wavelet with default standard deviation 1.0.

<a href="#ricker-std" name="ricker-std">#</a> <b>std</b>(<i>value</i>)

If specified, it sets the standard deviation of the curve to <i>value</i>. Otherwise, returns the "width" or standard deviation of the wavelet.

```js
var y = d3_peaks.ricker()
  .std(2);
var output = y(3.5);
```
