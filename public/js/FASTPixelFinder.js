importScripts('utils.js');

onmessage = (e) => {
  const getImageDataFaster = function (x, y, w, h, W, H, d) {
    let arr = new Uint8ClampedArray(w*h), i=0;
    for (let r=y; r<h+y; r+=1) {
      for (let c=x; c<w+x; c+=1) {
        let O = ((r*W) + c);
        if (c<0 || c>=W || r<0 || r>=H) {
          arr[i++] = 0;
        } else {
          arr[i++] = d[O*4];
        }
      }
    }
    return arr;
  };

  let imageData = e.data.imageData;
  let stride = e.data.stride;
  let threshold = e.data.threshold;
  let blur = e.data.blur ? e.data.blur : 1;
  let level = e.data.level;

  // When the Worker thread is called for the first time
  if(self.bufferCanvas === undefined) {
    self.bufferCanvas = e.data.bufferCanvas;
    self.bufferCanvasCtx = self.bufferCanvas.getContext("2d");
    self.bufferCanvas.width = imageData.width;
    self.bufferCanvas.height = imageData.height;

    // For grayscale data
    self.color_bufferCanvas = new OffscreenCanvas(self.bufferCanvas.width, self.bufferCanvas.height);
    self.color_bufferCanvasCtx = self.color_bufferCanvas.getContext("2d");
    self.g_bufferCanvas = new OffscreenCanvas(self.bufferCanvas.width, self.bufferCanvas.height);
    self.g_bufferCanvasCtx = self.g_bufferCanvas.getContext("2d");

    // Global variables
    self.array_BRIEFPointsTest = new Set();
    self.array_BRIEFPointsResult = new Map();
    self.BRIEFPattern = e.data.BRIEFPoints;
  }

  let array_FASTKeypointIndex = []
  self.g_bufferCanvasCtx.filter = `grayscale(100%) blur(${blur}px)`;
  // self.color_bufferCanvasCtx.putImageData(imageData, 0, 0);
  self.bufferCanvasCtx.putImageData(imageData, 0, 0);
  self.g_bufferCanvasCtx.drawImage(self.bufferCanvas, 0, 0);
  let g_imageData = self.g_bufferCanvasCtx.getImageData(0, 0, self.g_bufferCanvas.width, self.g_bufferCanvas.height);
  let width = self.g_bufferCanvas.width;
  let height = self.g_bufferCanvas.height;


  FASTPointIdentification: {
    let fastPixelLocationList = [[0, -3], [1, -3], [2, -2], [3, -1], [3, 0], [3, 1], [2, 2], [1, 3], [0, 3], [-1, 3], [-2, 2], [-3, 1], [-3, 0], [-3, -1], [-2, -2], [-1, -3]];

    for(let loc = 0; loc < g_imageData.data.length; loc += 4*stride) {
      if(loc / 4 / width >= 3 && loc / 4 % width >= 3 && (loc / 4 % width - 3) % stride === 0) {
        let g_pixel = g_imageData.data[loc];
        let lastPixel = 0;
        let count = 0;
        let fastPixel_N = g_imageData.data[loc + (fastPixelLocationList[0][1] * 4 * width) + fastPixelLocationList[0][0] * 4];
        let fastPixel_E = g_imageData.data[loc + (fastPixelLocationList[4][1] * 4 * width) + fastPixelLocationList[4][0] * 4];
        let fastPixel_S = g_imageData.data[loc + (fastPixelLocationList[8][1] * 4 * width) + fastPixelLocationList[8][0] * 4];
        let fastPixel_W = g_imageData.data[loc + (fastPixelLocationList[12][1] * 4 * width) + fastPixelLocationList[12][0] * 4];

        if(fastPixel_N + threshold > g_pixel || fastPixel_N - threshold < g_pixel)
          count++;
        if(fastPixel_E + threshold > g_pixel || fastPixel_E - threshold < g_pixel)
          count++;
        if(fastPixel_S + threshold > g_pixel || fastPixel_S - threshold < g_pixel)
          count++;
        if(fastPixel_W + threshold > g_pixel || fastPixel_W - threshold < g_pixel)
          count++;
        if(count >= 3) {
          count = 0;
          for(let fastPixelIdx=0; fastPixelIdx < fastPixelLocationList.length; fastPixelIdx++) {
            let g_fastPixel = g_imageData.data[loc + (fastPixelLocationList[fastPixelIdx][1] * 4 * width) + fastPixelLocationList[fastPixelIdx][0] * 4];
            if(g_fastPixel > g_pixel + threshold){
              if(lastPixel !== 1)
                count = 0;
              lastPixel = 1;
              count++;
            }
            else if(g_fastPixel < g_pixel - threshold){
              if(lastPixel !== 0)
                count = 0;
              lastPixel = 0;
              count++;
            }
            if(count === 12) {
              array_FASTKeypointIndex.push(loc);
              if(e.data.showFASTPoints) {
                imageData.data[loc] = 255
                imageData.data[loc+1] = 255;
                imageData.data[loc+2] = 255;
                imageData.data[loc+3] = 255;
              }

              break;
            }
          }
        }
      }
    }
  }

  // To display FAST points
  self.bufferCanvasCtx.putImageData(imageData, 0, 0);

  /* Rotation aware FAST */
  let array_FASTKeypointOrientation = [];
  let patchSize = 31;
  RotationAwareFAST: {
    for(const index of array_FASTKeypointIndex) {
      let sy = Math.floor(index/4/width) - Math.floor(patchSize/2);
      let sx = Math.floor(index/4/height) - Math.floor(patchSize/2);
      if(sy < 0 && sy > width && sx < 0 && sx > height)
        continue;
      let patchData = getImageDataFaster(sx, sy, patchSize, patchSize, g_imageData.width, g_imageData.height, g_imageData.data);
      const reducer_m00 = (accum, currVal) => accum + currVal;
      const reducer_m10 = (accum, currVal, currIdx) => accum + (currIdx % 15) * currVal;
      const reducer_m01 = (accum, currVal, currIdx) => accum + Math.floor(currIdx / 15) * currVal;
      let m00 = patchData.reduce(reducer_m00);
      let m01 = patchData.reduce(reducer_m01);
      let m10 = patchData.reduce(reducer_m10);
      let centroid = [sx + Math.floor(m10/m00), sy + Math.floor(m01/m00)];
      sx += Math.floor(patchSize/2);
      sy += Math.floor(patchSize/2);
      array_FASTKeypointOrientation.push(Math.atan2(sy-centroid[1], sx-centroid[0]));
      // console.log(centroid, [sx, sy], [sx-centroid[0], sy-centroid[1]], Math.atan2(sy-centroid[1], sx-centroid[0]) * 180/Math.PI, g_imageData.width, g_imageData.height);
    }
  }

  BRIEF: {
    for(let i=0; i < array_FASTKeypointIndex.length; i++) {
      let sy = Math.floor(array_FASTKeypointIndex[i]/4 / width);
      let sx = Math.floor(array_FASTKeypointIndex[i]/4 % width);
      let briefVector = "";
      let patchOrientation = array_FASTKeypointOrientation[i];
      patchOrientation = patchOrientation < 0 ? 2 * Math.PI + patchOrientation : patchOrientation;
      patchOrientation = Math.floor(patchOrientation / (2 * Math.PI / 30));
      let BRIEFPattern_point1 = self.BRIEFPattern[0][patchOrientation];
      let BRIEFPattern_point2 = self.BRIEFPattern[1][patchOrientation];
      for(let i=0; i < BRIEFPattern_point1.length; i++) {
        if(g_imageData.data[((sy + BRIEFPattern_point1[i].x * g_imageData.width) + sx + BRIEFPattern_point1[i].y) * 4] > g_imageData.data[((sy + BRIEFPattern_point2[i].x) * g_imageData.width + sx + BRIEFPattern_point2[i].y) * 4])
          briefVector += "1";
        else
          briefVector += "0";
      }
      let level = 1;
      let color;
      if(self.array_BRIEFPointsResult.size === 0)
        self.array_BRIEFPointsResult.set(briefVector, "#" + ((1<<24)*Math.random() | 0).toString(16));
      else {
        let distanceThreshold = 0.5;
        let minHammingDistance = 1, total = 0;
        let _hammingDistance, mostSimilarItem;
        for(let item of self.array_BRIEFPointsResult) {
          _hammingDistance = hammingDistance(item[0], briefVector);
          total += _hammingDistance;
          if(_hammingDistance < minHammingDistance) {
            minHammingDistance = _hammingDistance;
            mostSimilarItem = item;
          }
        }
        if(total/self.array_BRIEFPointsResult.size > distanceThreshold) {
          color = "#" + ((1<<24)*Math.random() | 0).toString(16);
          self.array_BRIEFPointsResult.set(briefVector, color);
        }

        else {
          if(minHammingDistance > 0.30)
            color = mostSimilarItem[1] ? mostSimilarItem[1] : "black";
        }
      }
      if(e.data.showORBPoints) {
        self.array_BRIEFPointsTest.add(briefVector);
        self.bufferCanvasCtx.beginPath();
        self.bufferCanvasCtx.arc(sx * level, sy * level, 5, 0, 2 * Math.PI);
        self.bufferCanvasCtx.strokeStyle = color;
        self.bufferCanvasCtx.stroke();
      }
    }
  }
}