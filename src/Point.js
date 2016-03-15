import {percentile} from "./search";

function Point(x, y, scale) {
  this.x = x;
  this.y = y;
  this.scale = scale;
  this.snr = undefined;
}

Point.prototype.SNR = function(neighbors) {
  var smoothingFactor = 0.00001;
  var signal = this.y;
  var noise = percentile(neighbors, 0.95);
  
  signal += smoothingFactor;
  noise += smoothingFactor;
  this.snr = signal/noise;
  return this.snr;
}

export default Point;