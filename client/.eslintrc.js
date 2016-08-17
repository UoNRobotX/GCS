module.exports = {
    // Use the root config
    extends: '../.eslintrc.js',

    // Allows ESLint to understand ES6+ module syntax
    parser: 'babel-eslint',

    // Specify environment for built-in functions
    env: {
        browser: true,
        node: true
    },

    plugins: [
        'html' // lint <script> blocks in .html and .vue files
    ],

    globals: {},
};
