<template>
    <div id="map-display">
        <div id="map"></div>
        <canvas id="overlay"></canvas>
    </div>
</template>

<script>
import loadGoogleMapsAPI from 'load-google-maps-api';
import THREE from 'three';

//starting loading a map using the google maps API
    //the map object will be stored in the 'map' member of a 'mapData' object
    //this is done so that it can be referred to by a handler that the API calls when loaded
let mapData = {
    map: null,
    load() {
        loadGoogleMapsAPI({
            v: 3,
            key: 'AIzaSyABnCcekyPecGnsA1Rj_NdWjmUafJ1yVqA',
        }).then((googleMaps) => {
            let mapElement = document.getElementById('map');
            this.map = new googleMaps.Map(mapElement, {
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
    load(){
        window.addEventListener('load', () => {
            let overlayElement = document.getElementById('overlay');
            //set overlay size
            let mapElement = document.getElementById('map');
            overlayElement.width = mapElement.clientWidth;
            overlayElement.height = mapElement.clientHeight;
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
                    canvas: overlayElement,
                    antialias: true,
                    alpha: true,
                });
                console.log('WebGL renderer loaded');
            } else {
                //this.renderer = new THREE.CanvasRenderer({canvas: overlayElement}); //couldn't get this to work
                console.log('Unable to load WebGL overlay');
                return;
            }
            //test overlay
            let renderer = this.renderer;
            renderer.setSize(overlayElement.width, overlayElement.height);
            let scene = new THREE.Scene();
            let camera = new THREE.PerspectiveCamera(75, overlayElement.width/overlayElement.height, 0.1, 1000);
            let geometry = new THREE.BoxGeometry(1, 1, 1);
            let material = new THREE.MeshBasicMaterial({color: 0x00ff00});
            let cube = new THREE.Mesh(geometry, material);
            scene.add(cube);
            camera.position.z = 5;
            function render(){
                requestAnimationFrame(render);
                cube.rotation.x += 0.02;
                cube.rotation.y += 0.02;
                renderer.render(scene, camera);
            };
            render();
        });
    }
};
overlayData.load();


//when window is resized, resize overlay
window.addEventListener('resize', () => {
    let mapElement = document.getElementById('map');
    let overlayElement = document.getElementById('overlay');
    overlayElement.width = mapElement.clientWidth;
    overlayElement.height = mapElement.clientHeight;
});

export default {
    data() {
        return {
            mapData: mapData,
            overlayData: overlayData,
        };
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
