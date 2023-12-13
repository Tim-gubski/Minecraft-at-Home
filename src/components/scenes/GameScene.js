import { Scene, Color } from 'three';
import { BasicLights } from 'lights';
import * as THREE from 'three';
import GrassTop from '../../textures/grass_block_top.png';

class GameScene extends Scene {
    #floorLevel = 0.5;
    #renderDistance = 1;
    #cloudHeight = 15;
    #cloudRenderDistance = 100;

    constructor(map) {
        super();

        this.map = map;
        this.clouds = [];
        // let floorTexture = new THREE.TextureLoader().load(GrassTop);
        // floorTexture.wrapS = THREE.RepeatWrapping;
        // floorTexture.wrapT = THREE.RepeatWrapping;
        // floorTexture.repeat.set(100, 100);
        // floorTexture.magFilter = THREE.NearestFilter;

        // const planeGeometry = new THREE.PlaneGeometry(100, 100, 50, 50);
        // const planeMaterial = new THREE.MeshLambertMaterial({
        //     color: 0x7cbd6b,
        //     map: floorTexture,
        //     wireframe: false,
        // });
        // this.floor = new THREE.Mesh(planeGeometry, planeMaterial);
        // this.floor.name = 'floor';
        // this.floor.rotateX(-Math.PI / 2);
        // this.add(this.floor);

        // const axesHelper = new THREE.AxesHelper(5);
        // axesHelper.name = 'helper';
        // this.add(axesHelper);

        // let cube = new THREE.Mesh(
        //     new THREE.BoxGeometry(1, 1, 1),
        //     new THREE.MeshPhongMaterial({ color: 0x00ff00 })
        // );
        // cube.position.set(0, 0.5, 0);
        // this.add(cube);

        // make large platform in map
        this.generateChunk(0, 0);

        // make clouds
        for (let i = 0; i < 20; i++) {
            let basePoint = new THREE.Vector3(
                this.getRandomInt(-170, 170),
                this.#cloudHeight,
                this.getRandomInt(-170, 170)
            );
            let speed = Math.random();
            let cloud = [];
            // generate cloud
            for (let x = 0; x < this.getRandomInt(4, 10); x++) {
                let min = this.getRandomInt(-6, -2);
                let max = this.getRandomInt(2, 6);
                for (let z = min; z < max; z++) {
                    let cloudPart = new THREE.Mesh(
                        new THREE.BoxGeometry(1, 1, 1),
                        new THREE.MeshPhongMaterial({
                            color: 0xffffff,
                            emissive: 0xffffff,
                            emissiveIntensity: 0.5,
                        })
                    );
                    cloudPart.position.set(
                        basePoint.x + x,
                        basePoint.y,
                        basePoint.z + z
                    );
                    cloud.push(cloudPart);
                    this.add(cloudPart);
                }
            }
            this.clouds.push({ cloud, speed });
        }

        let lightSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            new THREE.MeshPhongMaterial({ color: 0xffffff })
        );
        lightSphere.position.set(0, 5, 0);
        this.add(lightSphere);

        this.background = new Color(0x7ec0ee);

        let light2 = new THREE.PointLight(0xffffff, 1, 100);
        let light = new THREE.AmbientLight(0x404040);
        let light3 = new THREE.HemisphereLight(0xaaaaaa, 0x080820, 1.3);
        light2.position.set(0, 5, 0);
        this.add(light, light2, light3);
    }

    getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    generateChunk(chunkx, chunkz) {
        let minx = chunkx * this.map.CHUNK_SIZE;
        for (let x = minx; x < minx + this.map.CHUNK_SIZE; x++) {
            let minz = chunkz * this.map.CHUNK_SIZE;
            for (let z = minz; z < minz + this.map.CHUNK_SIZE; z++) {
                let maxy = Math.floor(Math.sin((x * x + z * z) / 1000) * 5);
                for (
                    let y = this.#floorLevel;
                    y <= this.#floorLevel + maxy;
                    y++
                ) {
                    let grassTexture = new THREE.TextureLoader().load(GrassTop);
                    grassTexture.magFilter = THREE.NearestFilter;
                    let grassBlock = new THREE.Mesh(
                        new THREE.BoxBufferGeometry(1, 1, 1),
                        new THREE.MeshLambertMaterial({
                            color: 0x7cbd6b,
                            map: grassTexture,
                        })
                    );

                    grassBlock.position.set(
                        x + 0.5,
                        this.#floorLevel + y,
                        z + 0.5
                    );
                    this.add(grassBlock);
                    this.map.addBlock(x + 0.5, this.#floorLevel + y, z + 0.5);
                }
            }
        }
    }

    update(player) {
        // build out terrain
        let playerPos = player.camera.position;
        let currentChunk = {
            x: Math.floor(playerPos.x / this.map.CHUNK_SIZE),
            z: Math.floor(playerPos.z / this.map.CHUNK_SIZE),
        };
        for (
            let chunk_x = currentChunk.x - this.#renderDistance;
            chunk_x <= currentChunk.x + this.#renderDistance;
            chunk_x++
        ) {
            for (
                let chunk_z = currentChunk.z - this.#renderDistance;
                chunk_z <= currentChunk.z + this.#renderDistance;
                chunk_z++
            ) {
                let chunk_id = this.map.getChunkID(
                    chunk_x * this.map.CHUNK_SIZE,
                    chunk_z * this.map.CHUNK_SIZE
                );

                if (!(chunk_id in this.map.chunks)) {
                    this.generateChunk(chunk_x, chunk_z);
                }
            }
        }

        // move all clouds
        for (let i = 0; i < this.clouds.length; i++) {
            let cloudPos = this.clouds[i].cloud[0].position;
            if (
                cloudPos.x < playerPos.x + this.#cloudRenderDistance &&
                cloudPos.x > playerPos.x - this.#cloudRenderDistance &&
                cloudPos.z < playerPos.z + this.#cloudRenderDistance &&
                cloudPos.z > playerPos.z - this.#cloudRenderDistance
            ) {
                for (let j = 0; j < this.clouds[i].cloud.length; j++) {
                    let speed = this.clouds[i].speed;
                    this.clouds[i].cloud[j].position.x += speed * 0.02;
                }
            } else {
                if (cloudPos.x > playerPos.x + this.#cloudRenderDistance) {
                    for (let j = 0; j < this.clouds[i].cloud.length; j++) {
                        this.clouds[i].cloud[j].position.x -=
                            this.#cloudRenderDistance * 2;
                    }
                }
                if (cloudPos.x < playerPos.x - this.#cloudRenderDistance) {
                    for (let j = 0; j < this.clouds[i].cloud.length; j++) {
                        this.clouds[i].cloud[j].position.x +=
                            this.#cloudRenderDistance * 2;
                    }
                }
                if (cloudPos.z > playerPos.z + this.#cloudRenderDistance) {
                    for (let j = 0; j < this.clouds[i].cloud.length; j++) {
                        this.clouds[i].cloud[j].position.z -=
                            this.#cloudRenderDistance * 2;
                    }
                }
                if (cloudPos.z < playerPos.z - this.#cloudRenderDistance) {
                    for (let j = 0; j < this.clouds[i].cloud.length; j++) {
                        this.clouds[i].cloud[j].position.z +=
                            this.#cloudRenderDistance * 2;
                    }
                }
            }
        }
    }
}

export default GameScene;
