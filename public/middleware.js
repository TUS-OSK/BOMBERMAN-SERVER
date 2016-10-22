class Middleware extends window.EventEmitter {
  constructor() {
    super();
    this.uid = Math.random().toString(36).slice(-8);
    this.sio = io.connect('http://localhost:4000/');

    this.sio.on('message', (data) => {
      console.log(data);
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


  send(data) {
    data.uid = this.uid;
    this.sio.emit('message', data);
  }
}

// window.Middleware = Middleware;
window.mw = new Middleware();
