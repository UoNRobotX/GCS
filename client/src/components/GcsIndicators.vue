<template>
	<ul class="gcs-indicators">
		<li class="indicator heading">
			<ui-icon
                icon="navigation" :style="{ transform: 'rotateZ(' + wamv.heading + 'deg)' }"
            ></ui-icon>
            <span class="value" v-html="heading"></span>
		</li>

		<li class="indicator speed">
			<ui-icon icon="network_check"></ui-icon>
            <span class="value" v-text="speed"></span>
		</li>

		<li class="indicator battery">
			<ui-icon icon="battery_full"></ui-icon>
            <span class="value" v-text="battery"></span>
		</li>

		<li class="indicator signal">
			<ui-icon icon="wifi"></ui-icon>
            <span class="value" v-text="signal"></span>
		</li>
	</ul>
</template>

<script>
import { getWamv } from 'store/getters';

export default {
    vuex: {
        getters: {
            wamv: getWamv
        }
    },

    computed: {
        heading() {
            return this.wamv.heading + '&deg; ' + this.degreeToToCardinal(this.wamv.heading);
        },

        speed() {
            return this.wamv.speed + ' KMPH';
        },

        battery() {
            return (this.wamv.battery * 100) + '%';
        },

        signal() {
            return (this.wamv.signal * 100) + '%';
        }
    },

    methods: {
        degreeToToCardinal(degree) {
            if (degree < 22.5 || degree >= 337.5) {
                return 'N';
            }

            if (degree < 67.5 || degree >= 22.5) {
                return 'NE';
            }

            if (degree < 112.5 || degree >= 67.5) {
                return 'E';
            }

            if (degree < 157.5 || degree >= 112.5) {
                return 'SE';
            }

            if (degree < 202.5 || degree >= 157.5) {
                return 'S';
            }

            if (degree < 247.5 || degree >= 202.5) {
                return 'SW';
            }

            if (degree < 292.5 || degree >= 247.5) {
                return 'W';
            }

            if (degree < 337.5 || degree >= 292.5) {
                return 'NW';
            }

            return '';
        }
    }
};
</script>

<style lang="stylus">
@import '~styles/_variables';

.gcs-indicators {
    position: absolute;
    right: 16px;
    top: 12px;
    height: 24px;
    padding: 0;
    margin: 0;
    list-style: none;

    .indicator {
    	color: alpha(white, 0.8);
    	display: inline-block;
    	margin-right: 18px;

    	&:last-child {
    		border-right: none;
    		padding-right: 0;
    		margin-right: 0;
    	}

        .heading .ui-icon {
            transition: transform 0.2s ease;
        }
    }

    .ui-icon {
    	color: alpha(white, 0.5);
    }
}
</style>
