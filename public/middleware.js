class RoomActions {
  constructor(mw) {
    this.uid = mw.uid;
    this.sio = mw.sio;
    this.mw = mw;
    this.user = null;
  }
  join(roomID) {
    this.sio.emit("room-join", [this.user, roomID]);

  }
  remove() {
    this.sio.emit("room-remove", [this.user]);
  }
  leave() {
    this.sio.emit("room-leave", [this.user]);
  }
  createUser() {
    if (!this.user) {
      this.mw.on("room-createUser", (data) => {
        this.user = data.data.user;
      });
      this.sio.emit("room-createUser", [this.uid]);
    }
  }
  createRoom() {
    console.log(this.user);
    this.sio.emit("room-createRoom", [this.user]);
  }
  startGame() {
    this.sio.emit("room-startGame", [this.user]);
  }
}

class BombermanActions {
  constructor(mw) {
    this.uid = mw.uid;
    this.sio = mw.sio;
    this.mw = mw;
    this.roomID = null;
  }

  sendFormat(name, data) {
    return {
      name: name,
      userID: this.uid,
      roomID: this.roomID,
      data: data
    };
  }
  send(name, data) {
    this.sio.emit("bomberman-main", this.sendFormat(name, data));
  }
  putBomb(x,y,size) {
    this.send("putBomb", {
      position: {x:x,y:y},
      size : size
    });
  }
  move(x,y) {
    this.send("move", {
      position: {x:x,y:y}
    });
  }
  death() {
    this.send("death", {
    });
  }
  spawn(x,y) {
    this.send("spawn", {
      position: {x:x,y:y}
    });
  }
}


class Middleware extends window.EventEmitter {

  constructor() {
    super();
    this.uid = Math.random().toString(36).slice(-8);
    this.sio = io.connect('http://localhost:4000/');

    this.onMessageFunction = {};

    this.roomActions = new RoomActions(this);
    this.roomActions.createUser();
    this.bombermanActions = new BombermanActions(this);


    this.sio.on('message', (data) => {
      console.log("message:", data);
      this.emit(data.name, data);
    });

    this.sio.on('connect', () => {
      console.log('connected');
      this.sio.emit('enter', {uid:this.uid, rid: null}); // atode cookie kara yomikomi
    });

    this.sio.on('room', () => {
      console.log('checked rooms');
      this.sio.emit('')
    });
    this.sio.on('bomberman-main', (data) => {
      console.log("data:",data)
      this.emit(data.name, data);
    });

    this.on("room-join", (data) => {
      this.bombermanActions.roomID = data.data.user.rid;
    })
  }


  send(data) {
    data.uid = this.uid;
    this.sio.emit('message', data);
  }

  roomAction(actionName, arg) {
    this.roomActions[actionName](arg);
  }
  bombermanAction(actionName,...arg) {
    this.bombermanActions[actionName](...arg);
  }
}

window.Middleware = Middleware;
