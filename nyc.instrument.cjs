'use strict';

const nycConfig = require('./nyc.config.cjs');

module.exports = {
    ...nycConfig,
    extensions: ['js', 'cjs'],
    exclude: [
        '**/*.ts',
        '**/.next/**',
        'node_modules/**',
    ],
    delete: true,
};
