import THREE from 'three';

//this is for using the canvas renderer when WebGL is not available
import loadCanvasRenderer from 'js/CanvasRenderer.js';
import loadProjector from 'js/Projector.js';
loadCanvasRenderer(THREE);
loadProjector(THREE);

export default class OverlayData {
    constructor(){
        this._element = null;
        this._renderer = null;
    }
    get element(){return this._element;}
    get renderer(){return this._renderer;}
    load(){
        let element = document.getElementById('overlay');
        let renderer = null;
        //set overlay size
        let mapElement = document.getElementById('map');
        element.width = mapElement.clientWidth;
        element.height = mapElement.clientHeight;
        //initialise renderer
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
        if (webglAvailable(element)) {
            renderer = new THREE.WebGLRenderer({
                canvas: element,
                antialias: true,
                alpha: true,
            });
        } else {
            renderer = new THREE.CanvasRenderer({
                canvas: element,
                alpha: true}
            );
            console.log('Unable to load WebGL overlay. Using canvas renderer instead.');
        }
        //create scene, and start animation loop
        let width = element.width;
        let height = element.height;
        renderer.setSize(width, height);
        let scene = new THREE.Scene();
        let camera = new THREE.OrthographicCamera(width/-2, width/2, height/2, height/-2, 0.1, 1000);
        camera.position.z = 100;
        scene.add(camera);
        let geometry = new THREE.CircleGeometry(50, 32); //radius, segments
        let material = new THREE.MeshBasicMaterial({color: 0x00FF00, overdraw: true});
            //the 'overdraw' seems to prevent the canvas renderer showing wireframes
        let circle = new THREE.Mesh(geometry, material);
        scene.add(circle);
        function render(){
            requestAnimationFrame(render);
            renderer.render(scene, camera);
        };
        render();
        //when window is resized, resize overlay and renderer
        window.addEventListener('resize', () => {
            element.width = mapElement.clientWidth;
            element.height = mapElement.clientHeight;
            renderer.setSize(element.width, element.height);
        });
        //update members
        this._element = element;
        this._renderer = renderer;
    }
}

