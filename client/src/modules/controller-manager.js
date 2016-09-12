import Controller from 'controller.js';
import ControllerLayouts from 'controller.js/dist/Controller.layouts.js';

Controller.layouts.register(ControllerLayouts);

export default class ControllerManager {
    constructor(callback) {
        this.gamepads = {};
        this.Controller = Controller;
        this.callback = this.broadcast = callback;

        this.gamepadEvents = [
            'gc.button.press',
            'gc.button.hold',
            'gc.button.release',
            'gc.analog.start',
            'gc.analog.hold',
            'gc.analog.change',
            'gc.analog.end'
        ];

        this.initializeControllers();
    }

    initializeControllers() {
        Controller.search();

        window.addEventListener('gc.controller.found', (event) => {
            this.broadcast('gc.controller.found', event.detail);
            this.gamepads[event.detail.controller.id] = event.detail.controller;
        }, false);

        window.addEventListener('gc.controller.lost', (event) => {
            this.broadcast('gc.controller.lost', event.detail);
            delete this.gamepads[event.detail.id];
        }, false);

        this.gamepadEvents.map((eventname) => {
            window.addEventListener(eventname, (event) => {
                this.broadcast(eventname, event.detail);
            }, false);
        });
    }
}
