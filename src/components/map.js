import * as THREE from 'three';

class Map {
    CHUNK_SIZE = 16;
    BLOCK_SIZE = 1;

    constructor() {
        this.chunks = {};
        this.initializedChunks = {};
    }

    // truncates coordinates for chunk ids
    getChunkID(x, z) {
        const [chunkX, chunkZ] = this.getChunkCoords(x, z);
        return `${chunkX} ${chunkZ}`;
    }

	// return the chunk coordinates of this postion
    getChunkCoords(x, z) {
        return [
            Math.floor(x / this.CHUNK_SIZE),
            Math.floor(z / this.CHUNK_SIZE),
        ];
    }

    #truncateBlockCoords(x, y, z) {
        return [
            Math.floor(x % this.CHUNK_SIZE),
            Math.floor(y % this.CHUNK_SIZE),
            Math.floor(z % this.CHUNK_SIZE),
        ];
    }

    // truncates coordinates for block ids
    getBlockID(x, y, z) {
        const [bx, by, bz] = this.#truncateBlockCoords(x, y, z);
        return `${bx} ${by} ${bz}`;
    }

    // sets the block flag at a location to true
    addBlock(x, y, z) {
        // grab chunkid and create chunk if it doesnt exist
        const chunkID = this.getChunkID(x, z);
        if (!(chunkID in this.chunks)) this.chunks[chunkID] = {};
        // grab block if and create block if it doesnt exist
        const blockID = this.getBlockID(x, y, z);
        if (!(blockID in this.chunks[chunkID])) {
			// make a local and world block for the map
            const local = new THREE.Box3();
            const [bx, by, bz] = this.#truncateBlockCoords(x, y, z);
            local.set(
                new THREE.Vector3(bx, by, bz),
                new THREE.Vector3(bx + 1, by + 1, bz + 1)
            );

            const worldCoordinates = new THREE.Vector2(
                Math.floor(x),
                Math.floor(z)
            );

            const world = new THREE.Box3();
            world.set(
                new THREE.Vector3(Math.floor(x), Math.floor(y), Math.floor(z)),
                new THREE.Vector3(
                    Math.floor(x) + 1,
                    Math.floor(y) + 1,
                    Math.floor(z) + 1
                )
            );

            this.chunks[chunkID][blockID] = {
                world: worldCoordinates,
                localBox: local,
                worldBox: world,
            };
        }
    }

    // sets the block flag at a location to false
    removeBlock(x, y, z) {
        // grab chunkid and create chunk if it doesnt exist
        const chunkID = this.getChunkID(x, z);
        if (!(chunkID in this.chunks)) return;

        // grab block if and create block if it doesnt exist
        const blockID = this.getBlockID(x, y, z);
        if (!(blockID in this.chunks[chunkID])) return;

        delete this.chunks[chunkID][blockID];
        if (Object.keys(this.chunks[chunkID]).length == 0)
            delete this.chunks[chunkID];
    }

    // return wether a block exists in a spot
    queryCoordinate(x, y, z) {
        const chunkID = this.getChunkID(x, z);
        if (!(chunkID in this.chunks)) return false;
        const blockID = this.getBlockID(x, y, z);
        if (!(blockID in this.chunks[chunkID])) return false;

        return true;
    }

    // return the bounding box of the block at a location
    getBlockAt(x, y, z) {
        if (!this.queryCoordinate(x, y, z)) return null;
        const chunkID = this.getChunkID(x, z);
        const blockID = this.getBlockID(x, y, z);
        return this.chunks[chunkID][blockID];
    }
}

export default Map;
