import THREE from 'three'

export default class MapLine extends THREE.Object3D {
    constructor(latLng1, latLng2) {
        super();
        this.WIDTH = 2;
        this.Z = 0;
        this.start = latLng1;
        this.end = latLng2;
        let geometry = new THREE.PlaneGeometry(1,1);
        let material = new THREE.MeshBasicMaterial({color: 0x000000, overdraw: true});
        this.plane = new THREE.Mesh(geometry, material);
        this.add(this.plane);
        this.position.z = this.Z;
    }
    updateGeometry(start, end){ //arguments have the form: {x:x1, y:y1}
        let dist = Math.sqrt(
            Math.pow(start.x - end.x, 2) + 
            Math.pow(start.y - end.y, 2)); 
        let midpoint = [
            start.x+0.5*(end.x-start.x), 
            start.y+0.5*(end.y-start.y)]; 
        let grad = (end.y-start.y)/(end.x-start.x); 
        this.plane.position.set(midpoint[0], midpoint[1], 0); 
        this.plane.rotation.z = Math.atan(grad); 
        this.plane.scale.x = dist; 
        this.plane.scale.y = this.WIDTH; 
    }
}
