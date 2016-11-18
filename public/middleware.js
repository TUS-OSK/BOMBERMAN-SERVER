class RoomActions {
  constructor(mw) {
    this.uid = mw.uid;
    this.sio = mw.sio;
    this.mw = mw;
    this.user = null;
    console.log("uid", this.uid);
  }
  join(roomID) {
    console.log("room-join send", [this.user, roomID]);
    this.sio.emit("room-join", [this.user, roomID]);

  }
  remove() {
    this.sio.emit("room-remove", [this.user]);
  }
  leave() {
    this.sio.emit("room-leave", [this.user]);
  }
  members() {
    this.sio.emit("room-members", [this.user]);
  }
  createUser() {
    if (!this.user) {
      this.mw.on("room-createUser", (data) => {
        if (this.user === null) {
          this.user = data.data.user;
        }
        this.mw.emit('room-update', data);
      });
      this.sio.emit("room-createUser", [this.uid]);
      this.mw.on('room-join', (data) => {
        // if(this.user == null){
        //   this.user = data.data.user;
        // }
      });
    }
  }
  createRoom() {
    console.log('createroom send',this.user);
    this.sio.emit("room-createRoom", [this.user]);
  }

  // startGame() {
  //   this.sio.emit("room-startGame", [this.user]);
  // }
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
  startGame() {
    this.send("startGame", {

    });
  }
  send(name, data) {
    console.log("bombermanAction send",this.sendFormat(name, data))
    this.sio.emit("bomberman-message", this.sendFormat(name, data));
  }
  putBomb(x,y,fireLength) {
    this.send("putBomb", {
      position: {x:x,y:y},
      fireLength : fireLength
    });
  }
  move(from, to) {
    this.send("move", {
      position: {from:from,to:to}
    });
  }
  death(position) {
    this.send("death", {
      position: position.concat()
    });
  }
  spawn(x,y) {
    this.send("spawn", {
      position: {x:x,y:y}
    });
  }
  requestmove() {
    this.send("requestmove");
  }
  obstaclePositions(positions) {
    this.send("obstaclePositions", 
      positions.concat()
    );
  }
  removeItem(pos) {
    this.send("removeItem", pos.concat());
  }
  // handshake() {
  //   this.send("handshake");
  // }
  // handshakeresponse() {
  //   this.send("handshakeresponse");
  // }
}

class Middleware extends window.EventEmitter {

  constructor() {
    super();
    this.uid = Math.random().toString(36).slice(-8);
    this.sio = io.connect('http://nokogirl.cloudapp.net/');
    this.rid = null;
    this.members = [];

    this.onMessageFunction = {};

    this.roomActions = new RoomActions(this);
    this.roomActions.createUser();
    this.bombermanActions = new BombermanActions(this);


    this.sio.on('room-message', (data) => {
      console.log("room-message:", data);
      this.emit(data.name, data);
      this.emit('room-all', data)
    });

    this.sio.on('connect', () => {
      console.log('connected');
      this.sio.emit('enter', {uid:this.uid, rid: null}); // atode cookie kara yomikomi
    });

    this.sio.on('room', () => {
      console.log('checked rooms');
      this.sio.emit('')
    });

    this.sio.on('bomberman-message', (data) => {
      // console.log("data:",data)
      this.emit(data.name, data);
    });

    this.on("room-join", (data) => {
      if (!this.rid) {
        this.bombermanActions.roomID = data.data.user.rid;
        this.rid = data.data.user.rid;
      }
      this.members = data.data.roomList[this.rid].members;
    });
  }

  send(data) {
    data.uid = this.uid;
    this.sio.emit('room-message', data);
  }

  roomAction(actionName, arg) {
    this.roomActions[actionName](arg);
  }
  bombermanAction(actionName,...arg) {
    this.bombermanActions[actionName](...arg);
  }
}

window.Middleware = Middleware;
