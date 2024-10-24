const config = {
    type: Phaser.AUTO,
    width: 360,
    height: 640,
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    }
};

const game = new Phaser.Game(config);

let player;
let walls;
let prize;
let cursors;
let tileSize = 32;
let isMoving = false;
let moveDirection = { x: 0, y: 0 };
let timerText;
let timeLeft = 60; // 60 segundos para completar el laberinto
let timerEvent;
let restartButton;
let gameOver = false;

const maze = [
    [1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,1],
    [1,0,1,1,1,0,1,0,1,1],
    [1,0,0,0,1,0,0,0,0,1],
    [1,1,1,0,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,1,0,1],
    [1,1,1,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1]
    
];

function preload() {
    this.load.image('player', 'img/player.png');
    this.load.image('wall', 'img/wall.png');
    this.load.image('prize', 'img/prize.png');
    this.load.image('floor', 'img/floor.png');
}

function create() {
    console.log(maze);
    tileSize = Math.min(this.sys.game.config.width / maze[0].length, this.sys.game.config.height / maze.length);

    createMazeElements(this);
    
    // Configurar controles
    cursors = this.input.keyboard.createCursorKeys();
    
    // Configurar controles táctiles
    this.input.on('pointerdown', handlePointerDown, this);
    this.input.on('pointermove', handlePointerMove, this);
    this.input.on('pointerup', handlePointerUp, this);

    // Añadir temporizador
    timerText = this.add.text(10, 10, 'Tiempo: 60', { fontSize: '20px', fill: '#fff', stroke: '#000', strokeThickness: 2 });
    timerEvent = this.time.addEvent({ delay: 1000, callback: updateTimer, callbackScope: this, loop: true });

    // Añadir botón de reinicio
    restartButton = this.add.text(this.sys.game.config.width - 10, 10, 'Reiniciar', { fontSize: '20px', fill: '#fff', stroke: '#000', strokeThickness: 2 })
        .setOrigin(1, 0)
        .setInteractive()
        .on('pointerdown', restartGame, this);
}

function update() {
    if (gameOver) return;

    // Movimiento del jugador
    if (cursors.left.isDown || moveDirection.x < 0) {
        player.setVelocityX(-160);
    } else if (cursors.right.isDown || moveDirection.x > 0) {
        player.setVelocityX(160);
    } else {
        player.setVelocityX(0);
    }

    if (cursors.up.isDown || moveDirection.y < 0) {
        player.setVelocityY(-160);
    } else if (cursors.down.isDown || moveDirection.y > 0) {
        player.setVelocityY(160);
    } else {
        player.setVelocityY(0);
    }

    // Comprobar si el jugador ha alcanzado el premio
    if (Phaser.Geom.Intersects.RectangleToRectangle(player.getBounds(), prize.getBounds())) {
        gameOver = true;
        this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, '¡Ganaste!', { fontSize: '32px', fill: '#fff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
        this.physics.pause();
        timerEvent.remove();
    }
}

function createMazeElements(scene) {
    // Crear suelo
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            let floor = scene.add.image(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, 'floor');
            floor.setDisplaySize(tileSize, tileSize);
        }
    }

    // Crear paredes
    walls = scene.physics.add.staticGroup();
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === 1) {
                let wall = walls.create(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, 'wall');
                wall.setDisplaySize(tileSize, tileSize);
                wall.refreshBody();
            }
        }
    }

    // Crear jugador en la esquina superior izquierda
    player = scene.physics.add.sprite(tileSize * 1.5, tileSize * 1.5, 'player');
    player.setCollideWorldBounds(true);
    player.setDisplaySize(tileSize * 0.8, tileSize * 0.8);
    player.body.setSize(player.displayWidth * 0.8, player.displayHeight * 0.8);

    // Crear premio
    let prizePosition = findEmptyPosition();
    prize = scene.physics.add.sprite(prizePosition.x * tileSize + tileSize / 2, prizePosition.y * tileSize + tileSize / 2, 'prize');
    prize.setDisplaySize(tileSize * 0.8, tileSize * 0.8);

    // Configurar colisiones
    scene.physics.add.collider(player, walls);
}

function findEmptyPosition() {
    let emptyPositions = [];
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === 0 && !(x === 1 && y === 1)) {
                emptyPositions.push({x, y});
            }
        }
    }
    return emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
}

function handlePointerDown(pointer) {
    isMoving = true;
    handlePointerMove(pointer);
}

function handlePointerMove(pointer) {
    if (isMoving) {
        const dx = pointer.x - player.x;
        const dy = pointer.y - player.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            moveDirection.x = Math.sign(dx);
            moveDirection.y = 0;
        } else {
            moveDirection.x = 0;
            moveDirection.y = Math.sign(dy);
        }
    }
}

function handlePointerUp() {
    isMoving = false;
    moveDirection.x = 0;
    moveDirection.y = 0;
}

function updateTimer() {
    if (timeLeft > 0) {
        timeLeft--;
        timerText.setText('Tiempo: ' + timeLeft);
    } else {
        gameOver = true;
        this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, '¡Tiempo agotado!', { fontSize: '32px', fill: '#fff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
        this.physics.pause();
        timerEvent.remove();
    }
}

function restartGame() {
    gameOver = false;
    timeLeft = 60;
    this.scene.restart();
}