const path = require('path')
const fs = require('fs')
const CBEGIN = '\x1b[32m'
const CERROR = '\x1b[31m'
const CRESET = '\x1b[0m'
const opName = `${CBEGIN}Simplify::${CRESET}Deployment`
const simplify = require('simplify-sdk')
const provider = require('simplify-sdk/provider')
var nodeArgs = process.argv.slice(2);
var configResourceDeletion = false
var configInputFile = process.env.DEPLOYMENT_INPUT || "deployment.json"
while (nodeArgs.length > 0) {
    if (nodeArgs[0] == "--input" || nodeArgs[0] == "-i") {
        configInputFile = nodeArgs[1]
        nodeArgs = nodeArgs.slice(2);
    } else if (nodeArgs[0] == "--deletion" || nodeArgs[0] == "-d") {
        configResourceDeletion = true
        nodeArgs = nodeArgs.slice(1);
    }
}
try {
    var config = simplify.getInputConfig(path.join(__dirname, configInputFile))
    const distYamlFile = path.join(__dirname, config.Deployment.Definition)
    const bucketKey = config.Bucket.Key
    provider.setConfig(config).then(function () {
        if (configResourceDeletion) {
            console.log(`${opName}-CleanupResource: Resource Name - ${config.Deployment.Name}`)
            simplify.deleteStackOnComplete({
                adaptor: provider.getResource(),
                ...{
                    stackName: config.Deployment.Name
                }
            }).then(function (stackData) {
                console.log(`${opName}-CleanupResource: Resource Status - ${stackData.StackStatus}`)
            }).catch(function(err) {
                console.error(`\n - Resource wasn't cleanned successfully: ${err} \n`)
            })
        } else {
            simplify.uploadLocalFile({
                adaptor: provider.getStorage(),
                ...{ bucketKey: bucketKey, inputLocalFile: distYamlFile }
            }).then(function (uploadInfo) {
                var TemplateURL = uploadInfo.Location
                var parameters = {}
                Object.keys(config.Deployment.Functions).map(function (fname) {
                    parameters[`${fname}CustomResourceArn`] = config.Deployment.Functions[fname].CustomResourceArn || "NO"
                    parameters[`${fname}ResourcePermission`] = config.Deployment.Functions[fname].ResourcePermission || "NO"
                })
                simplify.createOrUpdateStackOnComplete({
                    adaptor: provider.getResource(),
                    ...{
                        stackName: config.Deployment.Name,
                        stackParameters: {
                            DeploymentStage: 'latest',
                            ApiAuthorizerId: config.Deployment.Authorizer,
                            ...parameters
                        },
                        stackTemplate: TemplateURL
                    }
                }).then(function (stackData) {
                    stackData.apiConfig = {}
                    stackData.Outputs.map(function (o) {
                        if (o.OutputKey == `GatewayUrl`) {
                            stackData.apiConfig.GatewayURL = o.OutputValue
                        } else if (o.OutputKey == `StageName`) {
                            stackData.apiConfig.StageName = o.OutputValue
                        } else if (o.OutputKey == `GatewayId`) {
                            stackData.apiConfig.GatewayId = o.OutputValue
                        }
                    })
                    simplify.updateAPIGatewayDeployment({
                        adaptor: provider.getAPIGateway(),
                        apiConfig: stackData.apiConfig
                    }).then(function (data) {
                        console.log(`\n - API Gateway URL: ${stackData.apiConfig.GatewayURL} \n`)
                    }).catch(function (err) {
                        console.log(`\n - API Gateway Stage: ${stackData.apiConfig.StageName} Update Failed!\n`)
                    })
                    try {
                        fs.writeFileSync(path.join(__dirname, config.OutputFile), JSON.stringify(stackData, null, 4));
                        Object.keys(config.Deployment.Functions).forEach(function (f) {
                            const fInputPath = path.join(__dirname, config.Deployment.Functions[f].FunctionInput)
                            var fConfig = JSON.parse(fs.readFileSync(fInputPath))
                            stackData.Outputs.map(function (o) {
                                if (o.OutputKey == `${f}FunctionRole`) {
                                    fConfig.Function.Role = o.OutputValue
                                } else if (o.OutputKey == `${f}FunctionName`) {
                                    fConfig.Function.FunctionName = o.OutputValue
                                }
                            })
                            fs.writeFileSync(fInputPath, JSON.stringify(fConfig, null, 4));
                        })
                    } catch (err) {
                        console.error(`${opName}-UpdateFunctionInput-${CERROR}ERROR${CRESET}:`, err.message)
                    }
                }, function (err) {
                    console.error(`${opName}-CreateDeployment-${CERROR}ERROR${CRESET}:`, err.message || err.StackId)
                })
            }, function (err) {
                console.error(`${opName}-UploadDirectory: ${err}`)
            })
        }
    }).catch(function (err) {
        console.error(`${opName}-LoadCredentials-${CERROR}ERROR${CRESET}: ${err}`)
    })
} catch (err) {
    console.error(`${opName}-LoadConfig-${CERROR}ERROR${CRESET}: ${err}`)
}