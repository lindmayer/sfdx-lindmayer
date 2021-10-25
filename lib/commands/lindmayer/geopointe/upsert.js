"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@salesforce/command");
const core_1 = require("@salesforce/core");
const shelljs = require("shelljs");
// Initialize Messages with the current plugin directory
core_1.Messages.importMessagesDirectory(__dirname);
// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core_1.Messages.loadMessages('sfdx-lindmayer', 'sfdx-lindmayer');
class Org extends command_1.SfdxCommand {
    async run() {
        let command = 'sfdx lindmayer:data:xmlupsert --sobjecttype="geopointe__GP_Assignment_Plan__c" --sourcedir="geopointe/assignmentplan" --externalid="ExternalId__c"';
        command = command + (this.flags.targetusername == undefined ? "" : " --targetusername=" + this.flags.targetusername);
        shelljs.exec(command, { silent: true });
        command = 'sfdx lindmayer:data:xmlupsert --sobjecttype="geopointe__GP_Folder__c" --sourcedir="geopointe/folder" --externalid="ExternalId__c"';
        command = command + (this.flags.targetusername == undefined ? "" : " --targetusername=" + this.flags.targetusername);
        shelljs.exec(command, { silent: true });
        command = 'sfdx lindmayer:data:xmlupsert --sobjecttype="geopointe__Shape__c" --sourcedir="geopointe/shape" --externalid="ExternalId__c"';
        command = command + (this.flags.targetusername == undefined ? "" : " --targetusername=" + this.flags.targetusername);
        shelljs.exec(command, { silent: true });
        command = 'sfdx lindmayer:data:xmlupsert --sobjecttype="geopointe__GP_Assignment_Area__c" --sourcedir="geopointe/assignmentarea" --externalid="ExternalId__c"';
        command = command + (this.flags.targetusername == undefined ? "" : " --targetusername=" + this.flags.targetusername);
        shelljs.exec(command, { silent: true });
        // Return an object to be displayed with --json
        //return { orgId: this.org.getOrgId(), outputString };
        return null;
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
    force: command_1.flags.boolean({ char: 'f', description: messages.getMessage('forceFlagDescription') })
};
// Comment this out if your command does not require an org username
Org.requiresUsername = true;
// Comment this out if your command does not support a hub org username
Org.supportsDevhubUsername = true;
// Set this to true if your command requires a project workspace; 'requiresProject' is false by default
Org.requiresProject = false;
//# sourceMappingURL=upsert.js.map