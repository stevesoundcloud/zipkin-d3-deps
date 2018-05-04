const assert = require('chai').assert
const test = require('mocha').test

test("fail", () => {
  assert.equal(2, 1)
})

test("pass", () => {
  assert.equal(2, 2)
})
