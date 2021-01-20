const {GPU} = require("gpu.js");
const gpu = new GPU();

const kernel = gpu.createKernel(function() {
  const array2 = [0.08, 2];
  return array2;
}).setOutput([10]);
console.log(kernel());