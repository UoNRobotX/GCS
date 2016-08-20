import THREE from 'three';
import Waypoint from 'js/waypoint.js';
import WamV from 'js/wamv.js';

//this is for using the canvas renderer when WebGL is not available
import loadCanvasRenderer from 'js/CanvasRenderer.js';
import loadProjector from 'js/Projector.js';
loadCanvasRenderer(THREE);
loadProjector(THREE);

export default class MapDisplayData {
    constructor(){
        this.initialLatLng = {lat: 21.308731, lng: -157.888815};
        this.initialZoom = 17;
        this.mapElement = null;
        this.map = null;
        this.canvasElement = null;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.wamv = null;
        this.waypoints = [];
        this.hidden = false;
    }
    load(googleMaps){
        //get map element
        let mapElement = document.getElementById('map');
        //create map
        let map = new googleMaps.Map(mapElement, {
            center: this.initialLatLng,
            zoom: this.initialZoom,
            tilt: 0,
            mapTypeId: google.maps.MapTypeId.SATELLITE,
            disableDefaultUI: true,
            disableDoubleClickZoom: true,
            draggableCursor: 'crosshair',
            draggingCursor: 'crosshair',
        });
        //get canvas element
        let canvasElement = document.getElementById('overlay');
        //set overlay size
        let width = mapElement.clientWidth;
        let height = mapElement.clientHeight;
        canvasElement.width = width;
        canvasElement.height = height;
        //initialise renderer
        let renderer = null;
        function webglAvailable(canvas) {
            try {
                return !!(window.WebGLRenderingContext && (
                    canvas.getContext('webgl') ||
                    canvas.getContext('experimental-webgl'))
                );
            } catch (e) {
                return false;
            }
        }
        if (webglAvailable(canvasElement)) {
            renderer = new THREE.WebGLRenderer({
                canvas: canvasElement,
                antialias: true,
                alpha: true,
            });
        } else {
            renderer = new THREE.CanvasRenderer({
                canvas: canvasElement,
                alpha: true}
            );
            console.log('Unable to load WebGL overlay. Using canvas renderer instead.');
        }
        //create scene
        renderer.setSize(width, height);
        let scene = new THREE.Scene();
        let camera = new THREE.OrthographicCamera(width/-2, width/2, height/2, height/-2, 0.1, 1000);
        camera.position.z = 100;
        scene.add(camera);
        //add WAM-V
        this.wamv = new WamV(this.initialLatLng);
        scene.add(this.wamv);
        //start animation loop
        function render(){
            requestAnimationFrame(render);
            renderer.render(scene, camera);
        };
        render();
        //when window is resized, resize overlay and renderer
        window.addEventListener('resize', () => {
            let width = mapElement.clientWidth;
            let height = mapElement.clientHeight;
            canvasElement.width = width;
            canvasElement.height = height;
            this.camera.left = width / -2;
            this.camera.right = width / 2;
            this.camera.top = height / 2;
            this.camera.bottom = height / -2;
            this.camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        });
        //update members
        this.mapElement = mapElement;
        this.map = map;
        this.canvasElement = canvasElement;
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        //update scene
        this.updateScene()
    }
    center(){
        //should center the map on the WAM-V
        this.map.panTo(this.initialLatLng);
    }
    zoom(inward){
        this.map.setZoom(this.map.getZoom() + (inward ? 1 : -1));
        this.updateScene();
    }
    setMapType(value){
        this.map.setMapTypeId(google.maps.MapTypeId[value]);
    }
    moveMap(dir){
        let dx = this.canvasElement.width/4;
        let dy = this.canvasElement.height/4;
        switch (dir){
            case 0: this.map.panBy(  0, -dy); break; //up
            case 1: this.map.panBy(-dx,   0); break; //left
            case 2: this.map.panBy( dx,   0); break; //right
            case 3: this.map.panBy(  0,  dy); break; //down
        }
    }
    updateScene(){
        if (this.camera != null){
            this.camera.zoom = (Math.pow(2, this.map.zoom) / Math.pow(2, this.initialZoom));
            this.camera.updateProjectionMatrix();
        }
        for (let wp of this.waypoints){
            let pos = this.latLng2World(wp.latLng);
            wp.position.x = pos.x;
            wp.position.y = pos.y;
        }
        let pos = this.latLng2World(this.wamv.latLng);
        this.wamv.position.x = pos.x;
        this.wamv.position.y = pos.y;
    }
    clicked(lat, lng){
        let latLng = {lat: lat, lng: lng};
        //if a waypoint was clicked, remove it
        let p = this.latLng2World(latLng);
        for (let i = 0; i < this.waypoints.length; i++){
            let wp = this.waypoints[i];
            let q = {x: wp.position.x, y: wp.position.y};
            let d1 = p.x-q.x;
            let d2 = p.y-q.y;
            if (Math.sqrt(d1*d1 + d2*d2) <= wp.RADIUS){
                this.waypoints.splice(i,1);
                this.scene.remove(wp);
                return;
            }
        }
        //if no waypoint was clicked, add waypoint
        this.addWaypoint(latLng, p);
    }
    addWaypoint(latLng, pos){
        if (typeof pos === 'undefined'){
            pos = this.latLng2World(latLng);
        }
        let wp = new Waypoint(latLng);
        wp.position.x = pos.x;
        wp.position.y = pos.y;
        this.waypoints.push(wp);
        this.scene.add(wp);
    }
    latLng2World(latLng){
        let projection = this.map.getProjection();
        if (projection != null && this.camera != null){
            let width = this.canvasElement.width;
            let height = this.canvasElement.height;
            let latLng2 = new google.maps.LatLng(latLng.lat, latLng.lng);
            let point = projection.fromLatLngToPoint(latLng2);
            let bounds = this.map.getBounds();
            let topRight   = projection.fromLatLngToPoint(bounds.getNorthEast());
            let bottomLeft = projection.fromLatLngToPoint(bounds.getSouthWest());
            let scale = Math.pow(2, this.map.getZoom());
            //compute coordinates
            let x = ((point.x - bottomLeft.x) * scale - (width / 2)) / this.camera.zoom;
            let y = ((topRight.y - point.y) * scale + (height / 2) ) / this.camera.zoom;
            return {x:x, y:y};
        } else {
            return {x:0, y:0};
        }
    }
};
