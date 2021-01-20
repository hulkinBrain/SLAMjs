class List {
  constructor() {
    this.array = [];
  }

  /**
   * Pushes an element into the List only if it doesn't already exist
   * @param {ArrayItem} el Element to be pushed
   */
  pushIfNotExist(newEl) {
    let found = false;
    for(let i=0; i < this.array.length; i++) {
      if(newEl.constructor === Object) {
        if(JSON.stringify(this.array[i]) === JSON.stringify(newEl)) {
          found = true;
          break;
        }
      }
      else{
        if(String(this.array[i]) === String(newEl)) {
          found = true;
          break;
        }
      }

    }
    found === false ? this.array.push(newEl) : null;
  }

  pushIfNotExistMultiple(newElArray) {
    newElArray.forEach(element => {
      this.pushIfNotExist(element);
    });
  }

  /**
   * Deletes first occurance of the element
   * @param {ArrayItem} el Element to be deleted
   */
  delete(el) {
    for(let i=0; i < this.array.length; i++) {
      if(String(this.array[i]) === String(el)) {
        this.array.splice(i, 1);
        break;
      }
    }
  }

  /**
   * Deletes all occurances of the element
   * @param {ArrayItem} el Element to be deleted
   */
  deleteAll(el) {
    for(let i=0; i < this.array.length; i++) {
      if(String(this.array[i]) === String(el)) {
        this.array.splice(i, 1);
        i--;
      }
    }
  }

  /**
   * Finds first occurance of the element
   * @param {ArrayItem} el Element to be deleted
   */
  find(el) {
    for(let i=0; i < this.array.length; i++) {
      if(String(this.array[i]) === String(el)) {
        return i;
      }
    }
    return false;
  }

  /**
   * Finds all occurances of the element
   * @param {ArrayItem} el Element to be deleted
   */
  findAll(el) {
    let indices = [];
    for(let i=0; i < this.array.length; i++) {
      if(String(this.array[i]) === String(el)) {
        indices.push(i);
      }
    }
    return indices;
  }
}

/**
 * Converts degree to radians
 * @param {Number} deg Element to be deleted
 */
const ToRad = (deg) => deg * Math.PI / 180;

/**
 * Converts radians to degree
 * @param {Number} deg Element to be deleted
 */
const ToDeg = (rad) => rad * 180 / Math.PI;

/**
 * Gets every nth element in an array
 * @param {Float32Array} arr Array from which elements are to be filtered
 * @param {Number} nth nth number of element
 * @param {Boolean} includeStart if filtering should be started from the first element or not
 * @returns {Float32Array}
 */
const every_nth = (arr, nth, includeStart= false) => {
  let arrNew = arr;
  if(includeStart) {
    let appendArr = new Float32Array(nth-1);
    appendArr = appendArr.fill(0, 0, nth-1);
    (arrNew = new Float32Array(arr.length + appendArr.length)).set([...appendArr, ...arr]);
  }
  return arrNew.filter((el, i) => i % nth === nth - 1);
}

/**
 * Convert a 1D array to 2D array or Nd array
 * @param arr
 * @param cols
 * @param depth
 * @returns {[]}
 */
const to2DArray = (arr, cols, depth=1) => {
  let newArr = [], row = [];
  let currCol = 0;
  while(arr.length) {
    if(depth > 1)
      row.push(arr.splice(0, depth));
    else
      row.push(arr.splice(0, depth)[0]);
    currCol++;
    if(currCol % cols === 0) {
      newArr.push(row);
      row = [];
      currCol = 0;
    }
  }
  return newArr;
}

const to1DArray = (arr) => {
  let newArr = arr;
  while(Array.isArray(newArr[0]))
    newArr = arr.flat();
  return newArr;
}

/***
 * To get normally distributed value using Central limit theorem (CLT)
 * @param mu Mean. Default: 0
 * @param sigma Standard deviation. Default: 1
 * @param nsamples Number of samples. Default: 100
 * @returns {number}
 */
const normal = (mu, sigma, nsamples) => {
    if(!nsamples) nsamples = 100
    if(!sigma) sigma = 1
    if(!mu) mu=0

    let run_total = 0
    for(let i=0 ; i<nsamples ; i++){
       run_total += Math.random()
    }
    return Math.round(sigma*(run_total - nsamples/2)/(nsamples/2) + mu)
}

const initializeBRIEFPatterns = (patchSize=31, BRIEFVectorSize = 128) => {
  let BRIEFPattern = [[], []];
  while(BRIEFPattern[0].length !== BRIEFVectorSize) {
    let point1 = {x: normal(0, patchSize, 6), y: normal(0, patchSize, 6)};
    let point2 = {x: normal(point1.x, patchSize, 6), y: normal(point1.y, patchSize, 6)};
    let pointExists = false;
    for(let BRIEFPoint of BRIEFPattern[0]) {
      if(point1.x === BRIEFPoint.x && point1.y === BRIEFPoint.y) {
        pointExists = true;
        break;
      }
    }
    if(!pointExists) {
      BRIEFPattern[0].push(point1);
      BRIEFPattern[1].push(point2);
    }
  }
  let rBRIEF = [[], []];
  for(let i=0; i< 30; i++) {
    for(let j=0; j < BRIEFPattern.length; j++) {
      let pointArray = BRIEFPattern[j].map(point => {
        return {
          x: Math.round(point.x * Math.cos(i * Math.PI / 30) - point.y * Math.sin(i * Math.PI / 30)),
          y: Math.round(point.x * Math.sin(i * Math.PI / 30) + point.y * Math.cos(i * Math.PI / 30))
        }
      });
      rBRIEF[j].push(pointArray);
    }
  }
  return rBRIEF;
}

const hammingDistance = (string1, string2) => {
  if(string1.length !== string2.length)
    return -1;
  let distance = 0;
  for(let i=0; i < string1.length; i++) {
    distance += parseInt(string1[i]) ^ parseInt(string2[i]);
  }
  return distance/string1.length;
};