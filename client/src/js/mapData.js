import loadGoogleMapsAPI from 'load-google-maps-api';

export default class MapData {
    constructor(){
        this._element = null;
        this._map = null;
        //start loading map
        loadGoogleMapsAPI({
            v: 3,
            key: 'AIzaSyABnCcekyPecGnsA1Rj_NdWjmUafJ1yVqA',
        }).then((googleMaps) => {
            this._element = document.getElementById('map');
            this._map = new googleMaps.Map(this._element, {
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
    get element(){return this._element;}
    get map(){return this._map;}
};
