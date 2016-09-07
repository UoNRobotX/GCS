<template>
    <ui-modal :show.sync="show" class="gcs-edit-mission-modal" header="Edit mission" @opened="opened">
        <ui-textbox
            label="Mission title" name="mission_title" :value.sync="missionTitle"
            validation-rules="required" v-el:input
        ></ui-textbox>

        <div slot="footer">
            <ui-button color="primary" @click="save">Save</ui-button>
            <ui-button @click="show = false">Cancel</ui-button>
        </div>
    </ui-modal>
</template>

<script>
import { getMissions, getCurrentMissionIndex } from 'store/getters';
import { setCurrentMissionTitle } from 'store/actions';

export default {
    vuex: {
        getters: {
            missions: getMissions,
            currentMissionIndex: getCurrentMissionIndex
        },

        actions: {
            setCurrentMissionTitle
        }
    },

    props: {
        show: {
            type: Boolean,
            required: true,
            twoWay: true
        }
    },

    data() {
        return {
            missionTitle: ''
        };
    },

    computed: {
        mission() {
            if (this.currentMissionIndex === -1) {
                return {};
            }

            return this.missions[this.currentMissionIndex];
        }
    },

    methods: {
        opened() {
            this.missionTitle = this.mission.title || '';
            this.$els.input.querySelector('input').focus();
        },

        save() {
            this.setCurrentMissionTitle(this.missionTitle);
            this.show = false;
        }
    }
};
</script>
