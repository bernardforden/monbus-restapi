const fs = require('fs')
const path = require('path')
const simplify = require('simplify-sdk')
const CBEGIN='\x1b[32m'
const CERROR='\x1b[31m'
const CRESET='\x1b[0m'
const opName = `${CBEGIN}Simplify::${CRESET}Deployment`
var nodeArgs = process.argv.slice(2);
var configInputFile = process.env.DEPLOYMENT_INPUT || "deployment.json"
if (nodeArgs.length > 1) {
    configInputFile = (nodeArgs[0] == "--input" || nodeArgs[0] == "-i") ? nodeArgs[1] : configInputFile
}
try {
    var config = simplify.getInputConfig(path.join(__dirname, configInputFile))
    var stackData = JSON.parse(fs.readFileSync(path.join(__dirname, config.OutputFile)))
    Object.keys(config.Deployment.Functions).forEach(function(f) {
        const fInputPath = path.join(__dirname, config.Deployment.Functions[f].FunctionInput)
        var fConfig = JSON.parse(fs.readFileSync(fInputPath))
        stackData.Outputs.map(function(o) {
            if (o.OutputKey == `${f}FunctionRole`) {
                fConfig.Function.Role = o.OutputValue
            } else if (o.OutputKey == `${f}FunctionName`) {
                fConfig.Function.FunctionName = o.OutputValue
            }
        })
        fs.writeFileSync(fInputPath, JSON.stringify(fConfig, null, 4));
    })
} catch (err) {
    console.error(`${opName}-LoadConfig-${CERROR}ERROR${CRESET}: ${err}`)
}