<template>
    <div class="view settings-view">
        <div class="page">
            <h1 class="page-header">
                Settings
                <div class="action-buttons">
                    <ui-button color="primary"
                        @click="saveSettings" :disabled="waitSaveSettings"
                    >Save</ui-button>
                    <ui-button
                        @click="resetSettings" :disabled="waitResetSettings"
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
import { getSettings } from 'store/getters';

export default {
    vuex: {
        getters: {
            settings: getSettings
        }
    },

    data() {
        return {
            changedSettings: Object.create(null), //an empty map
            waitSaveSettings: false,
            waitResetSettings: false
        };
    },

    methods: {
        settingChanged(section, param, value){
            if (section in this.changedSettings){
                this.changedSettings[section][param] = value;
            } else {
                this.changedSettings[section] = {[param]: value};
            }
        },

        saveSettings(){
            let data = [];
            for (let section in this.changedSettings){
                for (let param in this.changedSettings[section]){
                    data.push({
                        section: section,
                        title: param,
                        value: this.changedSettings[section][param]
                    });
                }
            }
            this.waitSaveSettings = true;
            this.$dispatch('client::set_settings', data, 'settingsView');
        },

        resetSettings(){
            this.waitResetSettings = true;
            this.$dispatch('client::get_settings', 'settingsView');
        }
    },

    events: {
        'server.get_settings:success'(msg, initiator){
            this.waitResetSettings = false;
            return true;
        },

        'server.get_settings:failure'(msg, initiator){
            if (initiator === 'settingsView'){
                this.$dispatch('app::create-snackbar', 'Failed to reset settings');
            }
            this.waitResetSettings = false;
            return true;
        },

        'server.set_settings:success'(){
            this.changedSettings = Object.create(null);
            this.waitSaveSettings = false;
            this.$dispatch('app::create-snackbar', 'Settings saved');
        },

        'server.set_settings:failure'(){
            this.waitSaveSettings = false;
            this.$dispatch('app::create-snackbar', 'Failed to save settings');
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
