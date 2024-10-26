import { Game as MainGame } from './scenes/Game';
import { AUTO, Game } from 'phaser';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 800,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

const MAZE_WIDTH = 21;
const MAZE_HEIGHT = 21;
const CELL_SIZE = 32;
const PLAYER_SPEED = 160;

let maze;
let prize;
let player;
let walls;
let gameWon = false;

function preload() {
    this.load.image('wall', 'MuROElectricidad.png');
    this.load.image('path', 'cuadrado.png');
    this.load.image('prize', 'premio.png');
    this.load.image('player', 'personaje.png');
}

function create() {
    // Primero dibujamos todos los caminos como base
    for (let y = 0; y < MAZE_HEIGHT; y++) {
        for (let x = 0; x < MAZE_WIDTH; x++) {
            this.add.image(x * CELL_SIZE, y * CELL_SIZE, 'path').setOrigin(0);
        }
    }
    
    walls = this.physics.add.staticGroup();
    
    maze = generateMazeWithExit(MAZE_WIDTH, MAZE_HEIGHT);
    drawMaze(this, maze);
    
    // Coloca el premio
    const prizeX = (MAZE_WIDTH - 2) * CELL_SIZE;
    const prizeY = (MAZE_HEIGHT - 2) * CELL_SIZE;
    prize = this.physics.add.sprite(prizeX + CELL_SIZE/2, prizeY + CELL_SIZE/2, 'prize')
        .setScale(0.8);
    
    // Coloca el personaje
    const playerX = CELL_SIZE + CELL_SIZE/2;
    const playerY = CELL_SIZE + CELL_SIZE/2;
    
    player = this.physics.add.sprite(playerX, playerY, 'player')
        .setScale(0.7);
    
    // Configurar colisiones
    this.physics.add.collider(player, walls);
    this.physics.add.overlap(player, prize, collectPrize, null, this);
    
    // Texto de victoria
    this.winText = this.add.text(400, 300, '¡GANASTE!', {
        fontSize: '64px',
        fill: '#fff',
        backgroundColor: '#000'
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setVisible(false);
}

function update() {
    if (gameWon) return;
    
    // Si se hace click
    if (this.input.activePointer.isDown) {
        // Calcular la dirección entre el jugador y el mouse
        const targetX = this.input.activePointer.x;
        const targetY = this.input.activePointer.y;
        
        // Vector de dirección
        const angle = Math.atan2(targetY - player.y, targetX - player.x);
        
        // Aplicar velocidad en la dirección calculada
        player.setVelocityX(Math.cos(angle) * PLAYER_SPEED);
        player.setVelocityY(Math.sin(angle) * PLAYER_SPEED);
        
        // Rotar el jugador hacia la dirección del movimiento
        player.rotation = angle;
    }
    // Cuando se suelta el click, el personaje se detiene
    else if (this.input.activePointer.justUp) {
        player.setVelocity(0, 0);
    }
}

function collectPrize(player, prize) {
    if (!gameWon) {
        prize.destroy();
        gameWon = true;
        this.winText.setVisible(true);
        player.setVelocity(0, 0);
    }
}

function drawMaze(scene, maze) {
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === 1) {
                const wall = walls.create(x * CELL_SIZE + CELL_SIZE/2, y * CELL_SIZE + CELL_SIZE/2, 'wall');
                wall.setImmovable(true);
            }
        }
    }
}

function generateMazeWithExit(width, height) {
    const maze = createEmptyMaze(width, height);

    const directions = [
        { x: 0, y: -2 },
        { x: 0, y: 2 },
        { x: -2, y: 0 },
        { x: 2, y: 0 }
    ];

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function dfs(x, y) {
        maze[y][x] = 0;
        shuffle(directions);

        for (const direction of directions) {
            const nx = x + direction.x;
            const ny = y + direction.y;

            if (ny > 0 && ny < height && nx > 0 && nx < width && maze[ny][nx] === 1) {
                maze[y + direction.y / 2][x + direction.x / 2] = 0;
                dfs(nx, ny);
            }
        }
    }

    dfs(1, 1);

    maze[1][1] = 0;
    maze[height - 2][width - 2] = 0;

    return maze;
}

function createEmptyMaze(width, height) {
    const maze = [];
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            row.push(1);
        }
        maze.push(row);
    }
    return maze;
}

const StartGame = (parent) => {
    return new Game({ ...config, parent });
}

export default StartGame;