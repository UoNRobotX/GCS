<template>
    <div class="planning-controls">
        <div>
            <ui-button color="primary" v-on:click="clear">Clear</ui-button>
        </div>
        <div>
            <ui-button color="primary" v-on:click="save">Save</ui-button>
            <a id="save_waypoints_link" class="hidden"></a>
            <ui-button color="primary" v-on:click="clicked_load">Load</ui-button>
            <input type="file" id="load_waypoints_input" class="hidden" v-on:change="load">
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
        clicked_load(){
            //activate file selection dialog
            document.getElementById('load_waypoints_input').click();
        },
        load(){
            let files = document.getElementById('load_waypoints_input').files;
            //get file contents
            if (files.length > 0){
                let file = files[0];
                let reader = new FileReader();
                //specify function to call when file has been read
                reader.onload = (e) => {
                    let contents = e.target.result;
                    this.$dispatch('load-waypoints-event', contents);
                };
                //start file read
                reader.readAsText(file);
            }
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

.hidden {
    display: none;
}
</style>
