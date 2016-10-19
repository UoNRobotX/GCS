# GCS: Ground Control Station

This codebase is structured into two parts, the client and the server.

The client has all the frontend assets including HTML, CSS and Javascript/Vue source files. The UI and everything that happens in the browser is handled in the client.

The server runs in Node.js and serves up the built client files (located in `server/public`) for access in the browser. It handles communication with the client via socket.io and with the WamV via serial port, coordinating between the two.

## Getting started
1. Clone the repo and `cd` into the cloned directory

### To run/test the app
1. From the project root, `cd` into `server`
2. Run `npm install` to install the dependencies
3. Run `npm run start` to start up the server
4. Open up a browser and point it to [http://localhost:3000](http://localhost:3000)

If you have problems starting the server, see the **Gotchas** section below

### To make changes to the client
1. From the project root, `cd` into `client`
2. Run `npm install` to install the dependencies
3. Run `npm run dev` to build the project and setup a watcher
4. Make your changes to files in `client/src`. Webpack should automatically pick up these changes and rebuild the project.
5. To test your changes, run the app in a browser as shown in the **To run/test the app** section above

### To make changes to the server
1. From the project root, `cd` into `server`
2. Run `npm install` to install the dependencies
3. Run `npm run start` to start up the server
4. Make your changes and restart the server if it's already running

## Public files
Each time the project is built files in `server/public` are removed and replaced by auto generated files. So don't add or change files in there.

## Gotchas

### Server
Running `npm install` and `npm run start` in the server may fail for the following reasons:

1. node-gyp errors: node-gyp rebuilds native C/C++ Node modules for your system. One of the modules we use, `serialport` requires node-gyp. For it to work properly, it requires  Python >= v2.5.0 & < 3.0.0.
