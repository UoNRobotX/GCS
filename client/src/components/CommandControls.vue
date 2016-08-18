<template>
    <div class="command-controls">
        <div>
            <ui-button color="primary">Upload Mission</ui-button>
        </div>
        <div>
            <ui-button color="primary">Arm</ui-button>
        </div>
        <div>
            <ui-button color="primary">Start</ui-button>
        </div>
        <div>
            <ui-button color="primary">Kill Switch</ui-button>
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

.command-controls > div {
    padding-top: 10px;
    padding-left: 10px;
    padding-right: 10px;
    &:last-child {
        padding-bottom: 10px;
    }
}
</style>
