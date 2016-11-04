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
      this.mw.registerMessageCallback("room-createUser", (data) => {
        this.user = data.data.user;
      });
      this.sio.emit("room-createUser", [this.uid]);
    }
  }
  createRoom() {
    console.log(this.user);
    this.sio.emit("room-createRoom", [this.user]);
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


    this.sio.on('message', (data) => {
      console.log("message:", data);
      if (this.onMessageFunction[data.name]) {
        // console.log(this.onMessageFunction[data.name]);
        this.onMessageFunction[data.name].forEach((f) => f(data));
      }
    });

    this.sio.on('connect', () => {
      console.log('connected');
      this.sio.emit('enter', {uid:this.uid, rid: null}); // atode cookie kara yomikomi
    });

    this.sio.on('room', () => {
      console.log('checked rooms');
      this.sio.emit('')
    });
  }

  registerMessageCallback(messageName, callback) {
    if (!Array.isArray(this.onMessageFunction[messageName])) this.onMessageFunction[messageName] = [];
    this.onMessageFunction[messageName].push(callback);
  }

  send(data) {
    data.uid = this.uid;
    this.sio.emit('message', data);
  }

  roomAction(actionName, arg) {
    this.roomActions[actionName](arg);
  }
}

window.Middleware = Middleware;
