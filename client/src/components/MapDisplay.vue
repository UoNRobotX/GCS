<template>
    <div id="map-display">
        <div id="map"></div>
        <canvas id="overlay"></canvas>
    </div>
</template>

<script>
import loadGoogleMapsAPI from 'load-google-maps-api';
import THREE from 'three';
import WamV from 'js/wamv.js';
import Waypoint from 'js/waypoint.js';
import MapLine from 'js/mapLine.js';

//this is for using the canvas renderer when WebGL is not available
import loadCanvasRenderer from 'js/CanvasRenderer.js';
import loadProjector from 'js/Projector.js';
loadCanvasRenderer(THREE);
loadProjector(THREE);

export default {
    data() {
        return {
            initialLatLng: {lat: 21.308731, lng: -157.888815},
            initialZoom: 17,
            mapElement: null,
            map: null,
            canvasElement: null,
            renderer: null,
            scene: null,
            camera: null,
            wamv: null,
            waypoints: {points: [], lines: []},
        };
    },
    methods: {
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
        },
        updateScene(){
            if (this.camera != null){
                this.camera.zoom = (Math.pow(2, this.map.zoom) / Math.pow(2, this.initialZoom));
                this.camera.updateProjectionMatrix();
            }
            for (let wp of this.waypoints.points){
                let pos = this.latLng2World(wp.latLng);
                wp.position.x = pos.x;
                wp.position.y = pos.y;
            }
            for (let line of this.waypoints.lines){
                let pos1 = this.latLng2World(line.start);
                let pos2 = this.latLng2World(line.end);
                line.updateGeometry(pos1,pos2);
            }
            let pos = this.latLng2World(this.wamv.latLng);
            this.wamv.position.x = pos.x;
            this.wamv.position.y = pos.y;
        },
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
        },
        clicked(lat, lng){
            let latLng = {lat: lat, lng: lng};
            //if a waypoint was clicked, remove it
            let removedWaypoint = false;
            let p = this.latLng2World(latLng);
            for (let i = 0; i < this.waypoints.points.length; i++){
                let wp = this.waypoints.points[i];
                let q = {x: wp.position.x, y: wp.position.y};
                let d1 = p.x-q.x;
                let d2 = p.y-q.y;
                //check if the click was within a waypoint's area
                if (Math.sqrt(d1*d1 + d2*d2) <= wp.RADIUS){
                    this.waypoints.points.splice(i,1);
                    this.scene.remove(wp);
                    //remove and/or reconnect appropriate lines
                    if (i > 0){
                        let line = this.waypoints.lines[i-1];
                        if (i < this.waypoints.lines.length){
                            this.waypoints.lines[i].start = line.start;
                        }
                        this.waypoints.lines.splice(i-1,1);
                        this.scene.remove(line);
                    } else {
                        if (this.waypoints.lines.length > 0){
                            let line = this.waypoints.lines[0];
                            this.waypoints.lines.splice(0,1);
                            this.scene.remove(line);
                        }
                    }
                    removedWaypoint = true;
                    break;
                }
            }
            //if no waypoint was clicked, add waypoint
            if (!removedWaypoint){
                this.addWaypoint(latLng);
            }
            //update scene
            this.updateScene();
        },
        addWaypoint(latLng){
            let pos = this.latLng2World(latLng);
            let wp = new Waypoint(latLng);
            wp.position.x = pos.x;
            wp.position.y = pos.y;
            this.waypoints.points.push(wp);
            this.scene.add(wp);
            //if there are existing waypoints, add a line
            if (this.waypoints.points.length > 1){
                let prevWp = this.waypoints.points[this.waypoints.points.length-2];
                let line = new MapLine(prevWp.latLng, latLng);
                this.waypoints.lines.push(line);
                this.scene.add(line);
            }
        },
        center(){
            this.map.panTo(this.wamv.latLng);
        },
        zoom(inward){
            this.map.setZoom(this.map.getZoom() + (inward ? 1 : -1));
            this.updateScene();
        },
        setMapType(value){
            this.map.setMapTypeId(google.maps.MapTypeId[value]);
        },
        moveMap(dir){
            let dx = this.canvasElement.width/4;
            let dy = this.canvasElement.height/4;
            switch (dir){
                case 0: this.map.panBy(  0, -dy); break; //up
                case 1: this.map.panBy(-dx,   0); break; //left
                case 2: this.map.panBy( dx,   0); break; //right
                case 3: this.map.panBy(  0,  dy); break; //down
            }
        },
        clearWaypoints(){
            for (let wp of this.waypoints.points){
                this.scene.remove(wp);
            }
            for (let line of this.waypoints.lines){
                this.scene.remove(line);
            }
            this.waypoints.points = [];
            this.waypoints.lines = [];
        },
        saveWaypoints(){
            //create data URI
            let uri = 'data:,';
            for (let wp of this.waypoints.points){
                uri += wp.latLng.lat + ',' + wp.latLng.lng + '\n';
            }
            uri = encodeURI(uri);
            //get link to use for download
            let link = document.getElementById('save_waypoints_link');
            link.href = uri;
            link.download = 'mission.txt';
            //trigger download
            link.click();
        },
        loadWaypoints(contents){
            let points = [];
            //get waypoints from file contents
            let lines = contents.split('\n');
            for (let line of lines){
                if (line.length == 0){continue;}
                let vals = line.split(',');
                if (vals.length != 2){
                    console.log('found invalid line in waypoints file');
                    return;
                }
                let lat = parseFloat(vals[0]);
                let lng = parseFloat(vals[1]);
                if (isNaN(lat) || isNaN(lng)){
                    console.log('found invalid coordinate in waypoints file');
                    return;
                }
                points.push({lat: lat, lng: lng});
            }
            //set waypoints
            this.clearWaypoints();
            for (let point of points){
                this.addWaypoint(point);
            }
            //update scene
            this.updateScene();
        },
        hideWaypoints(){
            for (let wp of this.waypoints.points){
                this.scene.remove(wp);
            }
            for (let line of this.waypoints.lines){
                this.scene.remove(line);
            }
        },
        showWaypoints(){
            for (let wp of this.waypoints.points){
                this.scene.add(wp);
            }
            for (let line of this.waypoints.lines){
                this.scene.add(line);
            }
        },
    },
    ready(){
        //starting loading the map and overlay
        let loaded = loadGoogleMapsAPI({
            v: 3,
            key: 'AIzaSyABnCcekyPecGnsA1Rj_NdWjmUafJ1yVqA',
        }).then((googleMaps) => {
            this.load(googleMaps);
        }, (err) => {
            console.log('Unable to load map');
        }).then(() => {
            //add event listeners
            this.map.addListener('click', (e) => {
                this.clicked(e.latLng.lat(), e.latLng.lng());
            });
            this.map.addListener('dblclick', (e) => {
                console.log('double click at: ' +
                    e.latLng.lat() + ', ' + e.latLng.lng());
            });
            this.map.addListener('zoom_changed', () => {
                this.updateScene();
            });
            this.map.addListener('center_changed', () => {
                this.updateScene();
            });
        });
    },
    events: {
        'map-center': function(){
            this.center();
        },
        'map-zoom-in': function(){
            this.zoom(true);
        },
        'map-zoom-out': function(){
            this.zoom(false);
        },
        'map-type': function(value){
            this.setMapType(value);
        },
        'map-up': function(){
            this.moveMap(0);
        },
        'map-left': function(){
            this.moveMap(1);
        },
        'map-right': function(){
            this.moveMap(2);
        },
        'map-down': function(){
            this.moveMap(3);
        },
        'clear-waypoints': function(){
            this.clearWaypoints();
        },
        'save-waypoints': function(){
            this.saveWaypoints();
        },
        'load-waypoints': function(contents){
            this.loadWaypoints(contents);
        },
        'hide-waypoints': function(){
            this.hideWaypoints();
        },
        'show-waypoints': function(){
            this.showWaypoints();
        },
    }
};
</script>

<style lang="stylus">
@import '~styles/_variables';

#map-display {
    margin-left: 5cm;
    height: 100%;
}

#map {
    width: 100%;
    height: 100%;
    z-index: 1;
}

#overlay {
    position: absolute;
    top: 48px;
    left: 5cm;
    z-index: 2;
    pointer-events: none;
}
</style>
