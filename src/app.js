/**
 * app.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */
import { WebGLRenderer, PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { GameScene } from 'scenes';
import DIRT from './textures/dirt.png';
import Player from './components/player.js';
import Map from './components/map.js';
import GrassTop from './textures/grass_block_top.png';

// const camera = new PerspectiveCamera();
const renderer = new WebGLRenderer({ antialias: true });
const player = new Player();
const map = new Map();

// Initialize core ThreeJS components
const scene = new GameScene(map);

console.log(map.chunks);

// Set up renderer, canvas, and minor CSS adjustments
renderer.setPixelRatio(window.devicePixelRatio);
const canvas = renderer.domElement;
canvas.style.display = 'block'; // Removes padding below canvas
document.body.style.margin = 0; // Removes margin around page
document.body.style.overflow = 'hidden'; // Fix scrolling
document.body.appendChild(canvas);

// Set up controls
document.addEventListener('click', function (event) {
    player.controller.lock();
    addCube = event.button == 2;
    removeCube = event.button == 0;
    console.log(event);
});

window.addEventListener('wheel', function (event) {
    if (event.deltaY > 0) {
        player.activeItem = (player.activeItem + 1) % 10;
    } else {
        player.activeItem = (player.activeItem - 1 + 10) % 10;
    }
    player.hotBar.forEach((frame, i) => {
        if (player.activeItem === i) {
            // console.log(frame, Player.unselectedBorder);
            frame.element.style.border = player.selectedBorder;
        } else {
            frame.element.style.border = player.unselectedBorder;
        }
    });
});

// keyboard stuff
let keyState = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    shift: false,
};

document.addEventListener('keydown', function (event) {
    switch (event.code) {
        case 'KeyW':
            keyState.w = true;
            break;
        case 'KeyA':
            keyState.a = true;
            break;
        case 'KeyS':
            keyState.s = true;
            break;
        case 'KeyD':
            keyState.d = true;
            break;
        case 'Space':
            keyState.space = true;
            break;
        case 'ShiftLeft':
            keyState.shift = true;
            break;
    }
});

document.addEventListener('keyup', function (event) {
    switch (event.code) {
        case 'KeyW':
            keyState.w = false;
            break;
        case 'KeyA':
            keyState.a = false;
            break;
        case 'KeyS':
            keyState.s = false;
            break;
        case 'KeyD':
            keyState.d = false;
            break;
        case 'Space':
            keyState.space = false;
            break;
        case 'ShiftLeft':
            keyState.shift = false;
            break;
    }
});

let prevTime = 1;
let dt = 0;

let reticle = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshPhongMaterial({ color: 0x00ff00, wireframe: true })
);

const raycaster = new THREE.Raycaster();
let addCube = false;
let removeCube = false;
// Render loop
const onAnimationFrameHandler = (timeStamp) => {
    dt = (timeStamp - prevTime) / 60;
    prevTime = timeStamp;

    scene.remove(reticle);

    // update the picking ray with the camera and pointer position
    raycaster.setFromCamera(new THREE.Vector2(), player.camera);

    // calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children);
    if (removeCube) {
        if (intersects.length > 0) {
            if (intersects[0].object.name != 'helper') {
                scene.remove(intersects[0].object);
                const blockPos = intersects[0].object.position;
                map.removeBlock(blockPos.x, blockPos.y, blockPos.z);
            }
        }
        removeCube = false;
    }

    if (intersects.length > 0 && intersects[0].distance < 10) {
        let cubePos = intersects[0].point;
        let toCamera = player.camera.position.clone().sub(cubePos);
        cubePos.add(toCamera.normalize().multiplyScalar(0.1));
        reticle.position.set(
            Math.floor(cubePos.x) + 0.5,
            Math.floor(cubePos.y) + 0.5,
            Math.floor(cubePos.z) + 0.5
        );
        scene.add(reticle);

        if (addCube) {
            let texture = new THREE.TextureLoader().load(
                player.hotBar[player.activeItem].texture
            );
            texture.magFilter = THREE.NearestFilter;
            let cubePreview = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 1),
                new THREE.MeshLambertMaterial({ map: texture })
                // new THREE.MeshPhongMaterial({ color: 0xff0000 })
            );
            cubePreview.position.set(
                Math.floor(cubePos.x) + 0.5,
                Math.floor(cubePos.y) + 0.5,
                Math.floor(cubePos.z) + 0.5
            );
            scene.add(cubePreview);
            map.addBlock(
                cubePreview.position.x,
                cubePreview.position.y,
                cubePreview.position.z
            );
        }
    }
    addCube = false;

    player.updateMovement(keyState, timeStamp, dt);
    player.updatePositions(0.3, 0.25);
    player.collide(map, timeStamp);
    scene.update(player);

    renderer.render(scene, player.camera);
    // scene.update && scene.update(timeStamp);
    window.requestAnimationFrame(onAnimationFrameHandler);
};
window.requestAnimationFrame(onAnimationFrameHandler);

// Resize Handler
const windowResizeHandler = () => {
    const { innerHeight, innerWidth } = window;
    renderer.setSize(innerWidth, innerHeight);
    player.camera.aspect = innerWidth / innerHeight;
    player.camera.updateProjectionMatrix();
};
windowResizeHandler();
window.addEventListener('resize', windowResizeHandler, false);
