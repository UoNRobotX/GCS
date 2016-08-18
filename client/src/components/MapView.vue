<template>
    <div class="view map-view">
        <div id="map-sidebar">
            <div class="button-set">
                <div>
                    <ui-button color="primary">Add</ui-button>
                </div>
                <div>
                    <ui-button color="primary">Delete</ui-button>
                </div>
                <div>
                    <ui-button color="primary">Clear</ui-button>
                </div>
                <div>
                    <ui-button color="primary">Save</ui-button>
                    <ui-button color="primary">Load</ui-button>
                </div>
                <div>
                    <ui-button color="primary">Hide</ui-button>
                </div>
            </div>
            <hr>
            <div class="button-set">
                <div>
                    <ui-button color="primary">Upload Mission</ui-button>
                </div>
                <div>
                    <ui-button color="primary">Arm</ui-button>
                </div>
                <div>
                    <ui-button color="primary">Start</ui-button>
                </div>
                <div>
                    <ui-button color="primary">Kill Switch</ui-button>
                </div>
            </div>
        </div>
        <div id="map">
            Map
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            waypoints: [],
            hidden: false,
        };
    }
};
</script>

<style lang="stylus">
@import '~styles/_variables';

#map-sidebar {
    background-color: #444;
    float: left;
    height: 100%;
    > .button-set > div {
        padding-top: 10px;
        padding-left: 10px;
        padding-right: 10px;
        &:last-child {
            padding-bottom: 10px;
        }
    }
}
</style>
