enchant();

const SIZE = [48, 48];
const MATRIX = [11, 11];
const MERGIN = 200;
const CONTROLLER = [10, 400 + MERGIN];
const FPS = 60;
const ESP = 0.01;
const BOMOB_TIMER = 4000;
const PLAYER_SPEED = 500;

function startGame(){
  $('.root-wrap').html('');
  var game = new Core(SIZE[0] * MATRIX[0], SIZE[1] * MATRIX[1] + MERGIN);  // game display size
  game.fps = FPS;                  // frame per second
  game.preload('images/player.png', 'images/map.png', 'images/bomb.png', 'images/flame.png');
  var gameFlow = new GameFlow(game);
  game.onload = function(){
    game.keybind(' '.charCodeAt(0), 'space');
        // setTimeout(() => {
    gameFlow.start([1, 1]);
        // }, Math.random(5000));
  };
  game.start();
}

class GameFlow{
  constructor(game){
    this.game = game;
  }

  start(spawnCoord){
    var playScene = new Scene();
    var map = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];
    map.forEach((row, y) => {
      row.forEach((cel, x) => {
        playScene.addChild(new Tile(x, y, SIZE, this.game.assets['images/map.png'], cel, [false, true]));
        if (cel === 0 && Math.random() < 0.6 && !(x === 1 && y === 1)) {
            var obstacle = new Obstacle(x, y, SIZE, this.game.assets['images/map.png']);
            playScene.addChild(obstacle);
        }
      });
    });
    // you
    var you = new Player(spawnCoord[0], spawnCoord[1], SIZE, this.game.assets['images/player.png'], false);
    you.setSpeed(PLAYER_SPEED);
    playScene.addChild(you);
    you.onMoveEnd((prevCoord, nextCoord, isContinuous) => {
      var currentBomb = mapData.exist(prevCoord, 'Bomb');
      if(currentBomb){
        currentBomb.forEach((b) => {
          b.collision = true;
        });
      }
    });
    you.onMoveStart((prevCoord, nextCoord, isContinuous) => {
      window.mw.bombermanAction('move', prevCoord, nextCoord);
    });
    // bomb
    var setBomb = (cx, cy) => {
      if (mapData.exist([cx, cy], 'Bomb')) {
        return;
      }
      var bomb = new Bomb(cx, cy, SIZE, this.game.assets['images/bomb.png'], false, 1, playScene);
      bomb.bomob_timer = BOMOB_TIMER;
      playScene.addChild(bomb);
      bomb.finalize(() => {
        playScene.removeChild(bomb);
      });
      bomb.startTimer((flameCx, flameCy) => {
        var flame = new Flame(flameCx, flameCy, SIZE, this.game.assets['images/flame.png']);
        flame.finalize(() => {
          playScene.removeChild(flame);
        }, (tick, expired) => {
          playScene.addEventListener('enterframe', tick);
          expired(() => {
            playScene.removeEventListener('enterframe', tick);
          });
        });
        playScene.addChild(flame);
        var bombs = mapData.exist([flameCx, flameCy], 'Bomb');
        if(bombs){
          bombs.forEach((b) => {
            b.detonate();
          });
        }
        var obstacles = mapData.exist([flameCx, flameCy], 'Obstacle');
        obstacles && obstacles.forEach((o) => {
          playScene.removeChild(o);
          o.remove();
        });
      }, (tick, expired) => {
        playScene.addEventListener('enterframe', tick);
        expired(() => {
          playScene.removeEventListener('enterframe', tick);
        });
      });
    };
    // others
    var others = [];
    // Socket Event
    console.log(window.mw.uid);
    window.mw.on('move', (data) => {
      if(data.userID !== window.mw.uid){
        var indexOther = others.map((v) => v.userID).indexOf(data.userID);
        if(indexOther === -1){
          const other = new Player(data.data.position.to[0], data.data.position.to[1], SIZE, this.game.assets['images/player.png'], false);
          other.setSpeed(PLAYER_SPEED);
          other.userID = data.userID;
          other.onMoveEnd((prevCoord, nextCoord, isContinuous) => {
            console.log('other moveend', nextCoord, isContinuous);
          });
          other.onMoveStart((prevCoord, nextCoord, isContinuous) => {
            console.log('other movestart', nextCoord, isContinuous);
          });
          others.push(other);
          playScene.addChild(other);
        }else{
          const other = others[indexOther];
          other.move = data.data.position;
          console.log(new Date().getSeconds(), data.data.position.from, data.data.position.to);
        }
      }
    });
    window.mw.on('requestmove', (data) => {
      if(data.userID !== window.mw.uid){
        window.mw.bombermanAction('move', null, [you.cx, you.cy]);
      }
    });
    window.mw.on('putBomb', (data) => {
      setBomb(data.data.position.x, data.data.position.y);
    });
    console.log('requestmove fired: ', window.mw.uid);
    // Controller
    const pad = new Pad();
    pad.moveTo(CONTROLLER[0], CONTROLLER[1]);
    playScene.addChild(pad);
    // Add Scene
    this.game.pushScene(playScene);
    // Frame Event
    playScene.addEventListener('enterframe', () => {
      var moveVector = [0, 0];
      // move sequence --------------
      if(this.game.input.space){
        if(!(mapData.exist([you.cx, you.cy], 'Bomb'))){
          setBomb(you.cx, you.cy);
          window.mw.bombermanAction('putBomb', you.cx, you.cy, 1);
        }
      }else if(this.game.input.up){
        moveVector = [0, -1];
      }else if(this.game.input.right){
        moveVector = [+1, 0];
      }else if(this.game.input.down){
        moveVector = [0, +1];
      }else if(this.game.input.left){
        moveVector = [-1, 0];
      }
      you.updateCoordinate(you.cx + moveVector[0], you.cy + moveVector[1], true);
      others.forEach((other) => {
        if (other.move) {
          if (other.move.from !== null && (other.move.from[0] !== other.cx || other.move.from[1] !== other.cy)) {
            other.updateCoordinate(other.move.from[0], other.move.from[1], false);
          }
          if (other.move.from === null) {
            other.updateCoordinate(other.move.to[0], other.move.to[1], false);
          } else {
            other.updateCoordinate(other.move.to[0], other.move.to[1], true);
          }
          other.move = null;
        } else {
          other.updateCoordinate(other.cx, other.cy, true);
        }
      });
      // check sequence ------------
      you.occupied((cx, cy) => {
        if(mapData.exist([cx, cy], 'Flame')){
          // alert("You Died!");
          // console.log("You Died!");
        }
      });
    });
  }
}

