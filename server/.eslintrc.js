module.exports = {
    // Use the root config
    extends: '../.eslintrc.js',

    parserOptions: {
        ecmaFeatures: {
            modules: true // Allows ESLint to understand ES6+ module syntax
        }
    },

    // Specify environment for built-in functions
    env: {
        node: true
    },

    globals: {},
};
