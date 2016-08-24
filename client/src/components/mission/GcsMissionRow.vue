<template>
    <div class="gcs-mission-row">
        <ui-icon-button
            type="clear" icon="delete" class="delete-button" tooltip="Delete"
        ></ui-icon-button>

        <h3 class="mission-header" v-text="mission.title"></h3>

        <div class="mission-summary">
            <p class="description" v-if="mission.description" v-text="mission.description"></p>

            <p class="waypoints" v-if="!mission.description && hasWaypoints">
                <span>From: ({{ firstWaypoint.position.lat }}, {{ firstWaypoint.position.lng }})</span>
                <span>To: ({{ lastWaypoint.position.lat }}, {{ lastWaypoint.position.lng }})</span>
            </p>

            <p class="no-waypoints" v-if="!mission.description && !hasWaypoints">No waypoints</p>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        mission: {
            type: Object,
            required: true
        }
    },

    computed: {
        hasWaypoints() {
            return this.mission.waypoints && this.mission.waypoints.length;
        },

        firstWaypoint() {
            return this.mission.waypoints[0];
        },

        lastWaypoint() {
            return this.mission.waypoints[this.mission.waypoints.length - 1];
        }
    }
};
</script>

<style lang="stylus">
@import '~styles/_variables';

.gcs-mission-row {
    padding: 12px;
    position: relative;
    border-bottom: 1px solid #EEE;

    &:hover,
    &:focus {
        background-color: #EEE;
        cursor: pointer;
        padding-right: 48px;

        .mission-header {
            color: $primary-darker;
        }

        .delete-button {
            display: block;
        }
    }

    .mission-header {
        margin: 0;
        font-weight: normal;
        font-size: 1.1em;
        width: 100%;
        @extends $truncate-text;
    }

    .mission-summary {
        padding-top: 8px;
        padding-bottom: 8px;
        font-size: 0.9em;
        line-height: 1;
        color: #777;

        p {
            margin: 0;
            padding: 0;
            @extends $truncate-text;
        }
    }

    .no-waypoints {
        padding: 0;
        margin: 0;
        color: #AAA;
    }

    .delete-button {
        right: 6px;
        position: absolute;
        display: none;
        color: $dark-secondary;

        &:hover {
            color: $dark-primary;
        }

        .ui-icon {
            font-size: 20px;
        }
    }
}
</style>
