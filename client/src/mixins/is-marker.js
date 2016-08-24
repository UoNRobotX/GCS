import { getMap, getMapEl, getMapLoaded } from 'store/getters';

export default {
    vuex: {
        getters: {
            map: getMap,
            mapEl: getMapEl,
            mapLoaded: getMapLoaded
        }
    },

    props: {
        title: String,
        lat: {
            type: Number,
            required: true
        },
        lng:  {
            type: Number,
            required: true
        },
        rotation: {
            type: Number,
            default: 0
        },
        scale: {
            type: Number,
            default: 6
        },
        visible: {
            type: Boolean,
            default: true
        },
        draggable: {
            type: Boolean,
            default: false
        }
    },

    data() {
        return {
            marker: null
        };
    },

    computed: {
        position() {
            return {
                lat: this.lat,
                lng: this.lng
            };
        }
    },

    ready() {
        if (this.mapLoaded) {
            this.initializeMarker();
        }
    },

    beforeDestroy() {
        this.marker.setMap(null);
        this.marker = null;
    },

    watch: {
        mapLoaded(newVal, oldVal) {
            if (!oldVal && newVal && !this.marker) {
                this.initializeMarker();
            }
        },

        map() {
            if (this.marker) {
                this.marker.setMap(this.map);
            }
        },

        title() {
            if (this.marker) {
                this.marker.setTitle(this.title);
            }
        },

        label() {
            if (this.marker) {
                this.marker.setLabel(this.label);
            }
        },

        position() {
            if (this.marker) {
                this.marker.setPosition(this.position);
            }
        },

        visible() {
            if (this.marker) {
                this.marker.setVisible(this.visible);
            }
        },

        draggable() {
            if (this.marker) {
                this.marker.setDraggable(this.draggable);
            }
        },

        rotation() {
            this.updateIcon();
        },

        scale() {
            this.updateIcon();
        }
    },

    methods: {
        initializeMarker() {
            this.marker = new google.maps.Marker({
                position: this.position,
                icon: this.getIcon(),
                draggable: this.draggable,
                visible: this.visible,
                map: this.map
            });

            if (this.title) {
                this.marker.setTitle(this.title);
            }

            if (this.label) {
                this.marker.setLabel(this.label);
            }

            this.$dispatch('initialized', this.marker);

            this.setupEvents();
        },

        updateIcon() {
            if(this.marker) {
                this.marker.setIcon(this.getIcon());
            }
        },

        setupEvents() {
            this.marker.addListener('click', (e) => {
                this.$dispatch('click', e);
            });

            this.marker.addListener('dblclick', (e) => {
                this.$dispatch('dblclick', e);
            });

            this.marker.addListener('rightclick', (e) => {
                this.$dispatch('rightclick', e);
            });

            this.marker.addListener('mouseover', (e) => {
                this.$dispatch('mouseover', e);
            });

            this.marker.addListener('mouseout', (e) => {
                this.$dispatch('mouseout', e);
            });

            this.marker.addListener('dragstart', (e) => {
                this.$dispatch('dragstart', e);
            });

            this.marker.addListener('drag', (e) => {
                this.$dispatch('drag', e);
            });

            this.marker.addListener('dragend', (e) => {
                this.$dispatch('dragend', e);
            });

            this.marker.addListener('position_changed', (e) => {
                this.$dispatch('position_changed', e);
            });
        }
    }
};
