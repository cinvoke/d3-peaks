(function(){
  d3.select(window).on("resize", resize);
  var width = 920,
      height = 200,
      margin = {top: 10, left: 30, bottom: 20, right: 10};
      
  var svg = d3.select(".vis.problem").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);
  var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
    
  var signal = heartbeats.map(function(d, i) {
    var type = "rest";
    if (i >= 0 && i <= 23) {
      type = "activity";
    } else if (i >= 370 && i <= 450) {
      type = "activity";
    } else if (i >= 776 && i <= 836) {
      type = "activity";
    }
    return {x: i,  hr: d, type: type};
  });
  
  var x = d3.scale.linear()
    .domain([0, signal.length])
    .range([0, width]);
    
  var y = d3.scale.linear()
    .domain([d3.min(signal, function(d) { return d.hr; }), d3.max(signal, function(d) { return d.hr; })])
    .range([height, 0]);
  
  var line = d3.svg.line()
    .x(function(d) { return x(d.x); })
    .y(function(d) { return y(d.hr); });
    
  var beats = [];
  var current = [];
  var previous = "activity";
  var maximas = [],
      maxPoint = undefined,
      maxHeight = Number.NEGATIVE_INFINITY;
  signal.forEach(function(d) {
    current.push(d);
    if (previous !== d.type) {
      // maximas
      if (previous === "activity") {
        maximas.push(maxPoint);
      }
      maxHeight = Number.NEGATIVE_INFINITY;
      
      beats.push(current);
      current = [];
      previous = d.type;
    }
    current.push(d);
    
    if (d.hr > maxHeight) {
      maxHeight = d.hr;
      maxPoint = d;
    }
  });
  beats.push(current);
  
  g.append("g").attr("class", "signal")
    .selectAll(".signal")
    .data(beats)
    .enter().append("g")
    .append("path")
      .attr("d", line)
      .attr("class", function(d, i) { return beats[i][0].type; });
      
  g.selectAll(".peaks")
    .data(maximas)
    .enter().append("circle")
      .attr("cx", function(d) { return x(d.x); })
      .attr("cy", function(d) { return y(d.hr); })
      .attr("r", 4)
      .attr("class", "peak");
  
  var yAxis = d3.svg.axis()
    .scale(y)
    .tickValues([54, 60, 74])
    .orient("left");
    
  g.append("g")
    .attr("class", "axis")
    .attr("call", "axis")
    .call(yAxis);
    
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -30)
    .attr("y", -10)
    .style("text-anchor", "end")
    .text("heart rate (bpm)");
    
  
  function resize() {
    if (window.innerWidth >= 960) {
      width = 920;
    } else if (window.innerWidth >= 768) {
      width = 768 - margin.left - margin.right;
    } else if (window.innerWidth >= 480) {
      width = 480 - margin.left - margin.right;
    } else {
      width = 310 - margin.left - margin.right;
    }
    x.range([0, width]);
    
    var svg = d3.select(".vis.problem").select("svg")
      .attr("width", width + margin.left + margin.right);
    
    svg.select(".signal")
      .selectAll("path")
      .attr("d", line);
      
    svg.selectAll("circle")
      .attr("cx", function(d) { return x(d.x); });
  }
})();