import { Scene, Color } from 'three';
import { BasicLights } from 'lights';
import * as THREE from 'three';
import GrassTop from '../../textures/grass_block_top.png';

class GameScene extends Scene {
    constructor() {
        super();

        let floorTexture = new THREE.TextureLoader().load(GrassTop);
        floorTexture.wrapS = THREE.RepeatWrapping;
        floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(100, 100);
        floorTexture.magFilter = THREE.NearestFilter;

        const planeGeometry = new THREE.PlaneGeometry(100, 100, 50, 50);
        const planeMaterial = new THREE.MeshLambertMaterial({
            color: 0x7cbd6b,
            map: floorTexture,
            wireframe: false,
        });
        this.floor = new THREE.Mesh(planeGeometry, planeMaterial);
        this.floor.name = 'floor';
        this.floor.rotateX(-Math.PI / 2);
        this.add(this.floor);

        let cube = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshPhongMaterial({ color: 0x00ff00 })
        );
        cube.position.set(0, 0.5, 0);
        this.add(cube);

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

    update(timeStamp) {}
}

export default GameScene;
