class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(name, callback) {
    this.events[name] = this.events[name] || [];
    this.events[name].push(callback);
  }

  off(name, callback) {
    let idx = -1;
    for (;;) {
      idx = this.events[name].indexOf(callback);
      if(idx != -1) {
        this.events[name].splice(idx, 1);
      } else {
        break;
      }
    }
  }

  emit(name, ...args) {
    (this.events[name] || []).forEach((e) => {
      e(...args)
    });
  }
}

window.EventEmitter = EventEmitter;
