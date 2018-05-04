const d3 = require("d3")

const zipkinBaseUrl = process.env.ZIPKIN_BASE_URL

console.log("hello world 6", zipkinBaseUrl)

fetch(`${zipkinBaseUrl}/api/v1/dependencies?endTs=1525428438433&lookback=86399999`, {
  method: 'get'
}).then(function(response) {
  console.log(response)
}).catch(function(err) {
  console.log(err)
});