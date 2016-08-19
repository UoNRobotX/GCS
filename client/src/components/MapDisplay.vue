<template>
    <div id="map-display">
        <div id="map"></div>
        <canvas id="overlay"></canvas>
    </div>
</template>

<script>
import loadGoogleMapsAPI from 'load-google-maps-api';
import THREE from 'three';

//this is for using the canvas renderer when WebGL is not available
import loadCanvasRenderer from 'js/CanvasRenderer.js';
import loadProjector from 'js/Projector.js';
loadCanvasRenderer(THREE);
loadProjector(THREE);

//starting loading a map using the google maps API
    //the map object will be stored in the 'map' member of a 'mapData' object
    //this is done so that it can be referred to by a handler that the API calls when loaded
let mapData = {
    map: null,
    element: null,
    load() {
        loadGoogleMapsAPI({
            v: 3,
            key: 'AIzaSyABnCcekyPecGnsA1Rj_NdWjmUafJ1yVqA',
        }).then((googleMaps) => {
            this.element = document.getElementById('map');
            this.map = new googleMaps.Map(this.element, {
                center: {lat: 21.308731, lng: -157.888815},
                zoom: 17,
                tilt: 0,
                mapTypeId: google.maps.MapTypeId.SATELLITE,
                disableDefaultUI: true,
                disableDoubleClickZoom: true,
                draggableCursor: 'pointer',
                draggingCursor: 'crosshair',
            });
        }).catch((err) => {
            console.log('Unable to load map');
        });
    }
};
mapData.load();

//initialise overlay when document is loaded
let overlayData = {
    renderer: null,
    element: null,
    load(){
        window.addEventListener('load', () => {
            this.element = document.getElementById('overlay');
            //set overlay size
            let mapElement = document.getElementById('map');
            this.element.width = mapElement.clientWidth;
            this.element.height = mapElement.clientHeight;
            //initialise overlay renderer
            function webglAvailable() {
                try {
                    let canvas = document.createElement('canvas');
                    return !!(window.WebGLRenderingContext && (
                        canvas.getContext('webgl') ||
                        canvas.getContext('experimental-webgl'))
                    );
                } catch (e) {
                    return false;
                }
            }
            if (webglAvailable()) {
                this.renderer = new THREE.WebGLRenderer({
                    canvas: this.element,
                    antialias: true,
                    alpha: true,
                });
                console.log('WebGL renderer loaded');
            } else {
                this.renderer = new THREE.CanvasRenderer({canvas: this.element, alpha: true});
                console.log('Unable to load WebGL overlay. Using canvas renderer instead.');
            }
            //create scene, and start animation loop
            let width = this.element.width;
            let height = this.element.height;
            this.renderer.setSize(width, height);
            let scene = new THREE.Scene();
            let camera = new THREE.OrthographicCamera(width/-2, width/2, height/2, height/-2, 0.1, 1000);
            camera.position.z = 100;
            scene.add(camera);
            let geometry = new THREE.CircleGeometry(50, 32); //radius, segments
            let material = new THREE.MeshBasicMaterial({color: 0x00FF00, overdraw: true});
                //the 'overdraw' seems to prevent the canvas renderer showing wireframes
            let circle = new THREE.Mesh(geometry, material);
            scene.add(circle);
            let renderer = this.renderer;
            function render(){
                requestAnimationFrame(render);
                renderer.render(scene, camera);
            };
            render();
            //when window is resized, resize overlay and renderer
            window.addEventListener('resize', () => {
                let mapElement = document.getElementById('map');
                this.element.width = mapElement.clientWidth;
                this.element.height = mapElement.clientHeight;
                this.renderer.setSize(this.element.width, this.element.height);
            });
        });
    }
};
overlayData.load();

export default {
    data() {
        return {
            mapData: mapData,
            overlayData: overlayData,
        };
    },
    events: {
        'map-center': function(){
            //center the map on the WAM-V
            let latLng = {lat: 21.308731, lng: -157.888815};
            this.mapData.map.panTo(latLng);
        },
        'map-zoom-in': function(){
            this.mapData.map.setZoom(this.mapData.map.getZoom()+1);
        },
        'map-zoom-out': function(){
            this.mapData.map.setZoom(this.mapData.map.getZoom()-1);
        },
        'map-type': function(value){
            this.mapData.map.setMapTypeId(google.maps.MapTypeId[value]);
        },
        'map-up': function(){
            let px = overlayData.element.height/4;
            this.mapData.map.panBy(0,-px);
        },
        'map-left': function(){
            let px = overlayData.element.width/4;
            this.mapData.map.panBy(-px,0);
        },
        'map-right': function(){
            let px = overlayData.element.width/4;
            this.mapData.map.panBy(px,0);
        },
        'map-down': function(){
            let px = overlayData.element.height/4;
            this.mapData.map.panBy(0,px);
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
