<template>
    <div class="view params-view">
        <div class="page">
            <h1 class="page-header">
                <span class="title">Params</span>
                <div class="action-buttons">
                    <ui-button color="primary"
                        @click="saveParams" :disabled="waitSaveParams"
                    >Save</ui-button>
                    <ui-button
                        @click="resetParams" :disabled="waitResetParams"
                    >Reset</ui-button>
                </div>
            </h1>

            <div class="page-content">
                <div class="page-sidebar">
                    <div class="sidebar-menu">
                        <a
                            href="#" class="sidebar-menu-item" v-for="(index, section) in parameters"
                            @click="selectSection(index)" :class="{ 'selected': index === currentSectionIndex }"
                        >{{ section.title }}</a>
                    </div>
                </div>

                <div class="page-main" v-if="parameters.length > 0">
                    <ui-collapsible
                        v-for="section in currentSection.subSections" :header="section.title"
                    >
                        <div class="param" v-for="param in section.params">
                            <ui-textbox
                                :label="param.title" :name="param.title" :value.sync="param.value"
                                :valid.sync="param.valid"
                                @changed="paramChanged(currentSection.title, section.title, param.title, param.value, param.valid)"
                                :validation-rules="getValidationRule(param.type)"
                            ></ui-textbox>
                            <!-- TODO: decide if using 'param.valid' is appropriate -->
                        </div>
                    </ui-collapsible>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { getParameters } from 'store/getters';

export default {
    vuex: {
        getters: {
            parameters: getParameters
        }
    },

    data() {
        return {
            currentSectionIndex: 0,
            changedParams: Object.create(null), //an empty map
            validationRules: {
                vec3: ['regex:/^(-?\\d*\\.?\\d+,){2}(-?\\d*\\.?\\d+)$/'],
                double: ['regex:/^(-?\\d*\\.?\\d+)$/'],
                mat3: ['regex:/^(-?\\d*\\.?\\d+,){8}(-?\\d*\\.?\\d+)$/']
            },
            waitSaveParams: false,
            waitResetParams: false
        };
    },

    computed: {
        currentSection() {
            return this.parameters[this.currentSectionIndex];
        }
    },

    methods: {
        selectSection(index) {
            this.currentSectionIndex = index;
        },

        isArray(x){
            return Array.isArray(x); //Vue doesn't like it if I use this directly
        },

        paramChanged(section, subsection, param, value, valid){
            if (section in this.changedParams){
                if (subsection in this.changedParams[section]){
                    this.changedParams[section][subsection][param] = {value: value, valid: valid};
                } else {
                    this.changedParams[section][subsection] = {[param]: {value: value, valid: valid}};
                }
            } else {
                this.changedParams[section] = {[subsection]: {[param]: {value: value, valid: valid}}};
            }
        },

        saveParams(){
            let data = [];
            for (let section in this.changedParams){
                for (let subsection in this.changedParams[section]){
                    for (let param in this.changedParams[section][subsection]){
                        if (!this.changedParams[section][subsection][param].valid){
                            this.$dispatch('app::create-snackbar', 'A parameter value is invalid');
                            return;
                        }
                        data.push({
                            section: section,
                            subsection: subsection,
                            title: param,
                            value: this.changedParams[section][subsection][param].value
                        });
                    }
                }
            }
            this.waitSaveParams = true;
            this.$dispatch('client::set_parameters', data, 'paramsView');
        },

        resetParams(){
            this.waitResetParams = true;
            this.$dispatch('client::get_parameters', 'paramsView');
        },

        getValidationRule(type) {
            if (type) {
                return this.validationRules[type];
            }

            return null;
        }
    },

    events: {
        'server.get_parameters:success'(msg, initiator){
            this.waitResetParams = false;
            return true;
        },

        'server.get_parameters:failure'(msg, initiator){
            if (initiator === 'paramsView'){
                this.$dispatch('app::create-snackbar', 'Failed to reset parameters');
            }
            this.waitResetParams = false;
            return true;
        },

        'server.set_parameters:success'(){
            this.changedParams = Object.create(null);
            this.waitSaveParams = false;
            this.$dispatch('app::create-snackbar', 'Parameters saved');
        },

        'server.set_parameters:failure'(){
            this.waitSaveParams = false;
            this.$dispatch('app::create-snackbar', 'Failed to save parameters');
        }
    }
};
</script>

<style lang="stylus">
@import '~styles/_variables';

.view.params-view {
    padding: 24px;

    .page-header {
        display: flex;
        padding-right: 16px;
        align-items: center;

        .action-buttons {
            margin-left: auto;
        }
    }

    .page-content {
        width: 100%;
        display: flex;
        padding: 0;
    }

    .page-sidebar {
        border-right: 1px solid #EEE;
        width: 216px;
        flex-shrink: 0;
    }

    .page-main {
        padding: 16px;
        flex-grow: 1;
    }

    .sidebar-menu {
        padding-top: 16px;
    }

    .sidebar-menu-item {
        display: block;
        padding: 8px;
        padding-left: 24px;
        text-decoration: none;
        color: $dark-primary;

        &.selected {
            background-color: #EEE;
            color: $primary;
        }
    }
}
</style>
