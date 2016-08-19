export default class MapData {
    constructor(){
        this._element = null;
        this._map = null;
    }
    get element(){return this._element;}
    get map(){return this._map;}
    load(googleMaps){
        //get map element
        let element = document.getElementById('map');
        //create map
        let map = new googleMaps.Map(element, {
            center: {lat: 21.308731, lng: -157.888815},
            zoom: 17,
            tilt: 0,
            mapTypeId: google.maps.MapTypeId.SATELLITE,
            disableDefaultUI: true,
            disableDoubleClickZoom: true,
            draggableCursor: 'pointer',
            draggingCursor: 'crosshair',
        });
        //update members
        this._element = element;
        this._map = map;
    }
};
