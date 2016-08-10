import Vue from 'vue';
import KeenUI from 'keen-ui';
import App from 'app/App.vue';

Vue.use(KeenUI);

var app = new Vue({
	el: 'body',
	components: {
		App
	}
});
