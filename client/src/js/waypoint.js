import THREE from 'three'

export default class Waypoint extends THREE.Object3D {
    constructor(lat, lng) {
        super();
        this.lat = lat;
        this.lng = lng;
        this.geometry = new THREE.CircleGeometry(20,16);
        let material = new THREE.MeshBasicMaterial({color: 0x00FF00, overdraw: true});
        this.add(new THREE.Mesh(this.geometry, material));
    }
}