function transpose(matrix) {
  return zeroFill(getMatrixWidth(matrix)).map(function(r, i) {
    return zeroFill(matrix.length).map(function(c, j) {
      return matrix[j][i];
    });
  });
}

function getMatrixWidth(matrix) {
  return matrix.reduce(function (result, row) {
    return Math.max(result, row.length);
  }, 0);
}

function zeroFill(n) {
  return new Array(n+1).join('0').split('').map(Number);
}

class MapData{
  constructor(matrix){
    this.map = [];
    for(var i = 0; i <= matrix[0] - 1; i++){
      this.map[i] = [];
      for(var j = 0; j <= matrix[1] - 1; j++){
        this.map[i].push([]);
      }
    }
    this.matrix = matrix;
    this.dynamicData = [];
  }

  update(newCoordinate, instance, dynamic){
    if (dynamic) {
      const index = this.dynamicData.map((v) => v.instance).indexOf(instance);
      if (index !== -1) {
        const index_ = this.map[this.dynamicData[index].coord[0]][this.dynamicData[index].coord[1]].indexOf(instance);
        if(index_ === -1){ throw new Error('Fatal error'); }
        this.map[this.dynamicData[index].coord[0]][this.dynamicData[index].coord[1]].splice(index_, 1);
        this.dynamicData.splice(index, 1);
      }
    }
    if(newCoordinate !== null && newCoordinate[0] !== null && newCoordinate[1] !== null){
      this.map[newCoordinate[0]][newCoordinate[1]].push(instance);
      if (dynamic) {
        this.dynamicData.push({
          instance: instance,
          coord: newCoordinate,
        });
      }
    }
  }

  check(coordinate){
    if(coordinate[0] >= 0 && coordinate[0] <= this.matrix[0] - 1 && coordinate[1] <= this.matrix[1] - 1 && coordinate[1] >= 0){
      return !this.map[coordinate[0]][coordinate[1]].some((instance) => instance.collision);
    }else{
      return false;
    }
  }

