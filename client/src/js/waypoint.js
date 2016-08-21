import THREE from 'three'

export default class Waypoint extends THREE.Object3D {
    constructor(latLng) {
        super();
        this.RADIUS = 5;
        this.Z = 1;
        this.latLng = latLng;
        let geometry = new THREE.CircleGeometry(this.RADIUS,16);
        let material = new THREE.MeshBasicMaterial({color: 0xFF0000, overdraw: true});
        this.add(new THREE.Mesh(geometry, material));
        this.position.z = this.Z;
    }
}
