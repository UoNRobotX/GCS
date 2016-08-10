<template>
	<div class="gcs-app">
		<p v-text="msg"></p>
	</div>
</template>

<script>
export default {
	data() {
		return {
			msg: 'Hello world!'
		};
	}
}
</script>

<style lang="stylus">
@import '~keen-ui/dist/keen-ui.css';
@import 'styles/_variables';

.gcs-app {
	//
}
</style>
