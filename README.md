# GCS
Ground Control Station

## Getting started
1. Clone the repo and CD into the cloned directory

### Build client
1. CD into `client`
2. Run `npm install` to install the dependencies and devDependencies
3. Run `npm run dev` to build the project using Webpack and setup a watcher
4. Open up the index.html file in public in a web browser - or follow the steps below in Build Server

### Build server
1. CD into `server`
2. Run `npm install` to install the dependencies
3. Run `npm start` to start the Koa server

You don't need to build the client files for testing, you can just follow the steps above in Build Server.

## Public files
Each time the project is built files in `server/public` are removed and replaced by auto generated files. So don't
add or change files in there.
