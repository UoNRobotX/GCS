<template>
    <div class="view params-view">
        <div class="page">
            <h1 class="page-header">
                <span class="title">Params</span>
                <ui-button class="pull-right" color="primary" @click="saveParams">Save</ui-button>
                <ui-button class="pull-right" color="primary" @click="resetParams">Reset</ui-button>
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
                                @changed="paramChanged(currentSection.title, section.title, param.title, param.value)"
                            ></ui-textbox>
                        </div>
                    </ui-collapsible>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import {
    getParameters,
    getMessageStateWaiting, getMessageStateSuccess, getMessageStateFailure,
    getSetParametersState, getSetParametersData
} from 'store/getters';
import {
    sendSetParameters, failSetParameters,
    sendGetParameters
} from 'store/actions';

export default {
    vuex: {
        getters: {
            parameters:           getParameters,
            WAITING:              getMessageStateWaiting,
            SUCCESS:              getMessageStateSuccess,
            FAILURE:              getMessageStateFailure,
            setParametersState:    getSetParametersState,
            setParametersData:     getSetParametersData
        },

        actions: {
            sendSetParameters,
            failSetParameters,
            sendGetParameters
        }
    },

    data() {
        return {
            currentSectionIndex: 0,
            changedParams: Object.create(null) //an empty map
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

        paramChanged(section, subsection, param, value){
            // TODO: ensure section-subsection-param string doesn't contain unexpected characters
            this.changedParams[section + '|' + subsection + '|' + param] = value;
        },

        saveParams(){
            var data = [];
            for (var name in this.changedParams){
                //console.log(name + ': ' + this.changedParams[name]);
                data.push({title: name, value: this.changedParams[name]});
            }
            this.sendSetParameters(data);
            setTimeout(() => {
                if (this.setParametersState == this.WAITING){
                    this.failSetParameters('Timeout reached.');
                }
            }, 1000);
        },

        resetParams(){
            this.sendGetParameters();
            setTimeout(() => {
                if (this.getParametersState == this.WAITING){
                    this.failGetParameters('Timeout reached.');
                }
            }, 1000);
            //the reset of the response handling is currently done in SocketIoManager.vue
        }
    },

    watch: {
        setParametersState(state, oldState){
            if (state != oldState){
                if (state == this.SUCCESS){
                    console.log('Parameters set.');
                    this.changedParams = Object.create(null);
                } else if (state == this.FAILURE){
                    console.log('Unable to set parameters: ' + this.setParametersData);
                }
            }
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

        .ui-button {
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
        font-size: 18px;
        color: $dark-primary;

        &.selected {
            background-color: #EEE;
            color: $primary;
        }
    }

    .pull-right {
        float: right;
    }
}
</style>
