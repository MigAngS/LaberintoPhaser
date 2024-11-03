const config = {
    type: Phaser.AUTO,
    width: 320,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update,
        init: init
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: 'game',
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: true
        }
    }
};

const game = new Phaser.Game(config);

const MAZE_WIDTH = 11;
const MAZE_HEIGHT = 21;
let CELL_SIZE;
const PLAYER_SPEED = 160;

let maze;
let prize;
let player;
let walls;
let gameWon = false;
let playerDirection = 'down'; // Nueva variable para tracking de dirección

function init() {
    const cellWidth = this.scale.width / MAZE_WIDTH;
    const cellHeight = this.scale.height / MAZE_HEIGHT;
    CELL_SIZE = Math.min(cellWidth, cellHeight);
}

function preload() {
    this.load.image('wall', 'public/MuROElectricidad.png');
    this.load.image('path', 'public/cuadrado.png');
    this.load.image('prize', 'public/premio.png');
    // Carga de spritesheet para el personaje
    // Asume que tienes un spritesheet con este formato:
    this.load.spritesheet('player', 'public/peruano.png', {
        frameWidth: 64, // Ajusta según el tamaño de tus sprites
        frameHeight: 64
    });
}

function create() {
    const mazePixelWidth = MAZE_WIDTH * CELL_SIZE;
    const mazePixelHeight = MAZE_HEIGHT * CELL_SIZE;

    const offsetX = (this.scale.width - mazePixelWidth) / 2;
    const offsetY = (this.scale.height - mazePixelHeight) / 2;

    // Configuración de animaciones
    this.anims.create({
        key: 'walk-down',
        frames: this.anims.generateFrameNumbers('player', { start: 7, end: 9 }),
        frameRate: 8,
        repeat: -1
    });

    this.anims.create({
        key: 'walk-left',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
    });

    this.anims.create({
        key: 'walk-right',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
    });

    this.anims.create({
        key: 'walk-up',
        frames: this.anims.generateFrameNumbers('player', { start: 4, end: 6 }),
        frameRate: 8,
        repeat: -1
    });

    // Animaciones idle (frame único para cada dirección)
    this.anims.create({
        key: 'idle-down',
        frames: [{ key: 'player', frame: 8 }],
        frameRate: 1
    });

    this.anims.create({
        key: 'idle-left',
        frames: [{ key: 'player', frame: 8 }],
        frameRate: 1
    });

    this.anims.create({
        key: 'idle-right',
        frames: [{ key: 'player', frame: 8 }],
        frameRate: 1
    });

    this.anims.create({
        key: 'idle-up',
        frames: [{ key: 'player', frame: 8 }],
        frameRate: 1
    });

    // Dibujamos los caminos
    for (let y = 0; y < MAZE_HEIGHT; y++) {
        for (let x = 0; x < MAZE_WIDTH; x++) {
            this.add.image(
                offsetX + x * CELL_SIZE,
                offsetY + y * CELL_SIZE,
                'path'
            )
                .setOrigin(0)
                .setDisplaySize(CELL_SIZE, CELL_SIZE);
        }
    }

    walls = this.physics.add.staticGroup();
    maze = generateMazeWithExit(MAZE_WIDTH, MAZE_HEIGHT);

    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === 1) {
                const wall = walls.create(
                    offsetX + x * CELL_SIZE + CELL_SIZE / 2,
                    offsetY + y * CELL_SIZE + CELL_SIZE / 2,
                    'wall'
                );
                wall.setDisplaySize(CELL_SIZE, CELL_SIZE);
                wall.setImmovable(true);
                wall.body.setSize(CELL_SIZE, CELL_SIZE);
            }
        }
    }

    // Premio
    const prizeSize = CELL_SIZE * 1.0;
    prize = this.physics.add.sprite(
        offsetX + Math.floor(MAZE_WIDTH / 2) * CELL_SIZE + CELL_SIZE / 2,
        offsetY + (MAZE_HEIGHT - 1.5) * CELL_SIZE,
        'prize'
    )
        .setDisplaySize(prizeSize, prizeSize);
    prize.body.setSize(prizeSize, prizeSize);

    // Jugador
    const playerSize = CELL_SIZE * 1.0; // Tamaño visual del jugador
    player = this.physics.add.sprite(
        offsetX + Math.floor(MAZE_WIDTH / 2) * CELL_SIZE + CELL_SIZE / 2,
        offsetY + CELL_SIZE + CELL_SIZE / 2,
        'player'
    )
        .setDisplaySize(playerSize, playerSize); // Usar el tamaño ajustado
    player.body.setSize(playerSize, playerSize);
    player.play('idle-down');

    this.physics.add.collider(player, walls);
    this.physics.add.overlap(player, prize, collectPrize, null, this);

    const fontSize = Math.min(64, this.scale.width / 10);
    this.winText = this.add.text(this.scale.width / 2, this.scale.height / 2, '¡GANASTE!', {
        fontSize: `${fontSize}px`,
        fill: '#fff',
        backgroundColor: '#000',
        padding: { x: 20, y: 10 }
    })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setVisible(false);
}

