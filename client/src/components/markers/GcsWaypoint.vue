<template>
    <div class="gcs-waypoint" :class="{ 'highlighted': (dragging || highlighted) }">
        <div class="number" v-text="index + 1"></div>

        <div class="content">
            <div class="row">
                <ui-textbox
                    class="column" label="Title" name="title" :value.sync="title"
                ></ui-textbox>
            </div>

            <div class="row">
                <ui-textbox
                    class="column one-half" label="Latitude" name="latitude" :value.sync="lat"
                    type="number" :step="0.00001"
                ></ui-textbox>

                <ui-textbox
                    class="column one-half" label="Longitude" name="longitude" :value.sync="lng"
                    type="number" :step="0.00001"
                ></ui-textbox>
            </div>

            <div class="row">
                <ui-select
                    class="column one-half" label="Type" name="type" :value.sync="type"
                    :options="[{ text: 'Normal', value: 'normal' }]" :default="type"
                ></ui-select>
            </div>
        </div>
    </div>
</template>

<script>
import isMarker from 'mixins/is-marker';
import element from 'util/element-scroll';

export default {
    props: {
        index: Number,
        label: {
            type: String,
            coerce: String
        },
        title: {
            type: String,
            coerce(value) {
                return value ? String(value) : '';
            }
        },
        type: {
            type: String,
            default: 'normal'
        }
    },

    data() {
        return {
            dragging: false,
            highlighted: false
        };
    },

    events: {
        click() {
            element.scrollIntoView(this.$el, null, 56); // 56px margin for UiToolbar
        },

        drag(e) {
            this.lat = Number( parseFloat(e.latLng.lat()).toFixed(7) );
            this.lng = Number( parseFloat(e.latLng.lng()).toFixed(7) );
        },

        mouseover() {
            this.highlighted = true;
        },

        mouseout() {
            this.highlighted = false;
        },

        dragstart() {
            this.dragging = true;
        },

        dragend() {
            this.dragging = false;
        }
    },

    methods: {
        getIcon(scale = this.scale, rotation = this.rotation) {
            return null;

            // {
            //     // path: google.maps.SymbolPath.CIRCLE,
            //     rotation: rotation,
            //     scale: scale,
            //     fillColor: 'yellow',
            //     fillOpacity: 0.8,
            //     strokeColor: 'white',
            //     strokeWeight: 2
            // };
        }
    },

    mixins: [
        isMarker
    ]
};
</script>

<style lang="stylus">
@import '~styles/_variables';

.gcs-waypoint {
    display: flex;
    padding: 8px 12px;
    padding-top: 12px;
    background-color: white;
    transition: background-color 0.1s ease;

    &:not(:first-child) {
        padding-top: 18px;
        border-top: 1px solid #DDD;
    }

    &.highlighted {
        background-color: rgba(33, 150, 243, 0.15);
    }

    .number {
        font-size: 18px;
        margin-right: 16px;
        line-height: 1;
        font-weight: bold;
        min-width: 24px;
    }

    .content {
        flex-grow: 1;
    }
}
</style>