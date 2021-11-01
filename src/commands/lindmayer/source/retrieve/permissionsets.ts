//import { version } from '@oclif/command/lib/flags';
import { core, SfdxCommand  } from '@salesforce/command';
import {Messages, SfdxError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { MetadataObject, FileProperties, RetrieveRequest, Package, PackageTypeMembers } from 'jsforce/api/metadata'
import * as AdmZip from 'Adm-Zip'
import cli from 'cli-ux'

function sortMembers( a, b ) {
    if ( a.fullName < b.fullName){
    return -1;
    }
    if ( a.fullName > b.fullName){
    return 1;
    }
    return 0;
}

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-lindmayer', 'sfdx-lindmayer');

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
  `$ sfdx lindmayer:source:retrieve:permissionsets --targetusername myOrg@example.com
  Retrieves all permission sets from org with alias myOrg@example.com.
  `
  ];

  public static args = [{name: 'file'}];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {

    let sfdxProjectVersion;
    try {
      this.project = await core.SfdxProject.resolve();
      const sfdxProjectJson = await this.project.retrieveSfdxProjectJson();
      sfdxProjectVersion = sfdxProjectJson.getContents().sourceApiVersion;
      // eslint-disable-next-line no-empty
    } catch (error) {}
    let apiVersion = this.flags.apiversion || sfdxProjectVersion || (await this.org.retrieveMaxApiVersion());

    cli.action.start("Retrieving permission sets");

    // this.org is guaranteed because requiresUsername=true, as opposed to supportsUsername
    const conn = this.org.getConnection();

    const metadataObjects: MetadataObject[] = await (await conn.metadata.describe()).metadataObjects;

    if (!metadataObjects || metadataObjects.length <= 0) {
        throw new SfdxError(messages.getMessage('errorNoMetadata', [this.org.getOrgId()]));
    }

    const permsetObject: MetadataObject = {
        directoryName: "permissionsets",
        inFolder: false,
        metaFile: false,
        suffix: "permissionset",
        xmlName: "PermissionSet"
    }

    let metadataMembers:FileProperties[] = await conn.metadata.list({ type: permsetObject.xmlName }, apiVersion);

    metadataMembers = metadataMembers.sort(sortMembers);

    const packageTypeMembers:PackageTypeMembers[] = [];

    const members: string[] = [];
    for (const metadataMember of metadataMembers) {
        members.push(metadataMember.fullName);
    }

    const packageTypeMember:PackageTypeMembers = {
        name: "PermissionSet",
        members: members
    }

    packageTypeMembers.push(packageTypeMember);

    const metadataPackage:Package = {
        version: apiVersion,
        types: packageTypeMembers
    }

    const retrieveRequest:RetrieveRequest = {
        apiVersion: apiVersion,
        unpackaged: metadataPackage
    }
    const retrievedMetadata = await conn.metadata.retrieve(retrieveRequest);

    let zipFile:string;
    let statusRetrieved = false;
    do {
        await new Promise(resolve => setTimeout(resolve, 3000));
        conn.metadata.checkRetrieveStatus(retrievedMetadata.id).then(function(result:any) {
            if (result.done == 'true') {
                zipFile = result.zipFile;
                statusRetrieved = true;
            }
        });
    }
    while (statusRetrieved == false);

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
    const targetPath = this.project.getDefaultPackage().fullPath + "/main/default/permissionsets"
    zip.extractAllTo(targetPath, true);

    const outputString = "Delete Me";

    cli.action.stop();

    // Return an object to be displayed with --json
    return { orgId: this.org.getOrgId(), outputString };
  }
}
