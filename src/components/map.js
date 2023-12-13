import * as THREE from 'three';

class Map {
  #CHUNK_SIZE = 16;
  
  constructor() {
    this.chunks = {};
  }

  // truncates coordinates for chunk ids
  getChunkID(x, z) {
    return `${Math.floor(x / this.#CHUNK_SIZE)} ${Math.floor(z / this.#CHUNK_SIZE)}`;
  }

  #truncateBlockCoords(x, y, z) {
    return [Math.floor(x % this.#CHUNK_SIZE), Math.floor(y % this.#CHUNK_SIZE), Math.floor(z % this.#CHUNK_SIZE)];
  }

  // truncates coordinates for block ids
  getBlockID(x, y, z) {
    const [ bx, by, bz ] = this.#truncateBlockCoords(x, y, z);
    return `${bx} ${by} ${bz}`
  }

  // sets the block flag at a location to true
  addBlock(x, y, z) {

    // grab chunkid and create chunk if it doesnt exist
    const chunkID = this.getChunkID(x, z);
    // console.log(chunkID);
    if (!(chunkID in this.chunks)) this.chunks[chunkID] = {};

    // console.log(this.chunks[chunkID]);
    // grab block if and create block if it doesnt exist
    const blockID = this.getBlockID(x, y, z);
    if (!(blockID in this.chunks[chunkID])) {
        const box = new THREE.Box3();
        const [ bx, by, bz ] = this.#truncateBlockCoords(x, y, z);
        box.set(
            new THREE.Vector3(bx, by, bz),
            new THREE.Vector3(bx + 1, by + 1, bz + 1)
        );
        this.chunks[chunkID][blockID] = box;
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
    // console.log(chunkID);
    if (!(chunkID in this.chunks)) return false;

    const blockID = this.getBlockID(x, y, z);
    // console.log(blockID);
    // console.log(this.chunks[chunkID]);
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