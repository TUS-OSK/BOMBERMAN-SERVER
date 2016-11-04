enchant();

const SIZE = [48, 48];
const MATRIX = [11, 11];

function startGame(){
    $(".root-wrap").html('');
    var game = new Core(SIZE[0] * MATRIX[0], SIZE[1] * MATRIX[1]);  // game display size
    game.fps = 60;                  // frame per second
    game.preload("images/player.png", "images/map.png", "images/bomb.png");
    var gameFlow = new GameFlow(game);
    game.onload = function(){
        game.keybind(" ".charCodeAt(0), "space");
        gameFlow.start();
    }
    game.start();
};

class GameFlow{
    constructor(game){
        this.game = game;
    }

    start(){
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
        var you = new Player(1, 1, SIZE, this.game.assets["images/player.png"], false);
        playScene.addChild(you);
        this.game.pushScene(playScene);
        playScene.addEventListener("enterframe", () => {
            var moveVector = [0, 0];
            if(this.game.input.space){
                playScene.addChild(new Bomb(you.cx, you.cy, SIZE, this.game.assets["images/bomb.png"], false, 1, playScene));
                console.log(you.cx, you.cy, "put a bomb");
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
        if(!(instance instanceof Collider)){ throw new Error("instance should be a sub class of Collision!"); }
        if(oldCoordinate[0] !== null && oldCoordinate[1] !== null){
            const index = this.map[oldCoordinate[0]][oldCoordinate[1]].indexOf(instance);
            this.map[oldCoordinate[0]][oldCoordinate[1]].splice(index, 1);
        }
        this.map[newCoordinate[0]][newCoordinate[1]].push(instance);
    }

    check(coordinate){
        if(coordinate[0] >= 0 && coordinate[0] <= this.matrix[0] - 1 && coordinate[1] <= this.matrix[1] - 1 && coordinate[1] >= 0){
            return !this.map[coordinate[0]][coordinate[1]].some((instance) => instance.collision);
        }else{
            return false;
        }
    }
}

const mapData = new MapData(MATRIX);

var Cell = Class.create(Sprite, {
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
                this.current = vec;
            }
            // console.log(cx, cy, vec, this.current);

            this.x += this.current[0];
            this.y += this.current[1];

            if(this.x % this.width === 0 && this.y % this.height === 0){
                this._updateCellCoordinate(this.x / this.width, this.y / this.height);
                this.current = [null, null];
            }
        }else{
            this._updateCellCoordinate(cx, cy);
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
    initialize(cx, cy, size, collision){
        Cell.call(this, cx, cy, size);
        this.collision = collision;
        mapData.update([null, null], [cx, cy], this);
    },

    updateCoordinate(cx, cy, isContinuous){       // trueのところにfalseが入れない。
        if(this.isMoving() || mapData.check([cx, cy])){
            Cell.prototype.updateCoordinate.call(this, cx, cy, isContinuous);
            if(!this.isMoving()){
                mapData.update([this.cx, this.cy], [cx, cy], this);
            }
        }
    },
});

// [false, true]
var Tile = Class.create(Collider, {
    initialize(cx, cy, size, image, frame, frameColliderAssign){
        Collider.call(this, cx, cy, size, frameColliderAssign[frame]);
        this.image = image;
        this.frame = frame;
        this.frameColliderAssign = frameColliderAssign;
    },
});

var Player = Class.create(Collider, {
    initialize(cx, cy, size, image, collision){
        Collider.call(this, cx, cy, size, collision);
        this.image = image;
        this.frame = 0;
        this.current = [null, null];
    },

    updateCoordinate(cx, cy){
        Collider.prototype.updateCoordinate.call(this, cx, cy, true);
    },

    die(){

    },
});

var Bomb = Class.create(Collider, {
    initialize(cx, cy, size, image, collision, fireLength, scene){
        Collider.call(this, cx, cy, size, collision);
        this.image = image;
        this.putTime = +new Date();
        this.frame = 0;
        this.current = [null, null];
        this.scene = scene;
        this.cx = cx;
        this.cy = cy;
        this.size = size;

        setTimeout(() => {
            this.explose(fireLength);
        }, 2 * 1000);
    },

    explose(fireLength){
        this.scene.addChild(this.flame(fireLength));
        setTimeout(() => {
            this.scene.removeChild(this);

        }, 1.2 * 1000);
    },

    flame(fireLength){

        this.frame = 1;
        for(var i = 1; i <= fireLength; i++){
            if(Collider.prototype.canFlame.call(this, this.cx + 1, this.cy)){
                Collider.call(this, this.cx + 1, this.cy, this.size, false);
            }
            if(Collider.prototype.canFlame.call(this, this.cx, this.cy + 1)){
                Collider.call(this, this.cx, this.cy + 1, this.size, false);
            }
            if(Collider.prototype.canFlame.call(this, this.cx - 1, this.cy)){
                Collider.call(this, this.cx - 1, this.cy, this.size, false);
            }
            if(Collider.prototype.canFlame.call(this, this.cx, this.cy - 1)){
                Collider.call(this, this.cx, this.cy - 1, this.size, false);
            }
        }
    },
});