  exist(coordinate, type){
      if(coordinate[0] >= 0 && coordinate[0] <= this.matrix[0] - 1 && coordinate[1] <= this.matrix[1] - 1 && coordinate[1] >= 0){
      var inst = this.map[coordinate[0]][coordinate[1]].filter((instance) => instance.name() === type);
      if(inst.length !== 0){
        return inst;
      }else{
        return null;
      }
    }else{
      return null;
    }
  }

  name() {
    return this.map.map((column) => column.map((cell) => cell.map((instance) => instance.name())));
  }

  debug() {
    console.table(transpose(this.map.map((col, x) => col.map(cel => cel.map(i => i.name()).filter(v => v !== 'Tile').toString()))));
  }
}

const mapData = new MapData(MATRIX);

var Cell = Class.create(Sprite, {
  name() { return 'Cell'; },

  initialize(cx, cy, size){
    Sprite.call(this, size[0], size[1]);
    this._updateCellCoordinate(cx, cy);
    this.current = [null, null];
    this.speed = this.setSpeed(1000); // 1 cell / ms
    this.continuousFrame = 0;
  },

  setSpeed(cellPerMS) {
    this.speed = Math.round(cellPerMS / 1000 * FPS);
  },

  _updateCellCoordinate(cx, cy){
    this.cx = cx;
    this.cy = cy;
    this.x = cx * this.width;
    this.y = cy * this.height;
  },

  updateCoordinate(cx, cy, isContinuous){
    if(isContinuous){
      var vec = [cx - this.cx, cy - this.cy];
      if(vec[0] !== 0 && vec[1] !== 0){ throw new Error('Vector must point at next cell when continuous move.'); }

      if((vec[0] !== 0 || vec[1] !== 0) && ((this.current[0] === null && this.current[1] === null) || (vec[0] === -1 * this.current[0] || vec[1] === -1 * this.current[1]))){
        this.current[0] = vec[0];
        this.current[1] = vec[1];
      }
      this.continuousFrame += 1;
      this.x += this.current[0] * this.width / this.speed;
      this.y += this.current[1] * this.height / this.speed;

      const mx = this.x % this.width;
      const my = this.y % this.height;
      if((mx < ESP || this.width - mx < ESP) && (my < ESP || this.height - my < ESP)){
        this._updateCellCoordinate(Math.round(this.x / this.width), Math.round(this.y / this.height));
        const currentPrevious = [];
        currentPrevious[0] = this.current[0];
        currentPrevious[1] = this.current[1];
        this.current[0] = null;
        this.current[1] = null;
        this.continuousFrame = 0;
        return [[this.cx - currentPrevious[0], this.cy - currentPrevious[1]], [this.cx, this.cy]];
      } else {
        return [[this.cx, this.cy], [this.cx + this.current[0], this.cy + this.current[1]]];
      }
    }else{
      this._updateCellCoordinate(cx, cy);
      this.current[0] = null;
      this.current[1] = null;
      return [[cx, cy], [this.cx, this.cy]];
    }
  },

  isMoving(){
    return this.current[0] !== null || this.current[1] !== null;
  },

    // canFlame(cx, cy){
    //     return mapData.check([cx, cy]);
    // },
});

var Collider = Class.create(Cell, {
  name() { return 'Collider'; },

  initialize(cx, cy, size, collision, dynamic){
    Cell.call(this, cx, cy, size);
    this.collision = collision;
    this.dynamic = dynamic;
    mapData.update([cx, cy], this, this.dynamic);
  },

  updateCoordinate(cx, cy, isContinuous){       // trueのところにfalseが入れない。
    if (this.dynamic) {
      if(this.isMoving() || (mapData.check([cx, cy]) && (cx !== this.cx || cy !== this.cy))){
        const moveCoords = Cell.prototype.updateCoordinate.call(this, cx, cy, isContinuous);
        if(!this.isMoving()){
          mapData.update(moveCoords[1], this, this.dynamic);
        }
        return moveCoords;
      }
      return null;
    }
  },

  remove(){
    if (this.dynamic) {
      mapData.update(null, this, this.dynamic);
    }
  },
});

// [false, true]
var Tile = Class.create(Collider, {
  name() { return 'Tile'; },

  initialize(cx, cy, size, image, frame, frameColliderAssign){
    Collider.call(this, cx, cy, size, frameColliderAssign[frame], false);
    this.image = image;
    this.frame = frame;
    this.frameColliderAssign = frameColliderAssign;
  },
});

