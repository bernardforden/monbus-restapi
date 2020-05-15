'use strict';

const path = require('path');
const express = require('express')
const bodyParser = require('body-parser')
const createSwaggerExpressMiddleware = require('@apidevtools/swagger-express-middleware');
const customSanitizeParamsMiddleware = require('./utils/sanitizer').customSanitizeParamsMiddleware


let app = express()
let specYAML = path.join(__dirname, './specs/swagger.yaml');

createSwaggerExpressMiddleware(specYAML, app, function (err, middleware) {
    if (err) {
        console.error(`createSwaggerExpressMiddleware: ${err}`)
    } else {
        app.use(bodyParser.json())
        app.use(middleware.metadata());
        app.use(middleware.CORS());
        app.use(customSanitizeParamsMiddleware);
        app.post("/stations/:id", require("./operations/fetchTimeByStation"));    
        app.get("/stations", require("./operations/getStations"));    

        app.use(function (err, req, res, next, statusCode) {
            if (res.headersSent) {
                return next(err);
            } else {
                res.status(statusCode || 500).json({
                    code: "ErrorGlobalServiceException",
                    message: err.message
                });
            }
        });

        app.listen(3000, function () {// NOSONAR
            console.log("node express service - ".concat("debugging"));
        });
    }
})