function update() {
    if (gameWon) return;

    // Verificamos si el botón del mouse está presionado
    if (this.input.activePointer.isDown) {
        const targetX = this.input.activePointer.x;
        const targetY = this.input.activePointer.y;

        // Calcular dirección del movimiento
        const angleRad = Math.atan2(targetY - player.y, targetX - player.x);
        const angleDeg = (angleRad * 180 / Math.PI + 360) % 360;

        // Determinar dirección basada en el ángulo
        let newDirection;
        if (angleDeg >= 315 || angleDeg < 45) {
            newDirection = 'right';
        } else if (angleDeg >= 45 && angleDeg < 135) {
            newDirection = 'down';
        } else if (angleDeg >= 135 && angleDeg < 225) {
            newDirection = 'left';
        } else {
            newDirection = 'up';
        }

        // Actualizar animación si la dirección cambió
        if (newDirection !== playerDirection) {
            playerDirection = newDirection;
            player.play(`walk-${playerDirection}`);
        }

        // Establecer velocidad
        player.setVelocityX(Math.cos(angleRad) * PLAYER_SPEED);
        player.setVelocityY(Math.sin(angleRad) * PLAYER_SPEED);

        // Voltear el sprite según la dirección
        player.flipX = newDirection === 'left'; // Voltea si va a la izquierda
    } else {
        // Detener al jugador y mostrar el frame específico según la dirección
        player.setVelocity(0, 0);
        player.play(`idle-${playerDirection}`); // Mostrar animación idle según la dirección
        player.flipX = playerDirection === 'left'; // Voltear si está en idle hacia la izquierda
    }
}

function collectPrize(player, prize) {
    prize.destroy();
    gameWon = true;
    this.winText.setVisible(true);
}

function generateMazeWithExit(width, height) {
    let maze = Array(height).fill().map(() => Array(width).fill(1));

    const isInBounds = (x, y) => x > 0 && x < width - 1 && y > 0 && y < height - 1;

    const getUnvisitedNeighbors = (x, y) => {
        const neighbors = [
            [x, y - 2], // arriba
            [x + 2, y], // derecha
            [x, y + 2], // abajo
            [x - 2, y]  // izquierda
        ];
        return neighbors.filter(([nx, ny]) =>
            isInBounds(nx, ny) && maze[ny][nx] === 1
        );
    };

    const startX = 1;
    const startY = 1;
    maze[startY][startX] = 0;

    const stack = [[startX, startY]];

    while (stack.length > 0) {
        const [currentX, currentY] = stack[stack.length - 1];
        const neighbors = getUnvisitedNeighbors(currentX, currentY);

        if (neighbors.length > 0) {
            const [nextX, nextY] = neighbors[Math.floor(Math.random() * neighbors.length)];
            maze[nextY][nextX] = 0;
            maze[(currentY + nextY) / 2][(currentX + nextX) / 2] = 0;
            stack.push([nextX, nextY]);
        } else {
            stack.pop();
        }
    }



    return maze;
}