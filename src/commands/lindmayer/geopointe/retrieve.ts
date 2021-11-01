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
  `$ sfdx lindmayer:geopointe:retrieve
  Retrieves Geopointe records assignment plan, folders, shapes and assignment areas 
  and stores respective records as xml files in folder ./geopointe.
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
    
    let command = 'sfdx lindmayer:data:xmlretrieve --sobjecttype="geopointe__GP_Assignment_Plan__c" --filenameproperty="Name" --outputdir="./geopointe/assignmentplan"';
    command = command + (this.flags.targetusername == undefined ? "" : " --targetusername=" + this.flags.targetusername);
    shelljs.exec(command, { silent:true });

    command = 'sfdx lindmayer:data:xmlretrieve --sobjecttype="geopointe__GP_Folder__c" --filenameproperty="Name" --outputdir="./geopointe/folder" --query="Select Id,IsDeleted,Name,CurrencyIsoCode,geopointe__Inherit_Sharing__c,geopointe__Parent_Folder__r.ExternalId__c,geopointe__Personal__c,ExternalId__c from geopointe__GP_Folder__c"';
    command = command + (this.flags.targetusername == undefined ? "" : " --targetusername=" + this.flags.targetusername);
    shelljs.exec(command, { silent:true });

    command = 'sfdx lindmayer:data:xmlretrieve --sobjecttype="geopointe__Shape__c" --filenameproperty="Name" --outputdir="./geopointe/shape" --query="Select Id,IsDeleted,Name,CurrencyIsoCode,CreatedDate,CreatedById,LastModifiedDate,LastModifiedById,SystemModstamp,geopointe__Center__Latitude__s,geopointe__Center__Longitude__s,geopointe__Color__c,geopointe__Description__c,geopointe__Dissolve__c,geopointe__Folder__r.ExternalId__c,geopointe__Geometry_Last_Modified__c,geopointe__Invalid_Reason__c,geopointe__Invalid__c,geopointe__Label_Point__Latitude__s,geopointe__Label_Point__Longitude__s,geopointe__Lat_Lng_10__c,geopointe__Lat_Lng_1__c,geopointe__Lat_Lng_2__c,geopointe__Lat_Lng_3__c,geopointe__Lat_Lng_4__c,geopointe__Lat_Lng_5__c,geopointe__Lat_Lng_6__c,geopointe__Lat_Lng_7__c,geopointe__Lat_Lng_8__c,geopointe__Lat_Lng_9__c,geopointe__Lat_Max__c,geopointe__Lat_Min__c,geopointe__Lng_Max__c,geopointe__Lng_Min__c,geopointe__Opacity__c,geopointe__Personal__c,geopointe__Radius__c,geopointe__Show_Label__c,geopointe__Straddles_180__c,geopointe__Type__c,geopointe__Units__c,geopointe__Usage_Type__c,ExternalId__c from geopointe__Shape__c"';
    command = command + (this.flags.targetusername == undefined ? "" : " --targetusername=" + this.flags.targetusername);
    shelljs.exec(command, { silent:true });

    command = 'sfdx lindmayer:data:xmlretrieve --sobjecttype="geopointe__GP_Assignment_Area__c" --filenameproperty="Name" --outputdir="./geopointe/assignmentarea" --query="Select Id,IsDeleted,Name,CurrencyIsoCode,geopointe__Assignment_Plan__r.ExternalId__c,geopointe__Field_Mapping__c,geopointe__SOQL_Filter__c,geopointe__Shape__r.ExternalId__c,ExternalId__c from geopointe__GP_Assignment_Area__c"';
    command = command + (this.flags.targetusername == undefined ? "" : " --targetusername=" + this.flags.targetusername);
    shelljs.exec(command, { silent:true });
    // Return an object to be displayed with --json
    //return { orgId: this.org.getOrgId(), outputString };

    return null;
  }
}
