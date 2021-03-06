<template>
    <div class="gcs-waypoint" :class="{ 'highlighted': (dragging || highlighted) }">
        <div class="number">
            <div v-text="index + 1"></div>
            <ui-icon-button
                type="clear" icon="delete" tooltip="Delete" @click="deleteWaypoint"
                class='delete-button'
            ></ui-icon-button>
        </div>

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
                    class="column one-half" label="Type" name="type" :value.sync="waypointType"
                    :options="[{ text: 'Go To Point', value: 'go_to_point' }]" :default="waypointType"
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
            type: String
        },
        waypointType: {
            type: String
        },
        lat: {
            type: Number
        },
        lng: {
            type: Number
        }
    },

    data() {
        return {
            dragging: false,
            highlighted: false,
            fillColor: {normal: 'yellow', hover: 'lime'}
        };
    },

    events: {
        click() {
            element.scrollIntoView(this.$el, this.$el.parentElement.parentElement, 56);
                // 56px margin for UiToolbar
        },

        rightclick() {
            this.$dispatch('delete');
        },

        drag(e) {
            this.lat = Number( parseFloat(e.latLng.lat()).toFixed(7) );
            this.lng = Number( parseFloat(e.latLng.lng()).toFixed(7) );
        },

        mouseover() {
            this.highlighted = true;
            if (this.marker){
                this.marker.setIcon(this.getIcon(this.fillColor.hover));
            }
        },

        mouseout() {
            this.highlighted = false;
            if (this.marker && !this.dragging){
                this.marker.setIcon(this.getIcon(this.fillColor.normal));
            }
        },

        dragstart() {
            this.dragging = true;
        },

        dragend() {
            this.dragging = false;
        }
    },

    methods: {
        getIcon(fillColor = this.fillColor.normal, scale = this.scale, rotation = this.rotation) {
            return {
                path: google.maps.SymbolPath.CIRCLE,
                rotation: rotation,
                scale: scale,
                fillColor: fillColor,
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 2
            };
        },

        deleteWaypoint(){
            this.$dispatch('delete-waypoint', this.index);
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
        background-color: #FFF9C4;
    }

    .number {
        font-size: 18px;
        margin-right: 16px;
        line-height: 1;
        font-weight: bold;
        min-width: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .content {
        flex-grow: 1;
    }

    .delete-button {
        color: $dark-secondary;
        height: 32px;
        width: 32px;
        margin-top: 16px;

        .ui-icon {
            font-size: 20px;
        }

        &:hover {
            color: $dark-primary;
        }
    }
}
</style>
