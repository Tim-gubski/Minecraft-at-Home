// based off of: https://joeiddon.github.io/projects/javascript/perlin.html
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
        // Math.seed(this.seed);
        let theta = Math.random() * 2 * Math.PI;
        return [Math.cos(theta), Math.sin(theta)];
    }

    perlinGet(x, y) {
        /* Calculate lattice points. */
        let p0 = floor(p);
        let p1 = p0 + [1.0, 0.0];
        let p2 = p0 + [0.0, 1.0];
        let p3 = p0 + [1.0, 1.0];

        /* Look up gradients at lattice points. */
        let g0 = grad(p0);
        let g1 = grad(p1);
        let g2 = grad(p2);
        let g3 = grad(p3);

        let t0 = p.x - p0.x;
        let fade_t0 =
            fade(t0); /* Used for interpolation in horizontal direction */

        let t1 = p.y - p0.y;
        let fade_t1 =
            fade(t1); /* Used for interpolation in vertical direction. */

        /* Calculate dot products and interpolate.*/
        let p0p1 =
            (1.0 - fade_t0) * dot(g0, p - p0) +
            fade_t0 * dot(g1, p - p1); /* between upper two lattice points */
        let p2p3 =
            (1.0 - fade_t0) * dot(g2, p - p2) +
            fade_t0 * dot(g3, p - p3); /* between lower two lattice points */

        /* Calculate final result */
        return (1.0 - fade_t1) * p0p1 + fade_t1 * p2p3;
    }

    fade(t) {
        return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
    }

    grad(p) {
        const texture_width = 256.0;
        v = texture2D(iChannel0, vec2(p / texture_width, 0.0)).r;
        return v > 0.5 ? 1.0 : -1.0;
    }
}

export default Perlin2d;
