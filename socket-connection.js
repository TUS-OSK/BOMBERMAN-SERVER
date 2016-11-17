function socketExecute(io) {

  class Manager {
    constructor(){
      // this.rid = Math.random().toString(36).slice(-8);
      this.roomList = {};
      this.outOfRoom = [];
    }
    createUser(uid, sioid){
      this.outOfRoom.push(new User(uid, sioid));
    }
    createRoom(user){
      const rid = Math.random().toString(10).slice(-4);
      user.rid = rid;
      user.status = memberStatus.playing;
      this.roomList[rid] = {
        members: [],
        waiting: true,
      };
    }
    join(user, rid, sioid, socket){
      if (this.roomList[rid].members.length >= 8) throw {
        name: "RoomCapacityException",
        message: "this room is full of players. max capacity is 8."
      };
      for(let i in this.outOfRoom){
        if(this.outOfRoom[i].uid == user.uid){
          this.outOfRoom.splice(i, 1);
          break;
        }
      }
      this.roomList[rid].members.push(user);
      console.log("join room", this.roomList[rid].members)
      if(user.rid === null){
        user.rid = rid;
      }
      user.status = memberStatus.playing;
      socket.join(rid);
    }
    leave(sioid, socket){
      const indexOutOfRoom = this.outOfRoom.map((v) => v.sioid).indexOf(sioid);
      console.log("OutOfRoom", this.outOfRoom.map((v) => v.sioid));
      if (indexOutOfRoom !== -1) {
        this.outOfRoom.splice(indexOutOfRoom, 1);
        console.log("outOfRoom delete", sioid);
      }
      Object.keys(this.roomList).forEach((key) => {
        console.log(this.roomList[key].members.map((v) => v.sioid), sioid);
        const indexRoomList = this.roomList[key].members.map((v) => v.sioid).indexOf(sioid);
        console.log("RoomList", key, this.roomList[key].members.map((v) => v.sioid));
        if (indexRoomList !== -1) {
          this.roomList[key].members.splice(indexRoomList, 1);
          console.log("roomList delete", sioid);
          if (this.roomList[key].members.length === 0) {
            delete this.roomList[key];
          }
        }
      });
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
    startGame(rid){
      this.roomList[rid].waiting = false;
    }
  }

  const roomManager = new Manager();

  class User {
    constructor(uid, sioid){
      this.uid = uid;
      this.rid = null;
      this.sioid = sioid;
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


  io.sockets.on('connection', function(socket) {
    // console.log('よくわからんけど入室');
    // socket.on('enter', function(data) {
    //   console.log('enter', data);
    //   if(data.rid === null) outOfRoom.push(data.uid);
    // });

    // やっぱこのへんキモいからあとでどうにかする
    ["createUser","createRoom","join","leave"].forEach((methodName) => {
      // console.log(roomManager.outOfRoom);
      // Object.keys(roomManager.roomList).forEach((key) => {
      //   console.log(key, roomManager.roomList[key].members);
      // });
      socket.on(`room-${methodName}`, (args) => {
        let error = null;
        args && args.push(socket.id,socket);
        try {
          roomManager[methodName].apply(roomManager, args);
        } catch (e) {
          error = e;
        }
        const user = (args[0]&&args[0].uid) ? args[0] : roomManager.findUser(args[0]);
        const response = sendFormat(`room-${methodName}`, {
          roomList: roomManager.roomList,
          outOfRoom: roomManager.outOfRoom,
          user: user
        }, error);
        io.sockets.emit('room-message', response);

      });
    });

    socket.on('bomberman-message', (data) => {
      console.log(data)
      if (data.roomID) {
        io.to(data.roomID).emit('bomberman-message', data);
      }
    })

    socket.on('room-members', (user) => {
      io.socket.emit('room-message', sendFormat("room-members", roomManager.roomList[user.rid].members));
    });

    socket.on('room-message', function(data) {
      io.sockets.emit('room-message', data);
      console.log(data);
    });

    socket.on('disconnect', function(data) {
      io.sockets.emit('massage', data + ' : 退出');
      console.log(data + ' : 退出', socket.id);
      roomManager.leave(socket.id);
      // console.log(user);
      const response = sendFormat(`room-update`, {
        roomList: roomManager.roomList,
        outOfRoom: roomManager.outOfRoom,
        user: null
      }, null);
      io.sockets.emit('room-message', response);
    });
  });
}

module.exports = socketExecute;
