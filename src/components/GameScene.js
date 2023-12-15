import { Scene, Color } from 'three';
import * as THREE from 'three';
import GrassTop from '../textures/grass_block_top.png';
import GrassSides from '../textures/grass_block_side.png';
import oak_log from '../textures/oak_log.png';
import leaves from '../textures/oak_leaves.png';
import perlin from 'perlin-noise';
import tree from './tree.json';

class GameScene extends Scene {
    #floorLevel = 0.5;
    #renderDistance = 2;
    #cloudHeight = 25;
    #cloudRenderDistance = 100;

    constructor(map) {
        super();

        // setup the map and perlin noise generator
        this.map = map;
        this.clouds = [];
        this.perlinsize = 1000;
        this.noise = perlin.generatePerlinNoise(
            this.perlinsize,
            this.perlinsize
        );

        this.biomenoise = perlin.generatePerlinNoise(
            this.perlinsize,
            this.perlinsize
        );

        // make clouds
        for (let i = 0; i < 50; i++) {
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

        this.background = new Color(0x7ec0ee);

        // add lights
        let ambient = new THREE.AmbientLight(0x303030);
        let hemisphere = new THREE.HemisphereLight(0xaaaaaa, 0x080820, 1.7);
        this.add(ambient, hemisphere);
    }

    getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    buildTree(x, y, z) {
        // tree build is stored in a json, just move to the new coordinates
        tree.blocks.forEach((block) => {
            let pic = block.texture == 'leaves' ? leaves : oak_log;
            let texture = new THREE.TextureLoader().load(pic);
            texture.magFilter = THREE.NearestFilter;
            let cube = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 1),
                block.texture == 'leaves'
                    ? new THREE.MeshLambertMaterial({
                          map: texture,
                          color: 0x619961,
                      })
                    : new THREE.MeshLambertMaterial({ map: texture })
            );
            cube.castShadow = true;
            cube.position.set(
                x + block.position.x,
                y + block.position.y,
                z + block.position.z
            );

            // add the cube and block to map and scene
            this.add(cube);
            this.map.addBlock(
                cube.position.x,
                cube.position.y,
                cube.position.z,
                cube
            );
        });
    }

    generateChunk(chunkx, chunkz) {
        // Create grass block texture and material
        let grassTopTexture = new THREE.TextureLoader().load(GrassTop);
        grassTopTexture.magFilter = THREE.NearestFilter;
        let grassTop = new THREE.MeshLambertMaterial({
            color: 0x7cbd6b,
            map: grassTopTexture,
        });
        let grassSidesTexture = new THREE.TextureLoader().load(GrassSides);
        grassSidesTexture.magFilter = THREE.NearestFilter;
        let grassSides = new THREE.MeshLambertMaterial({
            map: grassSidesTexture,
        });
        let material = [
            grassSides,
            grassSides,
            grassTop,
            grassSides,
            grassSides,
            grassSides,
        ];

        // create block mesh instance
        let grassInstance = new THREE.InstancedMesh(
            new THREE.BoxBufferGeometry(1, 1, 1),
            material,
            this.map.CHUNK_SIZE * this.map.CHUNK_SIZE * 30
        );
        grassInstance.receiveShadow = true;
        grassInstance.name = 'floor';
        this.add(grassInstance);

        let blockPosition = new THREE.Object3D();

        // moves all instances of blocks to their correct locations, using perlin noise for elevation
        let minx = chunkx * this.map.CHUNK_SIZE;
        for (let x = minx; x < minx + this.map.CHUNK_SIZE; x++) {
            let minz = chunkz * this.map.CHUNK_SIZE;
            for (let z = minz; z < minz + this.map.CHUNK_SIZE; z++) {
                // perlin noise for elevation
                let maxy = Math.floor(
                    this.noise[
                        (Math.abs(x) % this.perlinsize) * this.perlinsize +
                            (Math.abs(z) % this.perlinsize)
                    ] *
                        this.biomenoise[
                            (Math.abs(chunkx) % this.perlinsize) *
                                this.perlinsize +
                                (Math.abs(chunkz) % this.perlinsize)
                        ] *
                        Math.min(
                            30,
                            (Math.abs(x) ** 2 + Math.abs(z) ** 2) / 100
                        )
                );
                // stack block to correct height
                for (
                    let y = this.#floorLevel;
                    y <= Math.max(this.#floorLevel, this.#floorLevel + maxy);
                    y++
                ) {
                    blockPosition.position.set(x + 0.5, y, z + 0.5);
                    blockPosition.updateMatrix();
                    grassInstance.setMatrixAt(
                        (x - minx) * this.map.CHUNK_SIZE * 30 +
                            (z - minz) * this.map.CHUNK_SIZE +
                            (y - this.#floorLevel),
                        blockPosition.matrix
                    );

                    this.map.addBlock(x + 0.5, y, z + 0.5, null);
                }

                // randomly generate tree
                if (Math.random() < 0.005) {
                    this.buildTree(
                        x + 0.5,
                        this.#floorLevel + maxy + 1,
                        z + 0.5
                    );
                }
            }
        }

        grassInstance.instanceMatrix.needsUpdate = true;
        return grassInstance;
    }

    update(player) {
        // build out terrain
        let playerPos = player.camera.position;
        let currentChunk = {
            x: Math.floor(playerPos.x / this.map.CHUNK_SIZE),
            z: Math.floor(playerPos.z / this.map.CHUNK_SIZE),
        };
        for (
            let chunk_x = currentChunk.x - this.#renderDistance - 2;
            chunk_x <= currentChunk.x + this.#renderDistance + 2;
            chunk_x++
        ) {
            for (
                let chunk_z = currentChunk.z - this.#renderDistance - 2;
                chunk_z <= currentChunk.z + this.#renderDistance + 2;
                chunk_z++
            ) {
                // unload chunks outside render distance
                if (
                    chunk_x < currentChunk.x - this.#renderDistance ||
                    chunk_x > currentChunk.x + this.#renderDistance ||
                    chunk_z < currentChunk.z - this.#renderDistance ||
                    chunk_z > currentChunk.z + this.#renderDistance
                ) {
                    let chunk_id = this.map.getChunkID(
                        chunk_x * this.map.CHUNK_SIZE,
                        chunk_z * this.map.CHUNK_SIZE
                    );
                    if (
                        chunk_id in this.map.initializedChunks &&
                        this.map.initializedChunks[chunk_id].loaded
                    ) {
                        this.remove(
                            this.map.initializedChunks[chunk_id].terrain
                        );
                        this.map.initializedChunks[chunk_id].loaded = false;
                        let chunk = this.map.chunks[chunk_id];
                        for (let block in chunk) {
                            if (chunk[block].block) {
                                this.remove(chunk[block].block);
                            }
                        }
                    }
                    continue;
                }

                // loads chunks in render dist
                let chunk_id = this.map.getChunkID(
                    chunk_x * this.map.CHUNK_SIZE,
                    chunk_z * this.map.CHUNK_SIZE
                );
                if (!(chunk_id in this.map.initializedChunks)) {
                    this.map.initializedChunks[chunk_id] = {
                        loaded: true,
                        terrain: this.generateChunk(chunk_x, chunk_z),
                    };
                } else {
                    if (!this.map.initializedChunks[chunk_id].loaded) {
                        this.add(this.map.initializedChunks[chunk_id].terrain);
                        this.map.initializedChunks[chunk_id].loaded = true;
                        let chunk = this.map.chunks[chunk_id];
                        for (let block in chunk) {
                            if (chunk[block].block) {
                                this.add(chunk[block].block);
                            }
                        }
                    }
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
