"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import { boolean } from '@oclif/parser/lib/flags';
// import { option } from '@oclif/parser/lib/flags';
const command_1 = require("@salesforce/command");
const core_1 = require("@salesforce/core");
// import { MetadataObject } from 'jsforce/api/metadata'
const xml2js = require("xml2js");
const fs = require("fs");
// Initialize Messages with the current plugin directory
core_1.Messages.importMessagesDirectory(__dirname);
// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core_1.Messages.loadMessages('sfdx-lindmayer', 'sfdx-lindmayer');
class Org extends command_1.SfdxCommand {
    async run() {
        const sobjecttype = this.flags.sobjecttype;
        const outputdir = this.flags.outputdir;
        const filenameproperty = this.flags.filenameproperty;
        const query = this.flags.query;
        // Get api version, either by populated version in query or populated in sfdx project json or max version of org
        let sfdxProjectVersion;
        try {
            this.project = await command_1.core.SfdxProject.resolve();
            const sfdxProjectJson = await this.project.retrieveSfdxProjectJson();
            sfdxProjectVersion = sfdxProjectJson.getContents().sourceApiVersion;
        }
        catch (error) { }
        let apiVersion = this.flags.apiversion || sfdxProjectVersion || (await this.org.retrieveMaxApiVersion());
        // Get connection
        const conn = this.org.getConnection();
        // If not populated in command get all fields of sobject and create string for select query
        let sobjectMetadata = await conn.sobject(sobjecttype).describe(apiVersion);
        let soqlQuery = "";
        if (query == undefined || query == "" || query == null) {
            sobjectMetadata.fields.forEach(function (field) {
                soqlQuery = soqlQuery + field.name + ",";
            });
            soqlQuery = soqlQuery.substring(0, soqlQuery.length - 1);
            soqlQuery = "Select " + soqlQuery + " from " + sobjecttype;
        }
        else
            soqlQuery = query;
        // Get all records based on SOQL query
        let records = [];
        let done = false;
        let result = await conn.query(soqlQuery, apiVersion);
        if (!result.records || result.records.length > 0) {
            records = records.concat(result.records);
            while (!done && !result.done) {
                result = await conn.queryMore(result.nextRecordsUrl, apiVersion);
                records = records.concat(result.records);
                if (result.done) {
                    done = true;
                }
            }
        }
        // Create if populated output directory doesn't exist
        if (!fs.existsSync(outputdir)) {
            fs.mkdirSync(outputdir, { recursive: true });
        }
        // Create xml files
        records.forEach(function (record) {
            delete record.attributes;
            Object.keys(record).forEach(function (key, index) {
                if (record[key] != null && record[key].attributes != undefined) {
                    delete record[key].attributes;
                }
                if (record[key] != null && typeof (record[key]) == 'object') {
                    let property = Object.keys(record[key])[0];
                    record[key + "." + property] = record[key][property];
                    delete record[key];
                }
            });
            let obj = {};
            obj[sobjecttype] = { $: { "xmlns": "sfdx-lindmayer" } };
            Object.keys(record).forEach(function (key) {
                obj[sobjecttype][key] = record[key];
            });
            let builder = new xml2js.Builder({ xmldec: { version: "1.0", encoding: "UTF-8", standalone: null } });
            //let xml = builder.buildObject(rootElement);
            let xml = builder.buildObject(obj);
            fs.writeFile(outputdir + "/" + record[filenameproperty].replace("/", "") + ".xml", xml, function (err) {
                if (err) {
                    throw new core_1.SfdxError(messages.getMessage('errorFileWriteFailed', [outputdir + "/" + record[filenameproperty]]));
                }
            });
        });
        //this.ux.log(result.records.toString());
        const outputString = result.records.toString();
        if (this.flags.force && this.args.file) {
            this.ux.log(`You input --force and a file: ${this.args.file}`);
        }
        // Return an object to be displayed with --json
        return { orgId: this.org.getOrgId(), outputString };
    }
}
exports.default = Org;
Org.description = messages.getMessage('commandDescription');
Org.examples = [
    `$ sfdx lindmayer:data:xmlretrieve --sobjecttype=CustomObject__c --filenameproperty=Name --outputdir=./customobject
  Retrieves all records with all fields from Salesforce object CustomObject__c and
  stores it in single xml files in directory customobject, one xml file per record.
  The respective file name of the xml file is defined with property filenameproperty.
  `,
    `$ sfdx lindmayer:data:xmlretrieve --sobjecttype=CustomObject__c --filenameproperty=Name --outputdir=./customobject -query "SELECT Id from CustomObject__c"
  Retrieves records defined by query and stores it in single xml files.
  `
];
Org.flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    sobjecttype: command_1.flags.string({ char: 's', description: messages.getMessage('sobjecttypeFlagDescription') }),
    outputdir: command_1.flags.string({ char: 'd', description: messages.getMessage('outputdirFlagDescription') }),
    filenameproperty: command_1.flags.string({ char: 'n', description: messages.getMessage('filenamepropertyFlagDescription') }),
    query: command_1.flags.string({ char: 'q', description: messages.getMessage('queryFlagDescription') })
};
// Comment this out if your command does not require an org username
Org.requiresUsername = true;
// Comment this out if your command does not support a hub org username
Org.supportsDevhubUsername = true;
// Set this to true if your command requires a project workspace; 'requiresProject' is false by default
Org.requiresProject = false;
//# sourceMappingURL=xmlretrieve.js.map