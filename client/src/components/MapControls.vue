<template>
    <div class="map-controls">
        <table class="map-controls-buttons1" cellpadding="0" cellspacing="0">
            <tr>
                <td colspan="2">
                    <button class="map-center-button">Center</button>
                </td>
            </tr>
            <tr>
                <td>
                    <button class="map-zoom-in-button">Zoom In</button>
                </td>
                <td>
                    <button class="map-zoom-out-button">Zoom Out</button>
                </td>
            </tr>
            <tr>
                <td colspan="2">
                    <button class="map-center-button">Map Type</button>
                </td>
            </tr>
        </table>
        <table class="map-controls-buttons2" cellpadding="0" cellspacing="0">
            <tr>
                <td></td>
                <td>
                    <button class="map-up-button">^</button>
                </td>
                <td></td>
            </tr>
            <tr>
                <td>
                    <button class="map-left-button">&lt;</button>
                </td>
                <td></td>
                <td>
                    <button class="map-right-button">&gt;</button>
                </td>
            </tr>
            <tr>
                <td></td>
                <td>
                    <button class="map-down-button">v</button>
                </td>
                <td></td>
            </tr>
        </table>
    </div>
</template>

<script>
</script>

<style lang="stylus">
@import '~styles/_variables';

.map-controls {
    background-color: #444;
    position: absolute;
    bottom: 5%;
    right: 5%;
    z-index: 3;
}

.map-controls-buttons1 {
    float: left;
    button {
        width: 100%;
    }
}

.map-controls-buttons2 {
    float: right;
    button {
        width: 100%;
    }
}
</style>
