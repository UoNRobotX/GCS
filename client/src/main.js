import Vue from 'vue';
import KeenUI from 'keen-ui';
import App from 'app/App.vue';
import store from 'store/store';

Vue.use(KeenUI);

var app = new Vue({
    el: 'body',
    components: {
        App
    },
    store
});

window.app = app;
