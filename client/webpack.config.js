var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var mainConfig = {
    devtool: '#inline-source-map',

    entry: {
        app: './src/main.js'
    },

    output: {
        path: path.join(__dirname, '../server/public/assets'),
        filename: '[name].js'
    },

    resolve: {
        root: path.resolve(__dirname),
        alias: {
            components: 'src/components',
            markers: 'src/components/markers',
            mission: 'src/components/mission',
            views: 'src/components/views',
            map: 'src/components/map',
            modules: 'src/modules',
            styles: 'src/styles',
            mixins: 'src/mixins',
            store: 'src/store',
            util: 'src/util',
            app: 'src'
        },
        extensions: ['', '.js', '.vue', '.json', '.styl']
    },

    module: {
        loaders: [{
            test: /\.vue$/,
            loader: 'vue'
        }, {
            test: /\.js$/,
            loader: 'babel',
            exclude: /node_modules/
        }, {
            test: /\.json$/,
            loader: 'json'
        }, {
            test: /\.html$/,
            loader: 'vue-html'
        }, {
            test: /\.(png|jpg|gif|svg)$/,
            loader: 'url',
            query: {
                limit: 10000,
                name: '[name].[ext]?[hash]'
            }
        }]
    },

    vue: {
        loaders: {
            css: ExtractTextPlugin.extract('css'), // extract css and stylus files to a single file
            stylus: ExtractTextPlugin.extract('css!stylus')
        },

        autoprefixer: {
            browsers: ['last 2 versions']
        },

        postcss: [
            require('lost')
        ]
    },

    babel: {
        presets: ['es2015', 'stage-2'],
        plugins: ['transform-runtime'],
        comments: false
    },

    plugins: [
        new ExtractTextPlugin('[name].css')
    ]
};

// Adjust config for production
if (process.env.NODE_ENV === 'production') {
    delete mainConfig.devtool;

    mainConfig.plugins.push(
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': '"production"'
        }),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        })
    );
}

module.exports = [mainConfig];
