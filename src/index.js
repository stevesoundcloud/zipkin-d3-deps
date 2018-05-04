const d3 = require("d3")

console.log(Object.keys(d3))

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

function buildVisualization(d3GraphData) {
  var svg = d3.select("svg");

  var width = svg.attr("width");
  var height = svg.attr("height");

  svg = svg.call(d3.zoom().on("zoom", zoomed)).append("g");

  svg.append("defs").append("marker")
    .attr("id", "arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 20)
    .attr("refY", 0)
    .attr("markerWidth", 8)
    .attr("markerHeight", 8)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5");

  var color = d3.scaleOrdinal(d3.schemeCategory10);

  var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody().strength(-1000).distanceMax(400).distanceMin(10))
    .force("center", d3.forceCenter(width / 2, height / 2));

  var link = svg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(d3GraphData.links)
    .enter().append("line")
    .attr("stroke", function(d) { return color(d.type); })
    .attr("marker-end", "url(#arrow)");


  var node = svg.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(d3GraphData.nodes)
    .enter().append("circle")
    .attr("r", 10)
    .attr("fill", function(d) { if (d.root == "true") return color(d.root); return color(d.type); })
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

  var text = svg.append("g").attr("class", "labels").selectAll("g")
    .data(d3GraphData.nodes)
    .enter().append("g");

  text.append("text")
    .attr("x", 14)
    .attr("y", ".31em")
    .style("font-family", "sans-serif")
    .style("font-size", "0.7em")
    .text(function(d) { return d.id; });

  node.on("click",function(d){
    console.log("clicked", d.id);
  });


  node.append("title")
    .text(function(d) { return d.id; });

  simulation
    .nodes(d3GraphData.nodes)
    .on("tick", ticked);

  simulation.force("link")
    .links(d3GraphData.links);


  function ticked() {
    link
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

    node
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });

    text
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })


  }


  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  function zoomed() {
    svg.attr("transform", "translate(" + d3.event.transform.x + "," + d3.event.transform.y + ")" + " scale(" + d3.event.transform.k + ")");
  }
}

fetch(`${zipkinBaseUrl}/api/v1/dependencies?endTs=1525428438433&lookback=86399999`, {
  method: 'get'
}).then(function(response) {
  response.json().then((obj) => {
    console.log(zipkinDepsToD3Graph(obj))
    buildVisualization(zipkinDepsToD3Graph(obj))
  })
}).catch(function(err) {
  console.log(err)
})