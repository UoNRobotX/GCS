import THREE from 'three'

export default class WamV extends THREE.Object3D {
    constructor(latLng) {
        super();
        this.latLng = latLng;
        let geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3(-5,-5,0),
            new THREE.Vector3(5,-5,0),
            new THREE.Vector3(0,10,0)
        );
        geometry.faces.push(new THREE.Face3(0,1,2));
        let material = new THREE.MeshBasicMaterial({color: 0x00FF00});
        this.add(new THREE.Mesh(geometry, material));
    }
}
