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

  var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

  var simulation = d3.forceSimulation()
    .force("charge", d3.forceManyBody().strength(-300))
    .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(30))
    .force("x", d3.forceX(width / 2))
    .force("y", d3.forceY(height / 2))
    .on("tick", ticked);

  var link = svg.selectAll(".link"),
    node = svg.selectAll(".node");

  // d3.json("graph.json", function(error, graph) {
  //   if (error) throw error;

    simulation.nodes(d3GraphData.nodes);
    simulation.force("link").links(d3GraphData.links);

    link = link
      .data(d3GraphData.links)
      .enter().append("line")
      .attr("class", "link");

    node = node
      .data(d3GraphData.nodes)
      .enter().append("circle")
      .attr("class", "node")
      .attr("r", 6)
      .style("fill", function(d) { return d.id; });
  // });

  function ticked() {
    link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
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