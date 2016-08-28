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
import { getMissions, getCurrentMissionIndex } from 'store/getters';

export default {
    vuex: {
        getters: {
            missions: getMissions,
            currentMissionIndex: getCurrentMissionIndex
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
                { id: 'import', text: 'Import from file' },
                { id: 'export', text: 'Export to file' },
                { id: 'clear', text: 'Clear all' }
            ]
        };
    },

    computed: {
        currentMission() {
            return this.missions[this.currentMissionIndex];
        }
    },

    methods: {
        selectMission(index) {
            this.setCurrentMissionIndex(index);
            this.currentView = 'gcs-mission';
        },

        showListingView() {
            this.currentView = 'listing';
        },

        addMission(){
            this.missions.push({
                title: 'Mission ' + (this.missions.length + 1),
                description: null,
                waypoints: []
            })
        },

        menuOptionSelected(option){
            if (option.id == 'import'){
                //trigger file select
                document.getElementById('import_missions_input').click();
            } else if (option.id == 'export'){
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
            } else if (option.id == 'clear'){
                this.setMissions([]);
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
                        // TODO: verify missions object format
                        this.setMissions(newMissions);
                    } catch (e){
                        console.log('file contents are invalid: ' + e.message);
                    }
                };
                //start file read
                reader.readAsText(file);
            }
        }
    },

    events: {
        'delete-mission'(index){
            this.missions.splice(index, 1);
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
