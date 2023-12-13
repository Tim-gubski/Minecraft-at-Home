import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import dirt from '../textures/dirt.png';
import acacia_planks from '../textures/acacia_planks.png';
import oak_planks from '../textures/oak_planks.png';
import stone from '../textures/stone.png';
import dark_oak_planks from '../textures/dark_oak_planks.png';
import cobblestone from '../textures/cobblestone.png';
import crosshair_img from '../textures/crosshair.png';

class Player {
    // camera constants
    #FOV = 70;

    // hitbox/model constants
    #CAMERA_Y_OFFSET = 1.5;
    #WIDTH = 0.75;
    #HEIGHT = 2;
    #EPS = 0.075;
    #SIZE = new THREE.Vector3(this.#WIDTH, this.#HEIGHT, this.#WIDTH);

    // movement constants
    #MAX_SPEED = 0.4;
    #COYOTE_TIME = 5;
    #MOMENTUM_DECAY = 0.5;

    // movement variables
    #jumpHeight = 1.1;
    #momentum = new THREE.Vector3();
    #lastGrounded = 0;
    #lastAttemptedJump = 0;
    #grounded = false;

    // hot bar variables
    imgSize = 50;
    unselectedBorder = '5px solid gray';
    selectedBorder = '5px solid white';
    borderWidth = 5;
    boxWidth = 60;

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
        this.camera.position.set(5, 3, 5);
        this.camera.lookAt(new THREE.Vector3(0, 3, 0));

        this.controller = new PointerLockControls(this.camera);

        // hotbar
        let textures = [
            dirt,
            acacia_planks,
            oak_planks,
            stone,
            dark_oak_planks,
            cobblestone,
        ];

        this.hotBar = [];
        this.activeItem = 9;
        for (let i = 0; i < 10; i++) {
            let frame = document.createElement('img');
            frame.src = textures[i % textures.length];
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
        // crosshair.style.transform = `translateY(-25px)`;
        crosshair.style.top = '50%';
        crosshair.style.zIndex = '100';
        document.body.append(crosshair);

        return this;
    }

    updateMovement(moveKeys, currentT, deltaT) {
        // find current speed to move
        let modifiedSpeed = this.#MAX_SPEED;
        if (moveKeys.shift) modifiedSpeed *= 0.5;
        if ((moveKeys.w || moveKeys.s) && (moveKeys.a || moveKeys.d)) {
            modifiedSpeed = modifiedSpeed / Math.sqrt(2);
        }

        // decay speed (coasting effect)
        this.#grounded = currentT - this.#lastGrounded <= this.#COYOTE_TIME;

        if (this.#grounded) modifiedSpeed *= 0.5;
        this.#momentum.x -= this.#momentum.x * this.#MOMENTUM_DECAY * deltaT;
        this.#momentum.z -= this.#momentum.z * this.#MOMENTUM_DECAY * deltaT;

        // move according to input
        if (moveKeys.w) this.#momentum.x = modifiedSpeed;
        if (moveKeys.s) this.#momentum.x = -modifiedSpeed;
        if (moveKeys.d) this.#momentum.z = modifiedSpeed;
        if (moveKeys.a) this.#momentum.z = -modifiedSpeed;

        // jupming logic
        if (
            (moveKeys.space && this.#grounded <= this.#COYOTE_TIME) ||
            currentT - this.#lastAttemptedJump <= this.#COYOTE_TIME
        ) {
            this.#momentum.y += this.#jumpHeight;
            moveKeys.space = false;
        }
    }

    updateHitBox() {
        const hitBoxCenter = new THREE.Vector3(
            this.camera.position.x,
            this.camera.position.y - this.#HEIGHT + this.#CAMERA_Y_OFFSET,
            this.camera.position.z
        );
        this.hitBox.setFromCenterAndSize(hitBoxCenter, this.#SIZE);
    }

    updatePositions(deltaT, gravity) {
        if (this.controller.isLocked) {
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
        let collided = [];

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
            if (this.hitBox.min.y <= block.max.y + this.#EPS) {
                const diff = block.max.y - this.hitBox.min.y;
                this.camera.position.y += diff + this.#EPS;
                this.#momentum.y = 0;
                this.#lastGrounded = currentT;
                this.updateHitBox();
                break;
            }
        }

        // x collisions
        const xfl = new THREE.Vector3(
            this.hitBox.max.x + 0.25,
            this.hitBox.min.y,
            this.hitBox.min.z
        );
        const xfr = new THREE.Vector3(
            this.hitBox.max.x + 0.25,
            this.hitBox.min.y,
            this.hitBox.max.z
        );

        blocks = [
            map.getBlockAt(xfl.x, xfl.y, xfl.z),
            map.getBlockAt(xfr.x, xfr.y, xfr.z),
        ];

        for (let block of blocks) {
            if (block == null || collided.includes(block.id)) continue;
            if (this.hitBox.max.x >= block.min.x + this.#EPS) {
                const diff = block.min.x - this.hitBox.max.x;
                this.camera.position.x += diff + this.#EPS;
                this.updateHitBox();
                collided.push(block.id);
                break;
            }
        }

        const xbl = new THREE.Vector3(
            this.hitBox.min.x - 0.25,
            this.hitBox.min.y,
            this.hitBox.min.z
        );
        const xbr = new THREE.Vector3(
            this.hitBox.min.x - 0.25,
            this.hitBox.min.y,
            this.hitBox.max.z
        );

        blocks = [
            map.getBlockAt(xbl.x, xbl.y, xbl.z),
            map.getBlockAt(xbr.x, xbr.y, xbr.z),
        ];

        for (let block of blocks) {
            if (block == null || collided.includes(block.id)) continue;
            if (this.hitBox.min.x <= block.max.x - this.#EPS) {
                const diff = block.max.x - this.hitBox.min.x;
                this.camera.position.x += diff - this.#EPS;
                this.updateHitBox();
                collided.push(block.id);
                break;
            }
        }

        // z collisions
        const zfl = new THREE.Vector3(
            this.hitBox.min.x,
            this.hitBox.min.y,
            this.hitBox.max.z + 0.25
        );
        const zfr = new THREE.Vector3(
            this.hitBox.max.x,
            this.hitBox.min.y,
            this.hitBox.max.z + 0.25
        );

        blocks = [
            map.getBlockAt(zfl.x, zfl.y, zfl.z),
            map.getBlockAt(zfr.x, zfr.y, zfr.z),
        ];

        for (let block of blocks) {
            if (block == null || collided.includes(block.id)) continue;
            if (this.hitBox.max.z >= block.min.z + this.#EPS) {
                const diff = block.min.z - this.hitBox.max.z;
                this.camera.position.z += diff + this.#EPS;
                this.updateHitBox();
                collided.push(block.id);
                break;
            }
        }

        const zbl = new THREE.Vector3(
            this.hitBox.min.x,
            this.hitBox.min.y,
            this.hitBox.min.z - 0.25
        );
        const zbr = new THREE.Vector3(
            this.hitBox.max.x,
            this.hitBox.min.y,
            this.hitBox.min.z - 0.25
        );

        blocks = [
            map.getBlockAt(zbl.x, zbl.y, zbl.z),
            map.getBlockAt(zbr.x, zbr.y, zbr.z),
        ];

        for (let block of blocks) {
            if (block == null || collided.includes(block.id)) continue;
            if (this.hitBox.min.z <= block.max.z - this.#EPS) {
                const diff = block.max.z - this.hitBox.min.z;
                this.camera.position.z += diff - this.#EPS;
                this.updateHitBox();
                collided.push(block.id);
                break;
            }
        }
    }
}

export default Player;
