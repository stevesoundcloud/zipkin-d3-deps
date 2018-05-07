const d3 = require("d3")

const zipkinBaseUrl = process.env.ZIPKIN_BASE_URL

console.log("hello world 7", zipkinBaseUrl)

function zipkinDepsToD3Graph(zipkinDependencyResponse) {
  const nodeSet = {}
  zipkinDependencyResponse.forEach(parentChildRow => {
    nodeSet[parentChildRow.parent] = true
    nodeSet[parentChildRow.child] = true
  })
  const nodeNames = Object.keys(nodeSet)
  nodeNames.sort()
  const nodes = nodeNames.map(nodeName => {
    return {id: nodeName}
  })

  const links = []
  zipkinDependencyResponse.map(parentChildRow => {
    links.push({source: parentChildRow.parent, target: parentChildRow.child, callCount: parentChildRow.callCount})
  })

  return {
    nodes: nodes,
    links: links
  }
}

function zipkinDepsToD3Matrix(zipkinDependencyResponse) {
  const nodeSet = {}
  zipkinDependencyResponse.forEach(parentChildRow => {
    nodeSet[parentChildRow.parent] = true
    nodeSet[parentChildRow.child] = true
  })
  const nodeNames = Object.keys(nodeSet)
  nodeNames.sort()

  const nameToIndex = {}
  const indexToName = {}
  for (let i=0; i<nodeNames.length; i++) {
    nameToIndex[nodeNames[i]] = i
    indexToName[i] = nodeNames[i]
  }

  const rowOfZeroes = []
  for (let i=0; i<nodeNames.length; i++) {
    rowOfZeroes.push(0)
  }
  const xChildByYParentMatrix = []
  for (let i=0; i<nodeNames.length; i++) {
    xChildByYParentMatrix.push([].concat(rowOfZeroes))
  }
  zipkinDependencyResponse.map(parentChildRow => {
    xChildByYParentMatrix[nameToIndex[parentChildRow.child]][nameToIndex[parentChildRow.parent]] = Math.pow(parentChildRow.callCount, 0.4)
  })
  return {
    nameToIndex: nameToIndex,
    indexToName: indexToName,
    matrix: xChildByYParentMatrix
  }
}

function buildVisualization(d3MatrixData) {
  var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    outerRadius = Math.min(width, height) * 0.5 - 200,
    innerRadius = outerRadius - 30;
  var formatValue = d3.formatPrefix(",.0", 1e3);
  var chord = d3.chord()
    .padAngle(0.05)
    .sortSubgroups(d3.descending);
  var arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);
  var ribbon = d3.ribbon()
    .radius(innerRadius);
  var color = d3.scaleOrdinal()
    .domain(d3.range(4))
    .range(["#000000", "#FFDD89", "#957244", "#F26223"]);
  var g = svg.append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
    .datum(chord(d3MatrixData.matrix));
  var group = g.append("g")
    .attr("class", "groups")
    .selectAll("g")
    .data(function(chords) {
      // console.log(chords)
      return chords.groups; })
    .enter().append("g");
  group.append("path")
    .style("fill", function(d) { return color(d.index); })
    .style("stroke", function(d) { return d3.rgb(color(d.index)).darker(); })
    .attr("d", arc);
  // var groupTick = group.selectAll(".group-tick")
  //   .data(function(d) {
  //     // console.log(d)
  //     // return groupTicks(d, 1e3);
  //     return d
  //   })
  //   .enter().append("g")
  //   .attr("class", "group-tick")
  //   .attr("transform", function(d) { return "rotate(" + (d.angle * 180 / Math.PI - 90) + ") translate(" + outerRadius + ",0)"; });
  // groupTick.append("line")
  //   .attr("x2", 6);
  // groupTick
  //   // .filter(function(d) { return d.value % 5e3 === 0; })
  //   .data(function(d) {
  //     console.log(d)
  //     return d
  //   })
  //   .append("text")
  //   .attr("x", 8)
  //   .attr("dy", ".35em")
  //   .attr("transform", function(d) { return d.angle > Math.PI ? "rotate(180) translate(-16)" : null; })
  //   .style("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
  //   .text(function(d) {
  //     console.log(d)
  //     // return formatValue(d.value);
  //     return d3MatrixData.indexToName[d.value];
  //   });
  g.append("g")
    .attr("class", "ribbons")
    .selectAll("path")
    .data(function(chords) { return chords; })
    .enter().append("path")
    .attr("d", ribbon)
    .style("fill", function(d) { return color(d.target.index); })
    .style("stroke", function(d) { return d3.rgb(color(d.target.index)).darker(); });


  //Append the label names on the outside
  group.append("text")
    .each(function(d) {console.log(d); d.angle = (d.startAngle + d.endAngle) / 2; })
    .attr("dy", ".35em")
    .attr("class", "titles")
    .attr("text-anchor", function(d) {console.log(d); return d.angle > Math.PI ? "end" : null; })
    .attr("transform", function(d) {
      console.log(d, d.angle, (d.angle * 180 / Math.PI - 90))
      return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
        + "translate(" + (outerRadius + 10) + ")"
        + (d.angle > Math.PI ? "rotate(180)" : "");
    })
    .text(function(d,i) { return d3MatrixData.indexToName[i]; });
// Returns an array of tick angles and values for a given group and step.
//   function groupTicks(d, step) {
//     // console.log(d, step)
//     var k = (d.endAngle - d.startAngle) / d.value;
//     return d3.range(0, d.value, step).map(function(value) {
//       return {index: d.index, value: value, angle: value * k + d.startAngle};
//     });
//   }
}

const nowMillis = Date.now()

fetch(`${zipkinBaseUrl}/api/v1/dependencies?endTs=${nowMillis}&lookback=0`, {
  method: 'get'
}).then(function(response) {
  response.json().then((obj) => {
    console.log(zipkinDepsToD3Graph(obj))
    console.log(zipkinDepsToD3Matrix(obj))
    buildVisualization(zipkinDepsToD3Matrix(obj))
  })
}).catch(function(err) {
  console.log(err)
})