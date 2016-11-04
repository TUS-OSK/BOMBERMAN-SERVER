enchant();

const SIZE = [48, 48];
const MATRIX = [11, 11];

function startGame(){
  $(".root-wrap").html('');
    var game = new Core(SIZE[0] * MATRIX[0], SIZE[1] * MATRIX[1]);  // game display size
    game.fps = 60;                  // frame per second
    game.preload("images/player.png", "images/map.png", "images/bomb.png", "images/flame.png");
    var gameFlow = new GameFlow(game);
    game.onload = function(){
        game.keybind(" ".charCodeAt(0), "space");
        gameFlow.start([1, 1]);
    }
    game.start();
};

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
                playScene.addChild(new Tile(x, y, SIZE, this.game.assets["images/map.png"], cel, [false, true]));
            });
        });
        // you
        var you = new Player(spawnCoord[0], spawnCoord[1], SIZE, this.game.assets["images/player.png"], false);
        playScene.addChild(you);
        you.onMoveEnd((prevCoord, nextCoord) => {
            // console.log(prevCoord, nextCoord);
            var currentBomb = mapData.exist(prevCoord, "Bomb");
            if(currentBomb){
                currentBomb.forEach((b) => {
                    b.collision = true;
                });
            }
        });
        you.onMoveStart((prevCoord, nextCoord) => {
            // console.log(prevCoord, nextCoord);
            console.log(new Date().getSeconds(), nextCoord[0], nextCoord[1]);
            window.mw.bombermanAction("move", nextCoord[0], nextCoord[1]);
        });
        // others
        var others = [];
        // Socket Event
        console.log(window.mw.uid);
        window.mw.on("move", (data) => {
            if(data.userID !== window.mw.uid){
                var indexOther = others.map((v) => v.userID).indexOf(data.userID);
                if(indexOther === -1){
                    var other = new Player(data.data.position.x, data.data.position.y, SIZE, this.game.assets["images/player.png"], false);
                    other.userID = data.userID;
                    others.push(other);
                    playScene.addChild(other);
                }else{
                    var other = others[indexOther];
                    other.dist = [data.data.position.x, data.data.position.y];
                    console.log(new Date().getSeconds(), data.data.position.x, data.data.position.y);
                }
            }
        });
        window.mw.on("requestmove", (data) => {
            if(data.userID !== window.mw.uid){
                window.mw.bombermanAction("move", you.cx, you.cy);
            }
        });
        window.mw.on("putBomb", (data) => {

        });
        window.mw.bombermanAction("requestmove");
        setTimeout(() => {
            var  coords = [[1, 1], [9, 9], [9, 1], [1, 9]];
            for(var i = 0; i < coords.length; i++){
                if(!(mapData.exist(coords[i], "Player"))){
                    you.updateCoordinate(coords[i][0], coords[i][1]);
                    window.mw.bombermanAction("move", coords[i][0], coords[i][1]);
                    break;
                }
            }
            // Add Scene
            console.log(others);
            this.game.pushScene(playScene);
        }, 1000);

        // Frame Event
        playScene.addEventListener("enterframe", () => {
            var moveVector = [0, 0];
            // move sequence --------------
            if(this.game.input.space){
                if(!(mapData.exist([you.cx, you.cy], "Bomb"))){
                    var bomb = new Bomb(you.cx, you.cy, SIZE, this.game.assets["images/bomb.png"], false, 1, playScene);
                    playScene.addChild(bomb);
                    window.mw.bombermanAction("putBomb", you.cx, you.cy, SIZE);
                    bomb.finalize(() => {
                        playScene.removeChild(bomb);
                    });
                    bomb.detonate((flameCx, flameCy) => {
                        var flame = new Flame(flameCx, flameCy, SIZE, this.game.assets["images/flame.png"]);
                        playScene.addChild(flame);
                        flame.finalize(() => {
                            playScene.removeChild(flame);
                        });
                    });
                    console.log(you.cx, you.cy, "put a bomb");
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
            you.updateCoordinate(you.cx + moveVector[0], you.cy + moveVector[1]);
            others.forEach((other) => {
                if (other.dist) {
                    other.updateCoordinate(other.dist[0], other.dist[1]);
                    other.dist = null;
                } else {
                    other.updateCoordinate(other.cx, other.cy);
                }
            });
            // check sequence ------------
            you.occupied((cx, cy) => {
                if(mapData.exist([cx, cy], "Flame")){
                    // alert("You Died!");
                    console.log("You Died!");
                }
            });
        });
    }
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
    }

    update(oldCoordinate, newCoordinate, instance){
    	// if (oldCoordinate[0] === newCoordinate[0] && oldCoordinate[1] === newCoordinate[1]) { return; }
        // if(!(instance instanceof Collider)){ throw new Error("instance should be a sub class of Collision!"); }
        // console.log(oldCoordinate, newCoordinate, instance.name(), instance.userID);
        if(oldCoordinate !== null && oldCoordinate[0] !== null && oldCoordinate[1] !== null){
            const index = this.map[oldCoordinate[0]][oldCoordinate[1]].indexOf(instance);
            this.map[oldCoordinate[0]][oldCoordinate[1]].splice(index, 1);
        }
        if(newCoordinate !== null && newCoordinate[0] !== null && newCoordinate[1] !== null){
        	this.map[newCoordinate[0]][newCoordinate[1]].push(instance);
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
}

const mapData = new MapData(MATRIX);

var Cell = Class.create(Sprite, {
	name() { return "Cell"; },

    initialize(cx, cy, size){
        Sprite.call(this, size[0], size[1]);
        this._updateCellCoordinate(cx, cy);
        this.current = [null, null];
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
            if(vec[0] !== 0 && vec[1] !== 0){ throw new Error("Vector must point at next cell when continuous move."); }

            // var hasInput = vec[0] !== 0 || vec[1] !== 0;
            // if (this.current[0] === null && this.current[1] === null) {
            //     if (hasInput) {
            //         this.current = vec;
            //     } else {
            //         return;
            //     }
            // } else if ((vec[0] === -1 * this.current[0] || vec[1] === -1 * this.current[1]) && hasInput) {
            //     this.current = vec;
            // }

            // =*=*=*=*=*= TODO =*=*=*=*=*=
            // var isMove = this.current[0] !== null && this.current[1] !== null;
            // if((vec[0] !== 0 || vec[1] !== 0) && !isMove || (isMove && (vec[0] === -1 * this.current[0] || vec[1] === -1 * this.current[1]))){
            //     this.current = vec;
            // }else if(isMove){
            // }else{
            //     return;
            // }

            if((vec[0] !== 0 || vec[1] !== 0) && ((this.current[0] === null && this.current[1] === null) || (vec[0] === -1 * this.current[0] || vec[1] === -1 * this.current[1]))){
                this.current[0] = vec[0];
                this.current[1] = vec[1];
            }
            // console.log(cx, cy, vec, this.current);

            this.x += this.current[0];
            this.y += this.current[1];

            if(this.x % this.width === 0 && this.y % this.height === 0){
                this._updateCellCoordinate(this.x / this.width, this.y / this.height);
                const currentPrevious = [];
                currentPrevious[0] = this.current[0];
                currentPrevious[1] = this.current[1];
                this.current[0] = null;
                this.current[1] = null;
	        	return [[this.cx - currentPrevious[0], this.cy - currentPrevious[1]], [this.cx, this.cy]];
            } else {
	        	return [[this.cx, this.cy], [this.cx + this.current[0], this.cy + this.current[1]]];
            }
        }else{
            this._updateCellCoordinate(cx, cy);
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
	name() { return "Collider"; },

    initialize(cx, cy, size, collision){
        Cell.call(this, cx, cy, size);
        this.collision = collision;
        mapData.update([null, null], [cx, cy], this);
    },

    updateCoordinate(cx, cy, isContinuous){       // trueのところにfalseが入れない。
        if(this.isMoving() || (mapData.check([cx, cy]) && (cx !== this.cx || cy !== this.cy))){
            const moveCoords = Cell.prototype.updateCoordinate.call(this, cx, cy, isContinuous);
            if(!this.isMoving()){
                mapData.update(moveCoords[0], moveCoords[1], this);
            }
            return moveCoords;
        }
        return null;
    },

    remove(){
    	mapData.update([this.cx, this.cy], null, this);
    },
});

// [false, true]
var Tile = Class.create(Collider, {
	name() { return "Tile"; },

    initialize(cx, cy, size, image, frame, frameColliderAssign){
        Collider.call(this, cx, cy, size, frameColliderAssign[frame]);
        this.image = image;
        this.frame = frame;
        this.frameColliderAssign = frameColliderAssign;
    },
});

var Player = Class.create(Collider, {
	name() { return "Player"; },

    initialize(cx, cy, size, image, collision){
        Collider.call(this, cx, cy, size, collision);
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

    updateCoordinate(cx, cy){ // call in each frame
        var isContinuous =  Math.abs(this.cx - cx) + Math.abs(this.cy - cy) <= 1;
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
    }
});

var Bomb = Class.create(Collider, {
	name() { return "Bomb"; },

    initialize(cx, cy, size, image, collision, fireLength){
        Collider.call(this, cx, cy, size, collision);
        this.image = image;
        this.frame = 0;
        this.current = [null, null];
        this.cx = cx;
        this.cy = cy;
        this.size = size;
        this.fireLength = fireLength;
        this.finalizeCb = () => {};
    },

    finalize(cb){
    	this.finalizeCb = cb;
    },

    detonate(cb){
        setTimeout(() => {
        	this.finalizeCb();
        	this.flame(cb);
        	this.remove();
        }, 2 * 1000);
    },

    flame(cb){
    	cb(this.cx, this.cy);
        for(var i = 1; i <= this.fireLength; i++){
            [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach((dc) => {
            	if(mapData.check([this.cx + dc[0], this.cy + dc[1]])){
	                cb(this.cx + dc[0], this.cy + dc[1]);
            	}
            });
        }
    },
});

var Flame = Class.create(Collider, {
	name() { return "Flame"; },

    initialize(cx, cy, size, image){
        Collider.call(this, cx, cy, size, false);
        this.image = image;
        this.frame = 0;
        this.current = [null, null];
        this.cx = cx;
        this.cy = cy;
        this.size = size;
    },

    finalize(cb){
        setTimeout(() => {
        	cb();
        	this.remove();
        }, 1.2 * 1000);
    },
});
