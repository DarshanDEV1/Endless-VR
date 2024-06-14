import * as THREE from 'https://unpkg.com/three@0.127.0/build/three.module.js';

let scene, cameraLeft, cameraRight, renderer, dino, ground, obstacles = [];
let isJumping = false, isFalling = false, isGameOver = false, speed = 0.1;
let health = 100, score = 0, highScore = 0;
const gravity = 0.03, jumpSpeed = 0.2, obstacleSpeed = 0.1, obstacleFrequency = 100;
let frameCount = 0;
const healthBar = document.getElementById('healthBar');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');
const gameOverMenu = document.getElementById('gameOverMenu');
const currentScoreDisplay = document.getElementById('currentScore');
const lastScoreDisplay = document.getElementById('lastScore');
const retryButton = document.getElementById('retryButton');

const textureLoader = new THREE.TextureLoader();
const textures = {
    mud: textureLoader.load('textures/mud.jpg'),
    stone: textureLoader.load('textures/stone.jpg'),
    grass: textureLoader.load('textures/grass.jpg'),
    wood: textureLoader.load('textures/wood.jpg')
};

init();
animate();

function init() {
    scene = new THREE.Scene();

    // Create left eye camera
    cameraLeft = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraLeft.position.set(1, 2, 5);
    cameraLeft.lookAt(0, 0, 0);

    // Create right eye camera
    cameraRight = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRight.position.set(-1, 2, 5);
    cameraRight.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(200, 10);
    const groundMaterial = new THREE.MeshBasicMaterial({ map: textures.grass });
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Create dino
    const dinoGeometry = new THREE.BoxGeometry(1, 1, 2);
    const dinoMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    dino = new THREE.Mesh(dinoGeometry, dinoMaterial);
    dino.position.set(0, 0.5, 0);
    scene.add(dino);

    // Load high score from local storage
    highScore = localStorage.getItem('highScore') || 0;
    highScoreDisplay.innerText = `High Score: ${highScore}`;

    // Event listeners
    window.addEventListener('click', onDocumentClick, false);
    window.addEventListener('resize', onWindowResize, false);
    retryButton.addEventListener('click', retryGame);

    // Add initial obstacles
    addObstacle();
}

function animate() {
    if (isGameOver) return;

    requestAnimationFrame(animate);

    // Dino jump logic
    if (isJumping) {
        dino.position.y += jumpSpeed;
        if (dino.position.y >= 2) {
            isJumping = false;
            isFalling = true;
        }
    } else if (isFalling) {
        dino.position.y -= gravity;
        if (dino.position.y <= 0.5) {
            dino.position.y = 0.5;
            isFalling = false;
        }
    }

    // Move obstacles
    obstacles.forEach(obstacle => {
        obstacle.position.z += obstacleSpeed;
    });

    // Add new obstacles and remove old ones
    if (frameCount % obstacleFrequency === 0) {
        addObstacle();
    }

    if (obstacles.length > 0 && obstacles[0].position.z > 10) {
        scene.remove(obstacles.shift());
    }

    // Collision detection
    obstacles.forEach(obstacle => {
        if (dino.position.distanceTo(obstacle.position) < 1) {
            health -= 10;
            healthBar.style.width = `${health}%`;
            if (health <= 0) {
                endGame();
            }
        }
    });

    // Update score
    score++;
    scoreDisplay.innerText = `Score: ${score}`;

    // Render left eye view
    renderer.setViewport(0, 0, window.innerWidth / 2, window.innerHeight);
    renderer.setScissor(0, 0, window.innerWidth / 2, window.innerHeight);
    renderer.setScissorTest(true);
    renderer.render(scene, cameraLeft);

    // Render right eye view
    renderer.setViewport(window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
    renderer.setScissor(window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
    renderer.render(scene, cameraRight);

    renderer.setScissorTest(false);

    frameCount++;
}

function onDocumentClick(event) {
    if (!isJumping && !isFalling) {
        isJumping = true;
    }
}

function addObstacle() {
    const obstacleGeometry = new THREE.BoxGeometry(1, 1, 1);
    const obstacleMaterial = new THREE.MeshBasicMaterial({ map: textures.stone });
    const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obstacle.position.set(Math.random() * 4 - 2, 0.5, -20);
    obstacles.push(obstacle);
    scene.add(obstacle);
}

function onWindowResize() {
    cameraLeft.aspect = window.innerWidth / window.innerHeight;
    cameraLeft.updateProjectionMatrix();
    cameraRight.aspect = window.innerWidth / window.innerHeight;
    cameraRight.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function endGame() {
    isGameOver = true;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }

    currentScoreDisplay.innerText = `Current Score: ${score}`;
    lastScoreDisplay.innerText = `Last Score: ${score}`;
    highScoreDisplay.innerText = `High Score: ${highScore}`;
    gameOverMenu.style.display = 'block';
}

function retryGame() {
    // Reset game state
    isGameOver = false;
    health = 100;
    score = 0;
    healthBar.style.width = '100%';
    obstacles.forEach(obstacle => scene.remove(obstacle));
    obstacles = [];
    dino.position.set(0, 0.5, 0);
    frameCount = 0;
    gameOverMenu.style.display = 'none';
    animate();
}
