<template>
    <div class="gcs-map-controls">
        <div class="pan-controls">
            <ui-icon-button
                class="pan-control up" icon="keyboard_arrow_up" @click="pan('up')"
            ></ui-icon-button>

            <ui-icon-button
                class="pan-control right" icon="keyboard_arrow_right" @click="pan('right')"
            ></ui-icon-button>

            <ui-icon-button
                class="pan-control down" icon="keyboard_arrow_down" @click="pan('down')"
            ></ui-icon-button>

            <ui-icon-button
                class="pan-control left" icon="keyboard_arrow_left" @click="pan('left')"
            ></ui-icon-button>

            <ui-icon-button
                class="pan-control center" icon="my_location" @click="pan('center')"
            ></ui-icon-button>
        </div>

        <div class="zoom-controls">
            <ui-icon-button
                class="zoom-control in" icon="add" @click="zoom('in')"
            ></ui-icon-button>

            <ui-icon-button
                class="zoom-control out" icon="remove" @click="zoom('out')"
            ></ui-icon-button>
        </div>

        <div class="type-control">
            <ui-button
                :menu-options="mapTypesMenu" name="map_types" :text="mapType"
                @menu-option-selected="changeMapType" has-dropdown-menu raised
                dropdown-position="top right" :show-dropdown-icon="false"
            ></ui-button>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            mapType: 'Satellite',
            mapTypesMenu: [
                { 'value': 'ROADMAP', text: 'Road' },
                { 'value': 'TERRAIN', text: 'Terrain' },
                { 'value': 'SATELLITE', text: 'Satellite' },
                { 'value': 'HYBRID', text: 'Hybrid' }
            ]
        };
    },

    methods: {
        pan(direction) {
            this.$dispatch('map::pan-' + direction);
        },

        zoom(type) {
            this.$dispatch('map::zoom-' + type);
        },

        changeMapType(selected) {
            this.mapType = selected.text;
            this.$dispatch('map::change-type', selected.value);
        }
    }
};
</script>

<style lang="stylus">
@import '~styles/_variables';

.gcs-map-controls {
    position: absolute;
    bottom: 24px;
    right: 12px;
    z-index: 1;

    .pan-controls {
        width: 100px;
        height: 100px;
        position: relative;
    }

    .pan-control {
        position: absolute;
        width: 32px;
        height: 32px;
        padding: 0;
        border-radius: 0;
        box-shadow: 0 2px 5px 0 alpha(black, 0.2), 0 2px 10px 0 alpha(black, 0.16);
        -webkit-mask-image: none;
        background-color: white!important;

        &.up {
            top: 0;
            left: 34px;
            right: auto;
        }

        &.down {
            bottom: 0;
            left: 34px;
        }

        &.left {
            left: 0;
            top: 34px;
        }

        &.right {
            right: 0;
            top: 34px;
        }

        &.center {
            top: 34px;
            left: 34px;

            .ui-icon {
                font-size: 18px;
            }
        }
    }

    .zoom-controls {
        display: flex;
        margin-top: 8px;
        box-shadow: 0 2px 5px 0 alpha(black, 0.2), 0 2px 10px 0 alpha(black, 0.16);

        .zoom-control {
            border-radius: 0;
            width: 50px;
            height: 28px;
            background-color: white!important

            &.in {
                border-right: 1px solid #CCC;
            }
        }
    }

    .type-control {
        margin-top: 8px;

        .ui-button {
            border-radius: 0;
            width: 100px;
            height: 32px;
            background-color: white;
        }
    }
}
</style>
