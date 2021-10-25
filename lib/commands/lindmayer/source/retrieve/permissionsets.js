"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//import { version } from '@oclif/command/lib/flags';
const command_1 = require("@salesforce/command");
const core_1 = require("@salesforce/core");
const AdmZip = require("Adm-Zip");
const cli_ux_1 = require("cli-ux");
function sortMembers(a, b) {
    if (a.fullName < b.fullName) {
        return -1;
    }
    if (a.fullName > b.fullName) {
        return 1;
    }
    return 0;
}
// Initialize Messages with the current plugin directory
core_1.Messages.importMessagesDirectory(__dirname);
// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core_1.Messages.loadMessages('sfdx-lindmayer', 'sfdx-lindmayer');
class Org extends command_1.SfdxCommand {
    async run() {
        let sfdxProjectVersion;
        try {
            this.project = await command_1.core.SfdxProject.resolve();
            const sfdxProjectJson = await this.project.retrieveSfdxProjectJson();
            sfdxProjectVersion = sfdxProjectJson.getContents().sourceApiVersion;
            // eslint-disable-next-line no-empty
        }
        catch (error) { }
        let apiVersion = this.flags.apiversion || sfdxProjectVersion || (await this.org.retrieveMaxApiVersion());
        cli_ux_1.default.action.start("Retrieving permission sets");
        // this.org is guaranteed because requiresUsername=true, as opposed to supportsUsername
        const conn = this.org.getConnection();
        const metadataObjects = await (await conn.metadata.describe()).metadataObjects;
        if (!metadataObjects || metadataObjects.length <= 0) {
            throw new core_1.SfdxError(messages.getMessage('errorNoMetadata', [this.org.getOrgId()]));
        }
        const permsetObject = {
            directoryName: "permissionsets",
            inFolder: false,
            metaFile: false,
            suffix: "permissionset",
            xmlName: "PermissionSet"
        };
        let metadataMembers = await conn.metadata.list({ type: permsetObject.xmlName }, apiVersion);
        metadataMembers = metadataMembers.sort(sortMembers);
        const packageTypeMembers = [];
        const members = [];
        for (const metadataMember of metadataMembers) {
            members.push(metadataMember.fullName);
        }
        const packageTypeMember = {
            name: "PermissionSet",
            members: members
        };
        packageTypeMembers.push(packageTypeMember);
        const metadataPackage = {
            version: apiVersion,
            types: packageTypeMembers
        };
        const retrieveRequest = {
            apiVersion: apiVersion,
            unpackaged: metadataPackage
        };
        const retrievedMetadata = await conn.metadata.retrieve(retrieveRequest);
        let zipFile;
        let statusRetrieved = false;
        do {
            await new Promise(resolve => setTimeout(resolve, 3000));
            conn.metadata.checkRetrieveStatus(retrievedMetadata.id).then(function (result) {
                if (result.done == 'true') {
                    zipFile = result.zipFile;
                    statusRetrieved = true;
                }
            });
        } while (statusRetrieved == false);
        var buffer = Buffer.from(zipFile, "base64");
        const zip = new AdmZip(buffer);
        const zipEntries = zip.getEntries();
        for (let i = 0; i < zipEntries.length; i++) {
            if (zipEntries[i].entryName.indexOf("permissionsets/") !== -1) {
                zipEntries[i].entryName = zipEntries[i].name + "-meta.xml";
            }
            else {
                zip.deleteFile(zipEntries[i]);
            }
        }
        const targetPath = this.project.getDefaultPackage().fullPath + "/main/default/permissionsets";
        zip.extractAllTo(targetPath, true);
        const outputString = "Delete Me";
        cli_ux_1.default.action.stop();
        // Return an object to be displayed with --json
        return { orgId: this.org.getOrgId(), outputString };
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
    name: command_1.flags.string({ char: 'n', description: messages.getMessage('nameFlagDescription') }),
    force: command_1.flags.boolean({ char: 'f', description: messages.getMessage('forceFlagDescription') })
};
// Comment this out if your command does not require an org username
Org.requiresUsername = true;
// Comment this out if your command does not support a hub org username
Org.supportsDevhubUsername = true;
// Set this to true if your command requires a project workspace; 'requiresProject' is false by default
Org.requiresProject = false;
//# sourceMappingURL=permissionsets.js.map