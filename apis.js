// API
const express = require('express');
const app = express();
const socketExecute =  require("./socket-connection");

socketExecute();

app.use('/public', express.static('public'));

const maxPopulation = 8; // max population in one room
let number = 997;

// example room
const roomList = [
  {
    id: 1,
    number: 13,
    population: 3,
    watchers: 2,
  },
  {
    id: 2,
    number: 14,
    population: 8,
    watchers: 5,
  },
];

function withError(obj, err) {
  return {
    success: !err,
    msg: err ? err.message : null,
    data: obj,
  }
}
// http://localhost:3000/api/room/list
app.get('/api/room/list', (req, res) => { // return roomList
  res.json(withError(roomList, null));
});

app.post('/api/room/make', (req, res) => { // make new room_id and return it
  let id = Math.random().toString(36).slice(-8);
  if(number >= 999) number = -1; // room_number from 1 to 999
  roomList.push({ // add room to roomList
    id: id,
    number: ++number,
    population: 0,
    watchers: 0,
  });
  res.json(withError(id, null));
});

app.post('/api/room/:room_id/connect', (req, res) => { // request room_id and return roomInfo
  let err = null;
  let presentRoom = roomList.filter((room, index) => { // filter first room matches room_id
    if (room.id == req.params.room_id) return true;
  })[0];
  if(presentRoom.population >= maxPopulation){ // if full make error msg else count up population
    err = new Error('this room is full.');
  } else {
    presentRoom.population++;
  }
  res.json(withError(presentRoom, err));
});

app.post('/api/room/:room_id/watch', (req, res) => { // request room_id and return roomInfo
  let err = null;
  let presentRoom = roomList.filter((room, index) => { // filter first room matches room_id
    if (room.id == req.params.room_id) return true;
  })[0];
  presentRoom.watchers++;
  res.json(withError(presentRoom, err));
});

app.listen(process.env.PORT || 3000);

console.log("server is running. go http://localhost:" + (~~process.env.PORT || 3000) + "/public/index.html\n");