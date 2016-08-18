<template>
    <div class="planning-controls">
        <div>
            <ui-button color="primary">Add</ui-button>
        </div>
        <div>
            <ui-button color="primary">Delete</ui-button>
        </div>
        <div>
            <ui-button color="primary">Clear</ui-button>
        </div>
        <div>
            <ui-button color="primary">Save</ui-button>
            <ui-button color="primary">Load</ui-button>
        </div>
        <div>
            <ui-button color="primary">Hide</ui-button>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {};
    }
};
</script>

<style lang="stylus">
@import '~styles/_variables';

.planning-controls > div {
    padding-top: 10px;
    padding-left: 10px;
    padding-right: 10px;
    &:last-child {
        padding-bottom: 10px;
    }
}
</style>
