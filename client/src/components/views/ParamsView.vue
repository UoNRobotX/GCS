<template>
    <div class="view params-view">
        <div class="page">
            <h1 class="page-header">
                <span class="title">Params</span>
                <div class="action-buttons">
                    <ui-button color="primary"
                        @click="saveParams"
                    >Save</ui-button>
                    <ui-button
                        @click="resetParams"
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
                                :label="param.title" :name="param.title"
                                :value.sync="param.value" :valid.sync="param.valid"
                                @changed="paramChanged(currentSection.title, section.title, param.title, param.type, param.value, param.valid)"
                                :validation-rules="getValidationRule(param.type)"
                            ></ui-textbox>
                        </div>
                    </ui-collapsible>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { getParameters, getParametersLastUpdateTime } from 'store/getters';

export default {
    vuex: {
        getters: {
            parameters: getParameters,
            parametersLastUpdateTime: getParametersLastUpdateTime
        }
    },

    data() {
        return {
            currentSectionIndex: 0,
            changedParams: {},
            lastSetParametersAckTime: null,
            validationRules: {
                vec3: ['regex:/^(-?\\d*\\.?\\d+,){2}(-?\\d*\\.?\\d+)$/'],
                double: ['regex:/^(-?\\d*\\.?\\d+)$/'],
                mat3: ['regex:/^(-?\\d*\\.?\\d+,){8}(-?\\d*\\.?\\d+)$/']
            },
            TIMEOUT: 1000
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
            return Array.isArray(x); // Vue doesn't like it if I use this directly
        },

        paramChanged(section, subsection, title, type, value, valid){
            if (this.changedParams.hasOwnProperty(section)){
                if (this.changedParams[section].hasOwnProperty(subsection)){
                    this.changedParams[section][subsection][title] = {
                        type: type, value: value, valid: valid
                    };
                } else {
                    this.changedParams[section][subsection] = {
                        [title]: {type: type, value: value, valid: valid}
                    };
                }
            } else {
                this.changedParams[section] = {
                    [subsection]: {
                        [title]: {type: type, value: value, valid: valid}
                    }
                };
            }
        },

        saveParams(){
            let data = [];
            for (let sectionName in this.changedParams){
                let section = this.changedParams[sectionName];
                for (let subsectionName in section){
                    let subsection = section[subsectionName];
                    for (let paramName in subsection){
                        let param = subsection[paramName];
                        if (!param.valid){
                            this.$dispatch('app::create-snackbar', 'A parameter value is invalid');
                            return;
                        }
                        data.push({
                            section:    sectionName,
                            subsection: subsectionName,
                            title:      paramName,
                            type:       param.type,
                            value:      param.value
                        });
                    }
                }
            }
            this.$dispatch('client::set_parameters', data);
            // Show message on timeout
            let requestTime = Date.now();
            setTimeout(() => {
                if (this.lastSetParametersAckTime < requestTime){
                    this.$dispatch('app::create-snackbar', 'Parameters not set within timeout');
                }
            }, this.TIMEOUT);
        },

        resetParams(){
            this.$dispatch('client::get_parameters');
            let requestTime = Date.now();
            setTimeout(() => {
                if (this.parametersLastUpdateTime < requestTime){
                    this.$dispatch('app::create-snackbar', 'Parameters not received within timeout');
                }
            }, this.TIMEOUT);
        },

        getValidationRule(type) {
            if (type) {
                return this.validationRules[type];
            }

            return null;
        }
    },

    events: {
        'server::set_parameters_ack'(){
            this.lastSetParametersAckTime = Date.now();
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
