const path = require('path')
module.exports = {
    entry: {
        index: './src/event-function-stations-sync/index.js',
    },
    output: {
        path: path.join(__dirname, 'layer/nodejs/node_modules/event-function-stations-sync'),
        publicPath: '/',
        filename: '[name].js',
        libraryTarget: 'umd'
    },
    target: 'node',
    node: {
        // Need this when working with express, otherwise the build fails
        __dirname: false,     // if you don't put this is, __dirname
        __filename: false,    // and __filename return blank or /
    },
    externals: [], // Need this to avoid error when working with Express
    module: {
        rules: [
            {
                // Transpiles ES6-8 into ES5
                test: /\.js$/,
                exclude: [
                    /node_modules/
                ],
                use: {
                    loader: "babel-loader"
                }
            },
            {
                // Transpiles files into memory
                test: /\.yaml$/,
                exclude: [
                    /node_modules/
                ],
                use: {
                    loader: "file-loader"
                }
            }
        ]
    },
    plugins: []
}