var fs = require('fs');
var http = require('http');
// var socketio = require('socket.io');
var server = http.createServer();


class Manager {
  constructor(){
    // this.rid = Math.random().toString(36).slice(-8);
    this.roomList = {};
    this.outOfRoom = [];
  }
  createUser(uid){
    this.outOfRoom.push(new User(uid));
  }
  createRoom(user){
    const rid = Math.random().toString(36).slice(-8);
    user.rid = rid;
    user.status = memberStatus.playing;
    this.roomList[rid] = {
      members: [user],
      watchers: [],
    };
  }
  join(user, rid){
    if (this.roomList[rid].members.length >= 8) {
      throw {
        name: "RoomCapacityException",
        message: "this room is full of players. max capacity is 8."
      };
    }
    for(let i in this.outOfRoom){
      if(this.outOfRoom[i] == user){
        this.outOfRoom.splice(i, 1);
        break;
      }
    }
    this.roomList[rid].members.push(user);
    if(user.rid === null){
      user.rid = rid;
    }
    user.status = memberStatus.playing;
  }
  leave(user){
    for(let i in this.roomList[user.rid].members){
      if(this.roomList[user.rid].members[i] === user){
        this.roomList[user.rid].members.splice(i, 1);
        break;
      }
    }
    this.outOfRoom.push(user);
  }
  remove(user){
    leave(user);
    user.rid = null;
  }
  findUser(uid) {
    return (
      this.outOfRoom.find((user) => user.uid === uid) ||
      Object.keys(this.roomList)
        .map((rid) => this.roomList[rid].members.find((user) => user.uid === uid)
        )
        .find((something) => !!something)
    );
  }

}

const roomManager = new Manager();

class User {
  constructor(uid){
    this.uid = uid;
    this.rid = null;
    this.status = memberStatus.waiting;
  }
}

const memberStatus = {
  playing: 1,
  watching: 2,
  waiting: 3,
};

function sendFormat(name, obj, err) {
  return {
    name: name,
    success: !err,
    msg: err ? err.message : null,
    data: obj,
  };
}

function socketExecute() {

  server.on('request', function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    var output = fs.readFileSync('./bomberman.html', 'utf-8');
    // var output = fs.readFile(fs.readFileSync('./bomberman.html', 'utf-8'));    ←誤りの原因
    res.end(output);
  });

  server.listen(4000);
  var io = require('socket.io').listen(server);
  var roomList = {
    'dc6b76a0':{
      number: 13,
      watchers: [],
      members:[],
    },
    '2':{
      number: 14,
      watchers: [],
      members:[],
    },
  };

  io.sockets.on('connection', function(socket) {
    // console.log('よくわからんけど入室');
    // socket.on('enter', function(data) {
    //   console.log('enter', data);
    //   if(data.rid === null) outOfRoom.push(data.uid);
    // });
    ["createUser","createRoom","join","leave","remove"].forEach((methodName) => {
      socket.on(`room-${methodName}`, (args) => {
        let error = null;
        try {
          roomManager[methodName].apply(roomManager, args);
        } catch (e) {
          error = e;
        }
        const user = (args[0]&&args[0].uid) ? args[0] : roomManager.findUser(args[0]);
        console.log(user);
        const response = sendFormat(`room-${methodName}`, {
          roomList: roomManager.roomList,
          outOfRoom: roomManager.outOfRoom,
          user: user
        }, error);
        io.sockets.emit('message', response);
        console.log(`receive room-${methodName}:`,args," ---> ",response.data);
      });
    });

    socket.on('message', function(data) {
      io.sockets.emit('message', data);
      console.log(data);
    });

    socket.on('disconnect', function(data) {
      io.sockets.emit('massage', data + ' : 退出');
      console.log(data + ' : 退出');
    });
  });
}

module.exports = socketExecute;
