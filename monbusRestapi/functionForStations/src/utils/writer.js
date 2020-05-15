const headers = { 
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "Content-Type": "application/json"
}

exports.writeJson = function (response, payload, code ) {
    response.writeHead(code || 200, headers);
    response.end(JSON.stringify(Object.assign({
        metadata: {
            name: "functionForStations",
            version: "0.1.1"
        }
    }, payload)));
}

exports.writeError = function (response, error, code) {
    response.writeHead(code || 403, headers);
    response.end(JSON.stringify(error));
}
