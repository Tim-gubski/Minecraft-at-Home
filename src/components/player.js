import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import dirt from '../textures/dirt.png';
import acacia_planks from '../textures/acacia_planks.png';
import oak_planks from '../textures/oak_planks.png';
import stone from '../textures/stone.png';
import dark_oak_planks from '../textures/dark_oak_planks.png';
import glowstone from '../textures/glowstone.png';
import cobblestone from '../textures/cobblestone.png';
import diamond_block from '../textures/diamond_block.png';
import stone_bricks from '../textures/stone_bricks.png';
import spruce_planks from '../textures/spruce_planks.png';

import crosshair_img from '../textures/crosshair.png';

class Player {
    // camera constants
    #FOV = 70;

    // hitbox/model constants
    #CAMERA_Y_OFFSET = 1.5;
    #WIDTH = 0.75;
    #HEIGHT = 2;
    #EPS = 0.01;
    #SIZE = new THREE.Vector3(this.#WIDTH, this.#HEIGHT, this.#WIDTH);

    // movement constants
    #MAX_SPEED = 0.7;
    #SHIFT_MOD = 2;
    #COYOTE_TIME = 150;
    #FORGIVENESS_TIME = 300;
    #MOMENTUM_DECAY = 0.5;

    // movement variables
    #jumpHeight = 0.8;
    #jumps = 1;
    #momentum = new THREE.Vector3();
    #lastGrounded = 0;
    #lastAttemptedJump = 0;
    #grounded = false;

    // hot bar variables
    imgSize = 70;
    unselectedBorder = '5px solid gray';
    selectedBorder = '5px solid white';
    borderWidth = 5;
    boxWidth = 80;

    // collision variables
    collisionRaycaster = new THREE.Raycaster();
    hitBox = new THREE.Box3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(this.#WIDTH, this.#HEIGHT, this.#WIDTH)
    );

    constructor() {
        // camera and controller
        this.camera = new THREE.PerspectiveCamera();
        this.camera.fov = this.#FOV;
        this.camera.position.set(5, 10, 5);
        this.camera.lookAt(new THREE.Vector3(0, 3, 0));

        this.prevPosition = this.camera.position.clone();

        this.controller = new PointerLockControls(this.camera);

        // hotbar
        let textures = [
            diamond_block,
            glowstone,
            dirt,
            stone_bricks,
            cobblestone,
            stone,
            dark_oak_planks,
            oak_planks,
            acacia_planks,
            spruce_planks,
        ];

		// fill out and style hotbar
        this.hotBar = [];
        this.activeItem = 9;
        for (let i = 0; i < 10; i++) {
            let frame = document.createElement('img');
            frame.src = textures[i % textures.length];
            frame.style.imageRendering = 'pixelated';
            frame.style.width = this.imgSize + 'px';
            frame.style.height = this.imgSize + 'px';
            if (this.activeItem == i) {
                frame.style.border = this.selectedBorder;
            } else {
                frame.style.border = this.unselectedBorder;
            }
            frame.style.position = 'absolute';
            frame.style.left = '50%';
            frame.style.transform = `translateX(${
                (5 - i) * this.boxWidth - this.boxWidth
            }px)`;
            frame.style.bottom = '0px';
            frame.style.zIndex = '100';
            this.hotBar.push({
                element: frame,
                texture: textures[i % textures.length],
                isGlowing: textures[i % textures.length] == glowstone,
            });
            document.body.append(frame);
        }

        // cross hair
        let crosshair = document.createElement('img');
        crosshair.src = crosshair_img;
        crosshair.style.width = '50px';
        crosshair.style.height = '50px';
        crosshair.style.position = 'absolute';
        crosshair.style.left = '50%';
        crosshair.style.transform = `translate(-25px,-25px)`;
        crosshair.style.top = '50%';
        crosshair.style.zIndex = '100';
        document.body.append(crosshair);

        return this;
    }

    updateHotBar() {
        this.hotBar.forEach((frame, i) => {
            if (this.activeItem === i) {
                // console.log(frame, Player.unselectedBorder);
                frame.element.style.border = this.selectedBorder;
            } else {
                frame.element.style.border = this.unselectedBorder;
            }
        });
    }

