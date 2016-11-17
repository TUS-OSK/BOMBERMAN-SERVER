// API
const express = require('express');
const app = express();
var http = require('http');
var socketio = require('socket.io');
var server = http.createServer(app);
var io = require('socket.io').listen(server);

server.listen(3000);

const socketExecute =  require("./socket-connection");

socketExecute(io);

app.use('/public', express.static('public'));




// app.listen(process.env.PORT || 3000);

console.log("server is running. go http://localhost:" + (~~process.env.PORT || 3000) + "/public/index.html\n");

