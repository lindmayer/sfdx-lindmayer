import { SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import * as shelljs from 'shelljs'

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-lindmayer', 'sfdx-lindmayer');

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
  `$ sfdx lindmayer:geopointe:upsert
  Get Geopointe records from objects assignment area, folder, shape and assignment plan 
  from xml files and upsert to org.
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
    
    let command = 'sfdx lindmayer:data:xmlupsert --sobjecttype="geopointe__GP_Assignment_Plan__c" --sourcedir="geopointe/assignmentplan" --externalid="ExternalId__c"';
    command = command + (this.flags.targetusername == undefined ? "" : " --targetusername=" + this.flags.targetusername);
    shelljs.exec(command, { silent:true });

    command = 'sfdx lindmayer:data:xmlupsert --sobjecttype="geopointe__GP_Folder__c" --sourcedir="geopointe/folder" --externalid="ExternalId__c"';
    command = command + (this.flags.targetusername == undefined ? "" : " --targetusername=" + this.flags.targetusername);
    shelljs.exec(command, { silent:true });

    command = 'sfdx lindmayer:data:xmlupsert --sobjecttype="geopointe__Shape__c" --sourcedir="geopointe/shape" --externalid="ExternalId__c"';
    command = command + (this.flags.targetusername == undefined ? "" : " --targetusername=" + this.flags.targetusername);
    shelljs.exec(command, { silent:true });

    command = 'sfdx lindmayer:data:xmlupsert --sobjecttype="geopointe__GP_Assignment_Area__c" --sourcedir="geopointe/assignmentarea" --externalid="ExternalId__c"';
    command = command + (this.flags.targetusername == undefined ? "" : " --targetusername=" + this.flags.targetusername);
    shelljs.exec(command, { silent:true });
    // Return an object to be displayed with --json
    //return { orgId: this.org.getOrgId(), outputString };

    return null;
  }
}
