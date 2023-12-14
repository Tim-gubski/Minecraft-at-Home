/**
 * app.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */
import * as THREE from 'three';
import { WebGLRenderer } from 'three';
import GameScene from './components/GameScene.js';
import Player from './components/player.js';
import Map from './components/map.js';

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
    if (player.controller.isLocked) {
        addCube = event.button == 2;
        removeCube = event.button == 0;
        console.log(event);
    } else {
        player.controller.lock();
    }
});

// update hotbar on scroll wheel
window.addEventListener('wheel', function (event) {
    if (event.deltaY < 0) {
        player.activeItem = (player.activeItem + 1) % 10;
    } else {
        player.activeItem = (player.activeItem - 1 + 10) % 10;
    }
    player.updateHotBar();
});

// movement stuff
let keyState = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    shift: false,
};

// keypresses for movement and hotbar switching
document.addEventListener('keydown', function (event) {
    console.log(event);
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
        case 'Digit1':
            player.activeItem = 9;
            break;
        case 'Digit2':
            player.activeItem = 8;
            break;
        case 'Digit3':
            player.activeItem = 7;
            break;
        case 'Digit4':
            player.activeItem = 6;
            break;
        case 'Digit5':
            player.activeItem = 5;
            break;
        case 'Digit6':
            player.activeItem = 4;
            break;
        case 'Digit7':
            player.activeItem = 3;
            break;
        case 'Digit8':
            player.activeItem = 2;
            break;
        case 'Digit9':
            player.activeItem = 1;
            break;
        case 'Digit0':
            player.activeItem = 0;
            break;
    }
    player.updateHotBar();
});

// turn off movement on keyup events
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

let reticle = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshPhongMaterial({ color: 0x00ff00, wireframe: true })
);
const raycaster = new THREE.Raycaster();
let addCube = false;
let removeCube = false;

// Render loop
const onAnimationFrameHandler = (timeStamp) => {
    scene.remove(reticle);

    // update the picking ray with the camera and pointer position
    raycaster.setFromCamera(new THREE.Vector2(), player.camera);

    // calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children);
    if (removeCube) {
        if (intersects.length > 0) {
            if (intersects[0].object.name != 'floor') {
                scene.remove(intersects[0].object);
                const blockPos = intersects[0].object.position;
                map.removeBlock(blockPos.x, blockPos.y, blockPos.z);
            } else {
                let instanceId = intersects[0].instanceId;
                let dissapear = new THREE.Matrix4();
                dissapear.set(0, -100, 0);
                let boxMatrix = new THREE.Matrix4();
                intersects[0].object.getMatrixAt(instanceId, boxMatrix);
                let boxPos = new THREE.Vector3().setFromMatrixPosition(
                    boxMatrix
                );
                map.removeBlock(
                    Math.floor(boxPos.x),
                    Math.floor(boxPos.y),
                    Math.floor(boxPos.z)
                );

                intersects[0].object.setMatrixAt(instanceId, dissapear);
                intersects[0].object.instanceMatrix.needsUpdate = true;
            }
        }
        removeCube = false;
    }

	// for building blocks
    if (intersects.length > 0 && intersects[0].distance < 10) {
		// add reticle display
        let cubePos = intersects[0].point;
        let toCamera = player.camera.position.clone().sub(cubePos);
        cubePos.add(toCamera.normalize().multiplyScalar(0.1));
        reticle.position.set(
            Math.floor(cubePos.x) + 0.5,
            Math.floor(cubePos.y) + 0.5,
            Math.floor(cubePos.z) + 0.5
        );
        scene.add(reticle);

		// add cube while building
        if (addCube) {
			// load correct texture
            let texture = new THREE.TextureLoader().load(
                player.hotBar[player.activeItem].texture
            );
            texture.magFilter = THREE.NearestFilter;
            let cubePreview = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 1),
                new THREE.MeshPhongMaterial({
                    map: texture,
                    emissive: player.hotBar[player.activeItem].isGlowing
                        ? 0xffe600
                        : 0x000000,
                    emissiveIntensity: 0.5,
                    emissiveMap: [
                        texture,
                        texture,
                        texture,
                        texture,
                        texture,
                        texture,
                    ],
                })
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

			// add lighting to blocks with light
            if (player.hotBar[player.activeItem].isGlowing) {
                let light = new THREE.PointLight(0xffffff, 1, 8);
                light.position.set(
                    cubePreview.position.x,
                    cubePreview.position.y,
                    cubePreview.position.z
                );
                scene.add(light);
            }
        }
    }
    addCube = false;

    player.updateMovement(keyState, timeStamp, 0.2);
    player.updatePositions(0.2, 0.5);
    player.collide(map, timeStamp);
    scene.update(player);

    renderer.render(scene, player.camera);

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
