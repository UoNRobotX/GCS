<template>
    <div class="view params-view">
        <div class="page">
            <h1 class="page-header">
                <span class="title">Params</span> <ui-button class="pull-right" color="primary">Save</ui-button>
            </h1>

            <div class="page-content">
                <div class="page-sidebar">
                    <div class="sidebar-menu">
                        <a
                            href="#" class="sidebar-menu-item" v-for="(index, section) in params"
                            @click="selectSection(index)" :class="{ 'selected': index === currentSectionIndex }"
                        >{{ section.title }}</a>
                    </div>
                </div>

                <div class="page-main">
                    <ui-collapsible
                        v-for="section in currentSection.subSections" :header="section.title"
                    >
                        <div class="param" v-for="param in section.params">
                            <ui-textbox
                                :label="param.title" :type="param.type === 'double' ? 'number' : null"
                                :name="param.title" :value.sync="param.value"
                            ></ui-textbox>
                        </div>
                    </ui-collapsible>
                </div>

                <!-- display parameters (up to hierarchy depth 3) -->
               <!--  <div v-for="(name, val) in parameters">
                    <span v-if="isArray(val)"
                        v-text="name + ' (' + val[0] + '): ' + val[1]"
                    ></span>
                    <div v-else>
                        <span v-text="name"></span>
                        <div v-for="(name2, val2) in val">
                            <span v-if="isArray(val2)"
                                v-text="'> ' + name2 + ' (' + val2[0] + '): ' + val2[1]"
                            ></span>
                            <div v-else>
                                <span v-text="'> ' + name2"></span>
                                <div v-for="(name3, val3) in val2">
                                    <span v-if="isArray(val3)"
                                        v-text="'> > ' + name3 + ' (' + val3[0] + '): ' + val3[1]"
                                    ></span>
                                    <span v-else
                                        v-text="'> > ' + name3 + ': ...'">
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div> -->
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
            params: [{
                title: 'State Estimator',
                subSections: [{
                    title: 'IMU',
                    params: [{
                        title: 'mag_scale',
                        type: 'double',
                        value: 0
                    }, {
                        title: 'mag vector',
                        type: 'vector3',
                        value: '0,0,0' // [0, 0, 0]
                    }, {
                        title: 'Rib',
                        type: 'mat3',
                        value: '0,0,0;0,0,0;0,0,0' // [0, 0, 0, 0, 0, 0, 0, 0, 0]
                    }, {
                        title: 'rIBb',
                        type: 'vec3',
                        value: '0,0,0' // [0, 0, 0]
                    }, {
                        title: 'gbBNi',
                        type: 'vec3',
                        value: '0,0,0' // [0, 0, 0]
                    }]
                }, {
                    title: 'Test Section',
                    params: [{
                        title: 'mag_scale',
                        type: 'double',
                        value: 0
                    }, {
                        title: 'mag vector',
                        type: 'vector3',
                        value: '0,0,0' // [0, 0, 0]
                    }, {
                        title: 'Rib',
                        type: 'mat3',
                        value: '0,0,0;0,0,0;0,0,0' // [0, 0, 0, 0, 0, 0, 0, 0, 0]
                    }, {
                        title: 'rIBb',
                        type: 'vec3',
                        value: '0,0,0' // [0, 0, 0]
                    }, {
                        title: 'gbBNi',
                        type: 'vec3',
                        value: '0,0,0' // [0, 0, 0]
                    }]
                }]
            }]
        };
    },

    computed: {
        currentSection() {
            return this.params[this.currentSectionIndex];
        }
    },

    methods: {
        selectSection(index) {
            this.currentSectionIndex = index;
        },

        isArray(x){
            return Array.isArray(x); //Vue doesn't like it if I use this directly
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
