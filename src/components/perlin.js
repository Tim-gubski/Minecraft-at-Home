class Perlin2d {
    constructor(width, height, seed) {
        this.width = width;
        this.height = height;
        this.seed = seed;

        this.grid = [];
        for (let x = 0; x < width; x++) {
            this.grid.push([]);
            for (let y = 0; y < height; y++) {
                this.grid[x].push(this.randomvector());
            }
        }
    }
    randomvector() {
        Math.seedrandom(this.seed);
        let theta = Math.random() * 2 * Math.PI;
        return [Math.cos(theta), Math.sin(theta)];
    }
}

export default Perlin2d;
