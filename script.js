import * as THREE from 'https://unpkg.com/three@0.127.0/build/three.module.js';

let scene, camera, renderer, controls;
let textureLoader = new THREE.TextureLoader();
let blocks = [];
let selectedBlock = null;
let isInventoryOpen = false;
const textures = {
    stone: textureLoader.load('textures/stone.jpg'),
    mud: textureLoader.load('textures/mud.jpg'),
    wood: textureLoader.load('textures/wood.jpg'),
    grass: textureLoader.load('textures/grass.jpg')
};

init();
animate();

function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('world').appendChild(renderer.domElement);

    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshBasicMaterial({ map: textures.mud });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Add some initial blocks for visibility
    addBlock(0, 0.5, 0, 'stone');
    addBlock(1, 0.5, 0, 'wood');
    addBlock(-1, 0.5, 0, 'grass');

    // Inventory event listeners
    document.getElementById('stone').addEventListener('click', () => setSelectedBlock('stone'));
    document.getElementById('mud').addEventListener('click', () => setSelectedBlock('mud'));
    document.getElementById('wood').addEventListener('click', () => setSelectedBlock('wood'));
    document.getElementById('grass').addEventListener('click', () => setSelectedBlock('grass'));

    // Mouse event listeners
    window.addEventListener('mousedown', onDocumentMouseDown, false);
    window.addEventListener('mousemove', onDocumentMouseMove, false);
    window.addEventListener('wheel', onDocumentMouseWheel, false);
    window.addEventListener('resize', onWindowResize, false);
}

function animate() {
    requestAnimationFrame(animate);

    renderer.setScissorTest(true);

    // Left eye
    renderer.setScissor(0, 0, window.innerWidth / 2, window.innerHeight);
    renderer.setViewport(0, 0, window.innerWidth / 2, window.innerHeight);
    camera.setViewOffset(window.innerWidth, window.innerHeight, 0, 0, window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);

    // Right eye
    renderer.setScissor(window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
    renderer.setViewport(window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
    camera.setViewOffset(window.innerWidth, window.innerHeight, window.innerWidth / 2, 0, window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);

    renderer.setScissorTest(false);
}

function setSelectedBlock(type) {
    selectedBlock = type;
    isInventoryOpen = false;
    document.getElementById('inventory').style.display = 'none';
}

function addBlock(x, y, z, type) {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ map: textures[type] });
    const block = new THREE.Mesh(geometry, material);
    block.position.set(x, y, z);
    scene.add(block);
    blocks.push(block);
}

function onDocumentMouseDown(event) {
    event.preventDefault();

    if (event.button === 2) { // Right-click
        isInventoryOpen = !isInventoryOpen;
        document.getElementById('inventory').style.display = isInventoryOpen ? 'flex' : 'none';
    }

    if (event.button === 0 && selectedBlock) { // Left-click
        const intersects = getIntersects(event.clientX, event.clientY);
        if (intersects.length > 0) {
            const intersect = intersects[0];
            const pos = intersect.point.clone().add(intersect.face.normal);
            pos.divideScalar(1).floor().multiplyScalar(1).addScalar(0.5);
            addBlock(pos.x, pos.y, pos.z, selectedBlock);
        }
    }
}

function onDocumentMouseMove(event) {
    if (event.buttons === 1) { // Left mouse button is held down
        camera.rotation.y -= event.movementX * 0.002;
        camera.rotation.x -= event.movementY * 0.002;
    }
}

function onDocumentMouseWheel(event) {
    const delta = Math.sign(event.deltaY);
    camera.position.z += delta * 0.5;
}

function getIntersects(x, y) {
    const mouseVector = new THREE.Vector2();
    mouseVector.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouseVector, camera);
    return raycaster.intersectObjects(blocks.concat(scene.children));
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
