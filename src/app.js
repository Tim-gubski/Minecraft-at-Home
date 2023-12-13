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

// Initialize core ThreeJS components
const scene = new GameScene();

const camera = new PerspectiveCamera();
const renderer = new WebGLRenderer({ antialias: true });

// Set up camera
camera.position.set(6, 3, -10);
camera.fov = 70;
camera.lookAt(new Vector3(0, 0, 0));

// Set up renderer, canvas, and minor CSS adjustments
renderer.setPixelRatio(window.devicePixelRatio);
const canvas = renderer.domElement;
canvas.style.display = 'block'; // Removes padding below canvas
document.body.style.margin = 0; // Removes margin around page
document.body.style.overflow = 'hidden'; // Fix scrolling
document.body.appendChild(canvas);

// let hotBar = [];
// for (let i = 0; i < 9; i++) {
//   let frame = document.createElement('div');

// Set up controls
var controls = new PointerLockControls(camera);

document.addEventListener('click', function (event) {
    controls.lock();
    addCube = event.button == 2;
    removeCube = event.button == 0;
    console.log(event);
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
            attemptJumpTime = prevTime;
            keyState.shift = false;
            break;
    }
});

function updateMovement(timeStamp) {
    let speed = MAX_SPEED;
    if (keyState.shift) {
        speed = MAX_SPEED * 1.5;
    }

    if ((keyState.w || keyState.s) && (keyState.a || keyState.d)) {
        speed = MAX_SPEED / Math.sqrt(2);
    }

    momentum.x -= momentumDecay * momentum.x * dt;
    momentum.y -= momentumDecay * momentum.y * dt;
    if (keyState.w) {
        momentum.x = speed;
    }
    if (keyState.s) {
        momentum.x = -speed;
    }
    if (keyState.d) {
        momentum.y = speed;
        // controls.moveRight(speed);
    }
    if (keyState.a) {
        momentum.y = -speed;
        // controls.moveRight(-speed);
    }
    if (
        (keyState.space && timeStamp - lastGrounded <= COYOTE_TIME) ||
        timeStamp - attemptJumpTime <= COYOTE_TIME
    ) {
        upwardVel += playerJumpHeight;
        keyState.space = false;
    }
}

// setup player movement stuff
const MAX_SPEED = 0.4;
let momentum = new THREE.Vector2();
const momentumDecay = 0.5;
const playerHeight = 2;
const playerJumpHeight = 0.6;
const gravity = 0.025;
const cameraYOffset = 0.75;
let lastGrounded = 0;
let attemptJumpTime = 0;
const COYOTE_TIME = 100;
let upwardVel = 0;
let prevTime = 0;
let dt = 0;

// player collision raycasters
const collisionRaycaster = new THREE.Raycaster();

const raycaster = new THREE.Raycaster();
let pointer = new THREE.Vector2();
pointer.x = 0;
pointer.y = 0;
let lastCube = null;
let addCube = false;
let removeCube = false;
// Render loop
const onAnimationFrameHandler = (timeStamp) => {
    dt = (timeStamp - prevTime) / 60;
    prevTime = timeStamp;

    if (lastCube) {
        scene.remove(lastCube);
    }

    // update the picking ray with the camera and pointer position
    raycaster.setFromCamera(pointer, camera);

    // calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children);
    // console.log(intersects);
    if (removeCube) {
        if (intersects.length > 0) {
            if (intersects[0].object.name != 'floor') {
                scene.remove(intersects[0].object);
            }
        }
        removeCube = false;
    }

    // console.log(intersects);
    let cubePreview;
    if (!addCube) {
        cubePreview = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshPhongMaterial({ color: 0x00ff00, wireframe: true })
        );
    } else {
        let texture = new THREE.TextureLoader().load(DIRT);
        texture.magFilter = THREE.NearestFilter;
        cubePreview = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshLambertMaterial({ map: texture })
            // new THREE.MeshPhongMaterial({ color: 0xff0000 })
        );
    }

    // for (let i = 0; i < intersects.length; i++) {
    if (intersects.length > 0) {
        let cubePos = intersects[0].point;
        let toCamera = camera.position.clone().sub(cubePos);
        cubePos.add(toCamera.normalize().multiplyScalar(0.1));
        cubePreview.position.set(
            Math.round(cubePos.x),
            Math.floor(cubePos.y) + 0.5,
            Math.round(cubePos.z)
        );

        scene.add(cubePreview);
        if (!addCube) {
            lastCube = cubePreview;
        } else {
            console.log(intersects);
            addCube = false;
        }
    }

    // update player movements
    updateMovement(timeStamp);
    upwardVel -= gravity;
    camera.position.y += upwardVel * dt;
    controls.moveForward(momentum.x * dt);
    controls.moveRight(momentum.y * dt);

    // collide player with scene
    const headBlock = camera.position.clone();
    const buttBlock = headBlock.clone();
    buttBlock.y -= 1;

    // collide floor
    collisionRaycaster.set(buttBlock, new THREE.Vector3(0, -1, 0));
    const botIntersects = collisionRaycaster.intersectObjects(scene.children);

    if (
        botIntersects.length > 0 &&
        camera.position.y - playerHeight + cameraYOffset <
            botIntersects[0].point.y + 0.5
    ) {
        camera.position.y =
            botIntersects[0].point.y + playerHeight - cameraYOffset + 0.5;
        upwardVel = 0;
        lastGrounded = timeStamp;
    }

    renderer.render(scene, camera);
    // scene.update && scene.update(timeStamp);
    window.requestAnimationFrame(onAnimationFrameHandler);
};
window.requestAnimationFrame(onAnimationFrameHandler);

// Resize Handler
const windowResizeHandler = () => {
    const { innerHeight, innerWidth } = window;
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
};
windowResizeHandler();
window.addEventListener('resize', windowResizeHandler, false);
