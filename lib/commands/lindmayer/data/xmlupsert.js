"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUpsert = void 0;
const command_1 = require("@salesforce/command");
const core_1 = require("@salesforce/core");
const path = require("path");
const fs = require("fs");
const xml2js = require("xml2js");
// Initialize Messages with the current plugin directory
core_1.Messages.importMessagesDirectory(__dirname);
// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core_1.Messages.loadMessages('sfdx-lindmayer', 'sfdx-lindmayer');
function bulkUpsert(conn, sobject, records, extIdField) {
    return new Promise((resolve, reject) => {
        let job = conn.bulk.createJob(sobject, 'upsert', { extIdField: extIdField });
        let batch = job.createBatch();
        batch.execute(records);
        batch.on("error", function (err) {
            reject(err);
        });
        batch.on("queue", function (batchInfo) {
            batch.poll(1000 /* interval(ms) */, 120000 /* timeout(ms) */); // start polling
            batch.on("response", function (results) {
                resolve({ results, batchInfo });
            });
        });
    });
}
exports.bulkUpsert = bulkUpsert;
class Org extends command_1.SfdxCommand {
    async run() {
        const sobjecttype = this.flags.sobjecttype;
        const sourcedir = this.flags.sourcedir;
        const externalid = this.flags.externalid;
        let sfdxProjectVersion;
        try {
            this.project = await command_1.core.SfdxProject.resolve();
            const sfdxProjectJson = await this.project.retrieveSfdxProjectJson();
            sfdxProjectVersion = sfdxProjectJson.getContents().sourceApiVersion;
        }
        catch (error) { }
        let apiVersion = this.flags.apiversion || sfdxProjectVersion || (await this.org.retrieveMaxApiVersion());
        const conn = this.org.getConnection();
        let sobjectMetadata = await conn.sobject(sobjecttype).describe(apiVersion);
        let exportableObjects = [];
        let files = fs.readdirSync(sourcedir); // gives all the files
        // Iterate through all files in directory
        files.forEach(function (file) {
            // Read file
            let data = fs.readFileSync(path.join(sourcedir, file), 'utf8');
            // Parse xml file string to object
            xml2js.parseString(data, { explicitArray: false }, function (err, xml) {
                // Iterate through properties of object...
                Object.keys(xml[sobjecttype]).forEach(function (property) {
                    // ...and remove fields that are not updateable
                    if (sobjectMetadata.fields.find(element => element.name == property) != null
                        && sobjectMetadata.fields.find(element => element.name == property).updateable == false
                        && property != externalid) {
                        delete xml[sobjecttype][property];
                    }
                });
                exportableObjects.push(xml[sobjecttype]);
            });
        });
        let promise = bulkUpsert(conn, sobjecttype, exportableObjects, "ExternalId__c");
        promise.then((result) => {
            console.log(result);
        }, (error) => {
            console.log(error);
        });
        // conn.sobject(sobjecttype).insert(exportableObjects[0], function(err, ret)  {
        //   if (err) {
        //     throw new SfdxError("Could not create objects.", null, null, null, err);
        //   }
        //   if (ret) {
        //     //this.ux.log("Successfully created records.");
        //   }
        // });
        //const batcher: Batcher = new Batcher(conn, this.ux);
        //const batch: Batch = new Batch();
        //const concurrencyMode = this.flags.serial ? 'Serial' : 'Parallel';
        // const concurrencyMode = 'Serial';
        // const job = conn.bulk.createJob(this.flags.sobjecttype, 'upsert', {
        //   extIdField: "ExternalId__c",
        //   concurrencyMode,
        // });
        // let  batch = job.createBatch();
        // batch.execute(exportableObjects);
        // let endBatch;
        // batch.on('queue', batchInfo => {
        //   console.log('in queue');
        //   endBatch = conn.bulk.job(batchInfo.jobId).batch(batchInfo.batchId);
        //   endBatch.poll(500, 20000);
        //   endBatch.on('response', response => {
        //     console.log('response', response);
        //     endBatch.check().then(yo => {
        //       console.log('check', yo);
        //     });
        //     endBatch
        //       .retrieve()
        //       .then(results => {
        //         console.log('end', results);
        //       })
        //       .catch(
        //         console.log("Bla")
        //       );
        //   });
        // });
        // Promise.all(
        //   //let batch = job.createBatch();
        //   batch.execute(exportableObjects);
        //   batch.poll(5*1000, 30*1000); // poll interval = 5 sec, timeout = 30 sec
        //   return new Promise(function(resolve, reject) {
        //     batch.on('response', function(res) { resolve(res); });
        //     batch.on('error', function(err) { reject(error); });
        //   });
        //   batch.execute(exportableObjects)
        //   .on('response',  (responses)=> {
        //     const results = [];
        //     for (const response of responses) {
        //        batch.result(response.id)
        //           .stream()
        //           .on('data', (chunk)=> {
        //                results.push(chunk.toString());
        //           })
        //           .on(end, ()=> {
        //                console.log(results)
        //           })
        //    }
        //  })
        // let endBatch;
        // batch.on('queue', batchInfo => {
        //   console.log('in queue');
        //   endBatch = conn.bulk.job(batchInfo.jobId).batch(batchInfo.batchId);
        //   endBatch.poll(500, 20000);
        //   endBatch.on('response', response => {
        //     console.log('response', response);
        //     endBatch.check().then(yo => {
        //       console.log('check', yo);
        //     });
        //     endBatch
        //       .retrieve()
        //       .then(results => {
        //         console.log('end', results);
        //       })
        //       .catch(throw new SfdxError("Could not create objects.", null, null, null, err););
        //   });
        // });
        // try {
        //   await batch.createAndExecuteBatches(job, exportableObjects, this.flags.sobjecttype, this.flags.wait));
        //   this.ux.stopSpinner();
        // } catch (e) {
        //   this.ux.stopSpinner('error');
        //   reject(e);
        // }
        // conn.sobject(sobjecttype).upsertBulk(exportableObjects, function(err, ret)  {
        //   if (err) {
        //     throw new SfdxError("Could not create objects.", null, null, null, err);
        //   }
        //   if (ret) {
        //     //this.ux.log("Successfully created records.");
        //   }
        // })
        // Return an object to be displayed with --json
        return { exportableObjects };
    }
}
exports.default = Org;
Org.description = messages.getMessage('commandDescription');
Org.examples = [
    `$ sfdx hello:org --targetusername myOrg@example.com --targetdevhubusername devhub@org.com
  Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
  My hub org id is: 00Dxx000000001234
  `,
    `$ sfdx hello:org --name myname --targetusername myOrg@example.com
  Hello myname! This is org: MyOrg and I will be around until Tue Mar 20 2018!
  `
];
Org.args = [{ name: 'file' }];
Org.flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    sobjecttype: command_1.flags.string({ char: 's', description: messages.getMessage('sobjecttypeFlagDescription') }),
    sourcedir: command_1.flags.string({ char: 'p', description: messages.getMessage('sourcedirFlagDescription') }),
    externalid: command_1.flags.string({ char: 'p', description: messages.getMessage('externalidFlagDescription') }),
    force: command_1.flags.boolean({ char: 'f', description: messages.getMessage('forceFlagDescription') })
};
// Comment this out if your command does not require an org username
Org.requiresUsername = true;
// Comment this out if your command does not support a hub org username
Org.supportsDevhubUsername = true;
// Set this to true if your command requires a project workspace; 'requiresProject' is false by default
Org.requiresProject = false;
//# sourceMappingURL=xmlupsert.js.map