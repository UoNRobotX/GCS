module.exports = {
    // This is the root config
    root: true,

    // Use rules from the recommended style guide
    extends: 'eslint:recommended',

    // Override rules as needed
    // See http://eslint.org/docs/rules/{rule-name} for docs
    rules: {
        indent: ['error', 4],
        quotes: ['error', 'single'],
        semi: ['error', 'always'],

        'comma-dangle': ['error', 'never'],
        'no-cond-assign': ['error', 'always'],
        'no-console': 'off',
    },
};
