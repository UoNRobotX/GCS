<template>
	<ul class="indicators">
		<li class="indicator heading">
			<ui-icon icon="navigation"></ui-icon> <span class="value" v-text="heading"></span>
		</li>

		<li class="indicator speed">
			<ui-icon icon="network_check"></ui-icon> <span class="value" v-text="speed"></span>
		</li>

		<li class="indicator battery">
			<ui-icon icon="battery_full"></ui-icon> <span class="value" v-text="battery"></span>
		</li>

		<li class="indicator signal">
			<ui-icon icon="wifi"></ui-icon> <span class="value" v-text="signal"></span>
		</li>
	</ul>
</template>

<script>
export default {
    props: {
        heading: {
            type: String,
            required: true
        },
        speed: {
            type: String,
            required: true
        },
        battery: {
            type: String,
            required: true
        },
        signal: {
            type: String,
            required: true
        }
    },

    data() {
        return {};
    }
};
</script>

<style lang="stylus">
@import '~styles/_variables';

.indicators {
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
    }

    .ui-icon {
    	color: alpha(white, 0.5);
    }
}
</style>
