const dotenv = require('dotenv');
const { webpack } = require('webpack');
const env = dotenv.config().parsed;

plugins: [
    new webpack.DefinePlugin({
        'process.env': JSON.stringify(env),
    }),
]