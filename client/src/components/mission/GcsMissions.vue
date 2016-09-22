<template>
    <div class="gcs-missions">
        <div class="sidebar-page">
            <div class="missions-list" v-if="currentView === 'listing'">
                <ui-toolbar title="Missions" hide-nav-icon>
                    <div slot="actions">
                        <ui-icon-button
                            type="clear" icon="add" tooltip="Add mission" @click="addMission"
                        ></ui-icon-button>

                        <ui-icon-button
                            type="clear" icon="file_download" tooltip="Download mission"
                            @click="downloadMission"
                        ></ui-icon-button>

                        <ui-icon-button
                            type="clear" icon="more_vert" has-dropdown-menu
                            dropdown-position="bottom right" :menu-options="overflowMenu"
                            @menu-option-selected="menuOptionSelected"
                        ></ui-icon-button>
                    </div>
                </ui-toolbar>

                <div class="sidebar-page-content">
                    <div class="blank-state" v-if="!missions.length">No missions</div>

                    <gcs-mission-row
                        v-for="(index, mission) in missions" :index="index" :mission="mission"
                        @click="selectMission(index)"
                    ></gcs-mission-row>
                </div>
            </div>

            <component
                v-else :is="currentView" :mission="currentMission" @go-back="showListingView"
            ></component>
        </div>
    </div>
    <!-- hidden input element used for selecting a file to import from -->
    <input type="file" id="import_missions_input" @change="importMission">
    <!-- hidden link used for prompting a download -->
    <a id="export_missions_link"></a>
</template>

<script>
import GcsMission from 'mission/GcsMission.vue';
import GcsMissionRow from 'mission/GcsMissionRow.vue';

import { setMissions, setCurrentMissionIndex } from 'store/actions';
import { getWamv, getMissions, getCurrentMissionIndex, getCurrentMission } from 'store/getters';

export default {
    vuex: {
        getters: {
            wamv:                getWamv,
            missions:            getMissions,
            currentMissionIndex: getCurrentMissionIndex,
            currentMission:      getCurrentMission
        },

        actions: {
            setMissions,
            setCurrentMissionIndex
        }
    },

    data() {
        return {
            currentView: 'listing',
            overflowMenu: [
                { id: 'save',   text: 'Save to server'                   },
                { id: 'load',   text: 'Load from server'                 },
                { id: 'sep1',   text: '',                type: 'divider' },
                { id: 'export', text: 'Export to file'                   },
                { id: 'import', text: 'Import from file'                 },
                { id: 'sep2',   text: '',                type: 'divider' },
                { id: 'clear',  text: 'Clear all'                        }
            ]
        };
    },

    methods: {
        selectMission(index) {
            this.setCurrentMissionIndex(index);
            this.currentView = 'gcs-mission';
        },

        showListingView() {
            this.currentView = 'listing';
            this.setCurrentMissionIndex(-1);
        },

        addMission(){
            this.missions.push({
                title: 'Mission ' + (this.missions.length + 1),
                origin: {lat: this.wamv.position.lat, lng: this.wamv.position.lng},
                waypoints: []
            });
        },

        downloadMission() {
            this.$dispatch('client::get_mission');
        },

        menuOptionSelected(option){
            switch (option.id){
                case 'save': {
                    this.$dispatch('client::set_missions', this.missions);
                    break;
                }
                case 'load': {
                    this.$dispatch('client::get_missions');
                    break;
                }
                case 'import': {
                    //trigger file select
                    document.getElementById('import_missions_input').click();
                    break;
                }
                case 'export': {
                    //create data URI
                    let uri = 'data:application/json,';
                    uri += JSON.stringify(this.missions);
                    uri = encodeURI(uri);
                    //get link to use for download
                    let link = document.getElementById('export_missions_link');
                    link.href = uri;
                    link.download = 'missions.json';
                    //trigger download
                    link.click();
                    break;
                }
                case 'clear': {
                    this.setMissions([]);
                }
            }
        },

        importMission(){
            let files = document.getElementById('import_missions_input').files;
            //get file contents
            if (files.length > 0){
                let file = files[0];
                let reader = new FileReader();
                //specify function to call when file has been read
                reader.onload = (e) => {
                    let contents = e.target.result;
                    try {
                        let newMissions = JSON.parse(contents);
                        if (!this.isMissionList(newMissions)){
                            console.log('File content does not represent a valid mission list');
                        } else {
                            this.setMissions(newMissions);
                        }
                    } catch (e){
                        console.log('File content is not valid JSON: ' + e.message);
                    }
                };
                //start file read
                reader.readAsText(file);
            }
        },

        isMissionList(data){
            if (!Array.isArray(data)){
                return false;
            }
            for (var i = 0; i < data.length; i++){
                var mission = data[i];
                if (typeof mission != 'object' ||
                    typeof mission.title != 'string' ||
                    typeof mission.origin != 'object' ||
                    typeof mission.origin.lat != 'number' ||
                    typeof mission.origin.lng != 'number' ||
                    !Array.isArray(mission.waypoints)){
                    return false;
                }
                for (var j = 0; j < mission.waypoints.length; j++){
                    var wp = mission.waypoints[j];
                    if (typeof wp != 'object' ||
                        !wp.hasOwnProperty('title') ||
                        typeof wp.title != 'string' ||
                        !wp.hasOwnProperty('type') ||
                        typeof wp.type != 'string' ||
                        !wp.hasOwnProperty('visible') ||
                        typeof wp.visible != 'boolean' ||
                        !wp.hasOwnProperty('position') ||
                        typeof wp.position != 'object' ||
                        !wp.position.hasOwnProperty('lat') ||
                        typeof wp.position.lat != 'number' ||
                        !wp.position.hasOwnProperty('lng') ||
                        typeof wp.position.lng != 'number'){
                        return false;
                    }
                }
            }
            return true;
        }
    },

    events: {
        'delete-mission'(index){
            this.missions.splice(index, 1);
        },

        'delete-waypoint'(index){
            this.currentMission.waypoints.splice(index, 1);
        }
    },

    components: {
        GcsMission,
        GcsMissionRow
    }
};
</script>

<style lang="stylus">
@import '~styles/_variables';

.gcs-missions,
.missions-list {
    height: 100%
    overflow: hidden;
}

#import_missions_input,
#export_missions_link {
    display: none;
}
</style>