var Player = Class.create(Collider, {
  name() { return 'Player'; },

  initialize(cx, cy, size, image, collision){
    Collider.call(this, cx, cy, size, collision, true);
    this.image = image;
    this.frame = 0;
    this.current = [null, null];
    this.onMoveEndEvents = [];
    this.onMoveStartEvents = [];
    this.userID = null;
  },

  onMoveEnd(cb) {
    this.onMoveEndEvents.push(cb);
  },

  onMoveStart(cb) {
    this.onMoveStartEvents.push(cb);
  },

  updateCoordinate(cx, cy, isContinuous){ // call in each frame
    var wasMoving = this.isMoving();
    var moveCoords = Collider.prototype.updateCoordinate.call(this, cx, cy, isContinuous);
    if (wasMoving !== this.isMoving()) {
      if (this.isMoving()) {
        this.onMoveStartEvents.forEach((cb) => { cb(moveCoords[0], moveCoords[1]); });
      } else {
        this.onMoveEndEvents.forEach((cb) => { cb(moveCoords[0], moveCoords[1]); });
      }
    }
  },

  occupied(cb) {
    cb(this.cx, this.cy);
    if (this.isMoving()) {
      cb(this.cx + this.current[0], this.cy + this.current[1]);
    }
  },
});

class Timer {
  constructor(fps) {
    this.length = null;
    this.now = 0;
    this.fps = fps;
    this.cb = () => {};
    this.finalizeCb = () => {};
  }

  tick() {
    this.now += 1;
    if (this.length && this.now >= this.length) {
      this.cb();
      this.finalizeCb();
    }
  }

  setTimeout(cb, length, timerRegister) {
    timerRegister(this.tick.bind(this), this.expired.bind(this));
    this.length = length / 1000 * this.fps;
    this.cb = cb;
  }

  clearTimeout() {
    this.finalizeCb();
    this.length = null;
    this.finalizeCb = () => {};
    this.cb = () => {};
    this.now = 0;
  }

  expired(cb) {
    this.finalizeCb = cb;
  }
}

var Bomb = Class.create(Collider, {
  name() { return 'Bomb'; },

  initialize(cx, cy, size, image, collision, fireLength){
    Collider.call(this, cx, cy, size, collision, true);
    this.image = image;
    this.frame = 0;
    this.current = [null, null];
    this.cx = cx;
    this.cy = cy;
    this.size = size;
    this.fireLength = fireLength;
    this.finalizeCb = () => {};
    this.flameCb = () => {};
    this.timer = new Timer(FPS);
    this.bomob_timer = 2000;
  },

  finalize(cb){
    this.finalizeCb = cb;
  },

  startTimer(cb, timerRegister){
    this.timer.setTimeout(() => {
      this.detonate();
    }, this.bomob_timer, timerRegister);
    this.flameCb = cb;
  },

  detonate(){
    // console.log('detonate', this.cx, this.cy);
    if(this.timer){
      this.timer.clearTimeout();
    }
    this.finalizeCb();
    this.remove();
    this.flame(this.flameCb);
  },

  flame(cb){
    cb(this.cx, this.cy);
    [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach((dc) => {
      var obstacleFlag = false;
      for(var i = 1; i <= this.fireLength; i++){
        if(mapData.exist([this.cx + dc[0]*i, this.cy + dc[1]*i], 'Tile')[0].collision || obstacleFlag){
          break;
        }
        if (mapData.exist([this.cx + dc[0]*i, this.cy + dc[1]*i], 'Obstacle')) {
          obstacleFlag = true;
        }
        cb(this.cx + dc[0]*i, this.cy + dc[1]*i);
      }
    });
  },
});

var Flame = Class.create(Collider, {
  name() { return 'Flame'; },

  initialize(cx, cy, size, image){
    Collider.call(this, cx, cy, size, false, true);
    this.image = image;
    this.frame = 0;
    this.current = [null, null];
    this.cx = cx;
    this.cy = cy;
    this.size = size;
    this.timer = new Timer(FPS);
  },

  finalize(cb, timerRegister) {
    this.timer.setTimeout(() => {
      cb();
      this.remove();
    }, 1.2 * 1000, timerRegister);
  },
});

const Obstacle = Class.create(Collider, {
  name() { return 'Obstacle'; },

  initialize(cx, cy, size, image) {
    Collider.call(this, cx, cy, size, true, true);
    this.image = image;
    this.frame = 1;
  },


});
