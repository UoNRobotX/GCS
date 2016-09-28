<template>
    <div class="view settings-view">
        <div class="page">
            <h1 class="page-header">
                Settings
                <div class="action-buttons">
                    <ui-button color="primary"
                        @click="saveSettings"
                    >Save</ui-button>
                    <ui-button
                        @click="resetSettings"
                    >Reset</ui-button>
                </div>
            </h1>
            <div class="page-content">
                <div class="page-main">
                    <ui-collapsible v-for="section in settings" :header="section.title">
                        <div class="setting" v-for="setting in section.settings">
                            <ui-textbox
                                :label="setting.title" :name="setting.title" :value.sync="setting.value"
                                @changed="settingChanged(section.title, setting.title, setting.value)"
                            ></ui-textbox>
                        </div>
                    </ui-collapsible>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { getSettings, getSettingsLastUpdateTime } from 'store/getters';

export default {
    vuex: {
        getters: {
            settings: getSettings,
            settingsLastUpdateTime: getSettingsLastUpdateTime
        }
    },

    data() {
        return {
            changedSettings: {},
            lastSetSettingsAckTime: null,
            TIMEOUT: 1000
        };
    },

    methods: {
        settingChanged(section, param, value){
            if (this.changedSettings.hasOwnProperty(section)){
                this.changedSettings[section][param] = value;
            } else {
                this.changedSettings[section] = {[param]: value};
            }
        },

        saveSettings(){
            let data = [];
            for (let section in this.changedSettings){
                for (let setting in this.changedSettings[section]){
                    data.push({
                        section: section,
                        title:   setting,
                        value:   this.changedSettings[section][setting]
                    });
                }
            }
            this.$dispatch('client::set_settings', data);
            // Show message on timeout
            let requestTime = Date.now();
            setTimeout(() => {
                if (this.lastSetSettingsAckTime < requestTime){
                    this.$dispatch('app::create-snackbar', 'Settings not set within timeout');
                }
            }, this.TIMEOUT);
        },

        resetSettings(){
            this.$dispatch('client::get_settings');
            let requestTime = Date.now();
            setTimeout(() => {
                if (this.settingsLastUpdateTime < requestTime){
                    this.$dispatch('app::create-snackbar', 'Settings not received within timeout');
                }
            }, this.TIMEOUT);
        }
    },

    events: {
        'server::set_settings_ack'(){
            this.lastSetSettingsAckTime = Date.now();
        }
    }
};
</script>

<style lang="stylus">
@import '~styles/_variables';

.view.settings-view {
    padding: 24px;

    .page-header {
        display: flex;
        padding-right: 16px;
        align-items: center;

        .action-buttons {
            margin-left: auto;
        }
    }
}
</style>
