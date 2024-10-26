const config = {
    type: Phaser.AUTO,
    width: 320,  // Ancho fijo más estrecho
    height: 600, // Alto fijo más largo para móviles
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
            debug: false
        }
    }
};

const game = new Phaser.Game(config);

// Ajustamos las dimensiones del laberinto para ser más vertical
const MAZE_WIDTH = 11;  // Más estrecho
const MAZE_HEIGHT = 21; // Más alto
let CELL_SIZE;
const PLAYER_SPEED = 160;

let maze;
let prize;
let player;
let walls;
let gameWon = false;

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

function init() {
    // Calcular el tamaño de celda basado en el área disponible
    const cellWidth = this.scale.width / MAZE_WIDTH;
    const cellHeight = this.scale.height / MAZE_HEIGHT;
    CELL_SIZE = Math.min(cellWidth, cellHeight);
}

function preload() {
    this.load.image('wall', 'public/MuROElectricidad.png');
    this.load.image('path', 'public/cuadrado.png');
    this.load.image('prize', 'public/premio.png');
    this.load.image('player', 'public/completo (1).png');
}

function create() {
    const mazePixelWidth = MAZE_WIDTH * CELL_SIZE;
    const mazePixelHeight = MAZE_HEIGHT * CELL_SIZE;
    
    const offsetX = (this.scale.width - mazePixelWidth) / 2;
    const offsetY = (this.scale.height - mazePixelHeight) / 2;

    // Dibujamos los caminos como base
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
                    offsetX + x * CELL_SIZE + CELL_SIZE/2,
                    offsetY + y * CELL_SIZE + CELL_SIZE/2,
                    'wall'
                );
                wall.setDisplaySize(CELL_SIZE, CELL_SIZE);
                wall.setImmovable(true);
                wall.body.setSize(CELL_SIZE, CELL_SIZE);
            }
        }
    }

    // Colocamos el premio en la parte inferior
    const prizeSize = CELL_SIZE * 0.8;
    prize = this.physics.add.sprite(
        offsetX + Math.floor(MAZE_WIDTH/2) * CELL_SIZE + CELL_SIZE/2,
        offsetY + (MAZE_HEIGHT - 1.5) * CELL_SIZE,
        'prize'
    )
    .setDisplaySize(prizeSize, prizeSize);
    prize.body.setSize(prizeSize, prizeSize);

    // Colocamos el jugador en la parte superior
    const playerSize = CELL_SIZE * 0.7;
    player = this.physics.add.sprite(
        offsetX + Math.floor(MAZE_WIDTH/2) * CELL_SIZE + CELL_SIZE/2,
        offsetY + CELL_SIZE + CELL_SIZE/2,
        'player'
    )
    .setDisplaySize(playerSize, playerSize);
    player.body.setSize(playerSize, playerSize);

    this.physics.add.collider(player, walls);
    this.physics.add.overlap(player, prize, collectPrize, null, this);

    const fontSize = Math.min(64, this.scale.width/10);
    this.winText = this.add.text(this.scale.width/2, this.scale.height/2, '¡GANASTE!', {
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

    if (this.input.activePointer.isDown) {
        const targetX = this.input.activePointer.x;
        const targetY = this.input.activePointer.y;

        const angle = Math.atan2(targetY - player.y, targetX - player.x);

        player.setVelocityX(Math.cos(angle) * PLAYER_SPEED);
        player.setVelocityY(Math.sin(angle) * PLAYER_SPEED);

        player.rotation = angle;
    } else if (this.input.activePointer.justUp) {
        player.setVelocity(0, 0);
    }
}

function collectPrize(player, prize) {
    prize.destroy();
    gameWon = true;
    this.winText.setVisible(true);
}