    updateMovement(moveKeys, currentT, deltaT) {
        // find current speed to move
        let modifiedSpeed = this.#MAX_SPEED;
        if (moveKeys.shift) modifiedSpeed = this.#MAX_SPEED * this.#SHIFT_MOD;
        if ((moveKeys.w || moveKeys.s) && (moveKeys.a || moveKeys.d)) {
            modifiedSpeed = modifiedSpeed / Math.sqrt(2);
        }

        this.#grounded = currentT - this.#lastGrounded <= this.#COYOTE_TIME;

        // decay speed (coasting effect)
        if (!this.#grounded) modifiedSpeed *= 0.25;
        this.#momentum.x -= this.#momentum.x * this.#MOMENTUM_DECAY * deltaT;
        this.#momentum.z -= this.#momentum.z * this.#MOMENTUM_DECAY * deltaT;

        // move according to input
        if (this.#grounded) {
            if (moveKeys.w) this.#momentum.x = modifiedSpeed;
            if (moveKeys.s) this.#momentum.x = -modifiedSpeed;
            if (moveKeys.d) this.#momentum.z = modifiedSpeed;
            if (moveKeys.a) this.#momentum.z = -modifiedSpeed;
        } else {
            if (moveKeys.w) this.#momentum.x += modifiedSpeed;
            if (moveKeys.s) this.#momentum.x += -modifiedSpeed;
            if (moveKeys.d) this.#momentum.z += modifiedSpeed;
            if (moveKeys.a) this.#momentum.z += -modifiedSpeed;
        }

        // jumping logic
        if (moveKeys.space && this.#jumps > 0) {
            this.#lastAttemptedJump = currentT;

            if (
                this.#grounded ||
                this.#lastAttemptedJump - this.#lastGrounded <=
                    this.#FORGIVENESS_TIME
            ) {
                this.#momentum.y += this.#jumpHeight;
                moveKeys.space = false;
                this.#jumps = 0;
            }
        }
    }

    updateHitBox() {
		// moves the hitbox to align with the camera position
        const hitBoxCenter = new THREE.Vector3(
            this.camera.position.x,
            this.camera.position.y - this.#HEIGHT + this.#CAMERA_Y_OFFSET,
            this.camera.position.z
        );
        this.hitBox.setFromCenterAndSize(hitBoxCenter, this.#SIZE);
    }

    updatePositions(deltaT, gravity) {
        if (this.controller.isLocked) {
            this.prevPosition = this.camera.position.clone();
            // update and apply gravity
            if (!this.#grounded) this.#momentum.y -= gravity * deltaT;
            this.camera.position.y += this.#momentum.y * deltaT;

            // apply other movements
            this.controller.moveForward(this.#momentum.x * deltaT);
            this.controller.moveRight(this.#momentum.z * deltaT);

            // move hitbox
            this.updateHitBox();
        }
    }

    collide(map, currentT) {
        let blocks;

		// find head position for map
        let playerPosFloored = new THREE.Vector3(
            Math.floor(this.camera.position.x),
            Math.floor(this.camera.position.y),
            Math.floor(this.camera.position.z)
        );
        let adjacentBlocks = [];

		// grab adjacent blocks for collisions
        for (let x = -1; x <= 1; x++) {
            for (let z = -1; z <= 1; z++) {
                let block = map.getBlockAt(
                    playerPosFloored.x + x,
                    playerPosFloored.y,
                    playerPosFloored.z + z
                );
                if (block != null) {
                    adjacentBlocks.push(block);
                }
            }
        }

		// handle player-block collisions
		for (let block of adjacentBlocks) {
            let collided =
                this.camera.position.x >
                    block.worldBox.min.x - this.#WIDTH / 2 &&
                this.camera.position.x <
                    block.worldBox.max.x + this.#WIDTH / 2 &&
                this.camera.position.z >
                    block.worldBox.min.z - this.#WIDTH / 2 &&
                this.camera.position.z <
                    block.worldBox.max.z + this.#WIDTH / 2 &&
                this.camera.position.y <
                    block.worldBox.max.y + this.#WIDTH / 2 &&
                this.camera.position.y > block.worldBox.min.y - this.#WIDTH / 2;

            if (collided) {
                let velocity = this.camera.position
                    .clone()
                    .sub(this.prevPosition);

				// undo player movement if in block
                if (Math.abs(velocity.x) > Math.abs(velocity.z)) {
                    this.camera.position.x -= velocity.x;
                    let stillColliding =
                        this.camera.position.x >
                            block.worldBox.min.x - this.#WIDTH / 2 &&
                        this.camera.position.x <
                            block.worldBox.max.x + this.#WIDTH / 2 &&
                        this.camera.position.z >
                            block.worldBox.min.z - this.#WIDTH / 2 &&
                        this.camera.position.z <
                            block.worldBox.max.z + this.#WIDTH / 2 &&
                        this.camera.position.y <
                            block.worldBox.max.y + this.#WIDTH / 2 &&
                        this.camera.position.y >
                            block.worldBox.min.y - this.#WIDTH / 2;

                    if (stillColliding) {
                        this.camera.position.z -= velocity.z;
                    }
                } else {
                    this.camera.position.z -= velocity.z;
                    let stillColliding =
                        this.camera.position.x >
                            block.worldBox.min.x - this.#WIDTH / 2 &&
                        this.camera.position.x <
                            block.worldBox.max.x + this.#WIDTH / 2 &&
                        this.camera.position.z >
                            block.worldBox.min.z - this.#WIDTH / 2 &&
                        this.camera.position.z <
                            block.worldBox.max.z + this.#WIDTH / 2 &&
                        this.camera.position.y <
                            block.worldBox.max.y + this.#WIDTH / 2 &&
                        this.camera.position.y >
                            block.worldBox.min.y - this.#WIDTH / 2;

                    if (stillColliding) {
                        this.camera.position.x -= velocity.x;
                    }
                }
            }
        }

        // floor collision (check corners of hitbox)
        const yfl = new THREE.Vector3(
            this.hitBox.min.x,
            this.hitBox.min.y - 0.25,
            this.hitBox.min.z
        );
        const yfr = new THREE.Vector3(
            this.hitBox.min.x,
            this.hitBox.min.y - 0.25,
            this.hitBox.max.z
        );
        const ybl = new THREE.Vector3(
            this.hitBox.max.x,
            this.hitBox.min.y - 0.25,
            this.hitBox.min.z
        );
        const ybr = new THREE.Vector3(
            this.hitBox.max.x,
            this.hitBox.min.y - 0.25,
            this.hitBox.max.z
        );
        blocks = [
            map.getBlockAt(yfl.x, yfl.y, yfl.z),
            map.getBlockAt(yfr.x, yfr.y, yfr.z),
            map.getBlockAt(ybl.x, ybl.y, ybl.z),
            map.getBlockAt(ybr.x, ybr.y, ybr.z),
        ];

        for (let block of blocks) {
            if (block == null) continue;
            if (
                this.camera.position.y - this.#CAMERA_Y_OFFSET <=
                block.localBox.max.y + this.#EPS
            ) {
                this.camera.position.y =
                    block.localBox.max.y + this.#CAMERA_Y_OFFSET + this.#EPS;
                this.#momentum.y = 0;
                this.#lastGrounded = currentT;
                this.#jumps = 1;
                break;
            }
        }

		// perform same collision logic as head but for bottom portion
        let playerFeetFloored = new THREE.Vector3(
            Math.floor(this.camera.position.x),
            Math.floor(this.camera.position.y - this.#CAMERA_Y_OFFSET),
            Math.floor(this.camera.position.z)
        );

        adjacentBlocks = [];

        for (let x = -1; x <= 1; x++) {
            for (let z = -1; z <= 1; z++) {
                let block = map.getBlockAt(
                    playerFeetFloored.x + x,
                    playerFeetFloored.y,
                    playerFeetFloored.z + z
                );
                if (block != null) {
                    adjacentBlocks.push(block);
                }
            }
        }

        for (let block of adjacentBlocks) {
            if (
                block.worldBox.max.y <
                this.camera.position.y - this.#CAMERA_Y_OFFSET
            )
                continue;
            let collided =
                this.camera.position.x >
                    block.worldBox.min.x - this.#WIDTH / 2 &&
                this.camera.position.x <
                    block.worldBox.max.x + this.#WIDTH / 2 &&
                this.camera.position.z >
                    block.worldBox.min.z - this.#WIDTH / 2 &&
                this.camera.position.z < block.worldBox.max.z + this.#WIDTH / 2;

            if (collided) {
                let velocity = this.camera.position
                    .clone()
                    .sub(this.prevPosition);

                if (Math.abs(velocity.x) > Math.abs(velocity.z)) {
                    this.camera.position.x -= velocity.x;
                    let stillColliding =
                        this.camera.position.x >
                            block.worldBox.min.x - this.#WIDTH / 2 &&
                        this.camera.position.x <
                            block.worldBox.max.x + this.#WIDTH / 2 &&
                        this.camera.position.z >
                            block.worldBox.min.z - this.#WIDTH / 2 &&
                        this.camera.position.z <
                            block.worldBox.max.z + this.#WIDTH / 2;

                    if (stillColliding) {
                        this.camera.position.z -= velocity.z;
                    }
                } else {
                    this.camera.position.z -= velocity.z;
                    let stillColliding =
                        this.camera.position.x >
                            block.worldBox.min.x - this.#WIDTH / 2 &&
                        this.camera.position.x <
                            block.worldBox.max.x + this.#WIDTH / 2 &&
                        this.camera.position.z >
                            block.worldBox.min.z - this.#WIDTH / 2 &&
                        this.camera.position.z <
                            block.worldBox.max.z + this.#WIDTH / 2;

                    if (stillColliding) {
                        this.camera.position.x -= velocity.x;
                    }
                }
            }
        }
    }
}

export default Player;
