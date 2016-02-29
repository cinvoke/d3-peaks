# d3-peaks

Find peaks in an array based on "Improved peak detection" \[1\]

\[1\] Du, Pan, Warren A. Kibbe, and Simon M. Lin. "Improved peak detection in mass spectrum by incorporating continuous wavelet transform-based pattern matching." Bioinformatics 22.17 (2006): 2059-2065.

## Installing

If you use NPM, `npm install d3-peaks`. Otherwise, download the [latest release](https://github.com/d3/d3-peaks/releases/latest).

## API Reference

Example use:
```js
var r = d3.ricker()
  .std(2);
  
console.log(r(0), r(1), r(2));
```

<a href="#ricker" name="ricker">#</a> <b>d3.ricker</b>()

Returns a function to compute the ricker wavelet with default standard deviation 1.0.

<a href="#ricker-std" name="ricker-std">#</a> <b>std</b>(<i>value</i>)

The "width" or standard deviation of the wavelet.