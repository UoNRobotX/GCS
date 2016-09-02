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
                                :label="param.title" :type="param.type === 'double' ? 'number' : null"
                                :name="param.title" :value.sync="param.value"
                            ></ui-textbox>
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
            currentSectionIndex: 0
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
