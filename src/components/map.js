import * as THREE from 'three';

class Map {
    #CHUNKSIZE = 16;
    #TILESIZE = 1;

    constructor() {
        this.chunks = {};
    }

    getBlockID(x, y, z) {
        return '' + x + ' ' + y + ' ' + z + '';
    }

    getChunkID(x, y) {
        return (
            '' +
            Math.floor(x / this.#CHUNKSIZE) +
            ' ' +
            Math.floor(y / this.#CHUNKSIZE) +
            ''
        );
    }

    parseChunkID(id) {
        const { x, y } = id.split(' ');
        return parseInt(x), parseInt(y);
    }

    addTile(x, y, z) {
        const chunkID = this.getChunkID(x, y);

        // chunk doesnt exist, create it
        if (!(chunkID in this.chunks)) {
            this.chunks[chunkID] = {};
        }

        // insert block into chunk
    }

    removeTile() {}
}

export default Map;
