import THREE from 'three'

export default class Waypoint extends THREE.Object3D {
    constructor(lat, lng) {
        super();
        this.RADIUS = 10;
        this.lat = lat;
        this.lng = lng;
        this.geometry = new THREE.CircleGeometry(this.RADIUS,16);
        let material = new THREE.MeshBasicMaterial({color: 0xFF0000, overdraw: true});
        this.add(new THREE.Mesh(this.geometry, material));
    }
}
