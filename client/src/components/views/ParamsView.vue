<template>
    <div class="view params-view">
        <div class="page">
            <h1 class="page-header">Params</h1>
            <div class="page-content">
                <!-- display parameters (up to hierarchy depth 3) -->
                <div v-for="(name, val) in parameters">
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
        return {};
    },

    methods: {
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
}
</style>
