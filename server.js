const express = require("express");
const app = express();


const server = require("http").createServer(app);

// To server static files
app.use(express.static("public"));

// URLs
app.get("/", (request, response) => {
  response.sendFile(__dirname+"/views/index.html");
});

app.get("/test", (request, response) => {
  response.sendFile(__dirname+"/views/test.html");
});

const port = process.argv[2] || 8000;
server.listen(port, () => {
  console.log(`Listening on ${port}`);
});