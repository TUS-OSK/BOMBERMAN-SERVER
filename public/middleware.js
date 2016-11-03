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
      this.sio.emit("room-createUser", [this.uid]);
      this.mw.registerMessageCallback("room-createUser", (data) => {
        this.user = data.data.user;
      });
    }
  }
  createRoom() {
    this.sio.emit("room-createRoom", [this.user]);
  }
}


class Middleware extends window.EventEmitter {

  constructor() {
    super();
    this.uid = Math.random().toString(36).slice(-8);
    this.sio = io.connect('http://localhost:4000/');

    this.onMessageFunction = {a:1};

    this.roomActions = new RoomActions(this);
    this.roomActions.createUser();


    this.sio.on('message', (data) => {
      console.log("message:",data);
      this.onMessageFunction[data.name] && this.onMessageFunction[data.name](data);
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
    this.onMessageFunction[messageName] = callback;
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
