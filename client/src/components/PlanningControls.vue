<template>
    <div class="planning-controls">
        <div>
            <ui-button color="primary" v-on:click="clear">Clear</ui-button>
        </div>
        <div>
            <ui-button color="primary" v-on:click="save">Save</ui-button>
            <ui-button color="primary" v-on:click="load">Load</ui-button>
        </div>
        <div>
            <ui-button color="primary" v-on:click="toggleHide">{{ hidden ? 'Show': 'Hide'}}</ui-button>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            hidden: false
        };
    },
    methods: {
        clear(){
            this.$dispatch('clear-waypoints-event');
            if (this.hidden){
                this.hidden = false;
                this.$dispatch('show-waypoints-event');
            }
        },
        save(){
            this.$dispatch('save-waypoints-event');
        },
        load(){
            this.$dispatch('load-waypoints-event');
        },
        toggleHide(){
            if (this.hidden){
                this.$dispatch('show-waypoints-event');
            } else {
                this.$dispatch('hide-waypoints-event');
            }
            this.hidden = !this.hidden;
        },
    }
};
</script>

<style lang="stylus">
@import '~styles/_variables';

.planning-controls > div {
    padding-top: 10px;
    padding-left: 10px;
    padding-right: 10px;
    &:last-child {
        padding-bottom: 10px;
    }
}
</style>
