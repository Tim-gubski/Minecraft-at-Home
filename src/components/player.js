import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

class Player {
  // camera constants
  #FOV = 70;

  // hitbox/model constants
  #CAMERA_Y_OFFSET = 0.75;
  #WIDTH = 0.75;
  #HEIGHT = 2;
  #EPS = 0.075;
  #SIZE = new THREE.Vector3(this.#WIDTH, this.#HEIGHT, this.#WIDTH);

  // movement constants
  #MAX_SPEED = 0.4;
  #COYOTE_TIME = 5;
  #MOMENTUM_DECAY = 0.75;

  // movement variables
  #jumpHeight = 0.8;
  #momentum = new THREE.Vector3();
  #lastGrounded = 0;
  #lastAttemptedJump = 0;
  #grounded = false;

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
    this.camera.position.set(0, 10, 0);
    this.camera.lookAt(new THREE.Vector3(1, 1, 1));

    this.controller = new PointerLockControls(this.camera);

    return this
  }

  updateMovement(moveKeys, currentT, deltaT) {
    // find current speed to move
    let modifiedSpeed = this.#MAX_SPEED;
    if (moveKeys.shift) modifiedSpeed *= 1.5;
    if ((moveKeys.w || moveKeys.s) && 
        (moveKeys.a || moveKeys.d)) 
    {
        modifiedSpeed = this.#MAX_SPEED / Math.sqrt(2);
    }

    // decay speed (coasting effect)
    this.#grounded = currentT - this.#lastGrounded <= this.#COYOTE_TIME;

    if (this.#grounded) modifiedSpeed *= 0.5;
    this.#momentum.x -= this.#momentum.x * this.#MOMENTUM_DECAY * deltaT
    this.#momentum.z -= this.#momentum.z * this.#MOMENTUM_DECAY * deltaT

    // move according to input
    if (moveKeys.w) this.#momentum.x = modifiedSpeed;
    if (moveKeys.s) this.#momentum.x = -modifiedSpeed;
    if (moveKeys.d) this.#momentum.z = modifiedSpeed;
    if (moveKeys.a) this.#momentum.z = -modifiedSpeed;

    // jupming logic
    if ((moveKeys.space && this.#grounded <= this.#COYOTE_TIME)
        || (currentT - this.#lastAttemptedJump <= this.#COYOTE_TIME)) 
    {
      this.#momentum.y += this.#jumpHeight;
      moveKeys.space = false;
    }

  }

  updatePositions(deltaT, gravity) {
    // update and apply gravity
    if (!this.#grounded) this.#momentum.y -= gravity * deltaT;
    this.camera.position.y += this.#momentum.y * deltaT;

    // apply other movements

    this.controller.moveForward(this.#momentum.x * deltaT);
    this.controller.moveRight(this.#momentum.z * deltaT);

    // move hitbox
    const hitBoxCenter = new THREE.Vector3(
      this.camera.position.x, this.camera.position.y - this.#HEIGHT + this.#CAMERA_Y_OFFSET, this.camera.position.z
    );
    this.hitBox.setFromCenterAndSize(hitBoxCenter, this.#SIZE);
    // console.log(this.hitBox.min, this.hitBox.max)
  }

  collide(map, currentT) {

    // floor collision (check corners of hitbox)
    const fl = new THREE.Vector3(
      this.hitBox.min.x,
      this.hitBox.min.y - 0.25,
      this.hitBox.min.z
    );
    const fr = new THREE.Vector3(
      this.hitBox.min.x,
      this.hitBox.min.y - 0.25,
      this.hitBox.max.z
    );
    const bl = new THREE.Vector3(
      this.hitBox.max.x,
      this.hitBox.min.y - 0.25,
      this.hitBox.min.z
    );
    const br = new THREE.Vector3(
      this.hitBox.max.x,
      this.hitBox.min.y - 0.25,
      this.hitBox.max.z
    );
    const blocks = [
      map.getBlockAt(fl.x, fl.y, fl.z),
      map.getBlockAt(fr.x, fr.y, fr.z),
      map.getBlockAt(bl.x, bl.y, bl.z),
      map.getBlockAt(br.x, br.y, br.z)
    ];

    for (let block of blocks) {
      if (block == null) continue;
      if (this.hitBox.min.y <= block.max.y + this.#EPS) {
          const diff = block.max.y - this.hitBox.min.y;
          this.camera.position.y += diff + this.#EPS;
          this.#momentum.y = 0;
          this.#lastGrounded = currentT;
          break;
        }
    }

    // x collisions
  }
}

export default Player;