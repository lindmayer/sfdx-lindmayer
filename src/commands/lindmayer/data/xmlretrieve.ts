// import { boolean } from '@oclif/parser/lib/flags';
// import { option } from '@oclif/parser/lib/flags';
import { core, flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfdxError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
// import { MetadataObject } from 'jsforce/api/metadata'
import * as xml2js from 'xml2js';
import * as fs from 'fs';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-lindmayer', 'sfdx-lindmayer');

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
  `$ sfdx hello:org --targetusername myOrg@example.com --targetdevhubusername devhub@org.com
  Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
  My hub org id is: 00Dxx000000001234
  `,
  `$ sfdx hello:org --name myname --targetusername myOrg@example.com
  Hello myname! This is org: MyOrg and I will be around until Tue Mar 20 2018!
  `
  ];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    //name: flags.string({char: 'n', description: messages.getMessage('nameFlagDescription')}),
    sobjecttype: flags.string({char: 's', description: messages.getMessage('sobjecttypeFlagDescription')}),
    outputdir: flags.string({char: 'd', description: messages.getMessage('outputdirFlagDescription')}),
    filenameproperty: flags.string({char: 'n', description: messages.getMessage('filenamepropertyFlagDescription')}),
    query: flags.string({char: 'q', description: messages.getMessage('queryFlagDescription')}),
    force: flags.boolean({char: 'f', description: messages.getMessage('forceFlagDescription')})
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    const sobjecttype = this.flags.sobjecttype;
    const outputdir = this.flags.outputdir;
    const filenameproperty = this.flags.filenameproperty;
    const query = this.flags.query;

    // Get api version, either by populated version in query or populated in sfdx project json or max version of org
    let sfdxProjectVersion;
    try {
      this.project = await core.SfdxProject.resolve();
      const sfdxProjectJson = await this.project.retrieveSfdxProjectJson();
      sfdxProjectVersion = sfdxProjectJson.getContents().sourceApiVersion;
    } catch (error) {}
    let apiVersion = this.flags.apiversion || sfdxProjectVersion || (await this.org.retrieveMaxApiVersion());

    // Get connection
    const conn = this.org.getConnection();

    // If not populated in command get all fields of sobject and create string for select query
    let sobjectMetadata = await conn.sobject(sobjecttype).describe(apiVersion);
    let soqlQuery = "";
    if (query == undefined || query == "" || query == null) {
      sobjectMetadata.fields.forEach(function(field) {
        soqlQuery = soqlQuery + field.name + ","
      })
      soqlQuery = soqlQuery.substring(0, soqlQuery.length - 1);
      soqlQuery = "Select " + soqlQuery + " from " + sobjecttype;
    }
    else soqlQuery = query;

    // Get all records based on SOQL query
    let records: any[] = [];
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
    if (!fs.existsSync(outputdir)){
      fs.mkdirSync(outputdir, { recursive: true });
    }

    // Create xml files
    records.forEach(function(record) {
      delete record.attributes;

      Object.keys(record).forEach(function(key, index) {
        if (record[key] != null && record[key].attributes != undefined) {
          delete record[key].attributes;
        }
        if (record[key] != null && typeof(record[key]) == 'object') {
          let property = Object.keys(record[key])[0];
          record[key + "." + property] = record[key][property];
          delete record[key];
        }
      });

      let builder = new xml2js.Builder({rootName: sobjecttype, xmldec: {version: "1.0", encoding: "UTF-8", standalone: null}})
      let xml = builder.buildObject(record);
      fs.writeFile(outputdir + "/" + record[filenameproperty].replace("/", "") + ".xml", xml, function(err) {
        if(err) {
          throw new SfdxError(messages.getMessage('errorFileWriteFailed', [outputdir + "/" + record[filenameproperty]]));
        }
      }); 
    });

    //this.ux.log(result.records.toString());
    const outputString = result.records.toString();

    // this.hubOrg is NOT guaranteed because supportsHubOrgUsername=true, as opposed to requiresHubOrgUsername.
    // if (this.hubOrg) {
    //   const hubOrgId = this.hubOrg.getOrgId();
    //   this.ux.log(`My hub org id is: ${hubOrgId}`);
    // }

    if (this.flags.force && this.args.file) {
      this.ux.log(`You input --force and a file: ${this.args.file}`);
    }

    // Return an object to be displayed with --json
    return { orgId: this.org.getOrgId(), outputString };
  }
}

// sfdx sartorius:data:xmlimport --sobjecttype=geopointe__Shape__c --filenameproperty=Name --outputdir=".\geopointe\shapes" --fields="Id,OwnerId,IsDeleted,Name,CurrencyIsoCode,CreatedDate,CreatedById,LastModifiedDate,LastModifiedById,SystemModstamp,geopointe__Center__Latitude__s,geopointe__Center__Longitude__s,geopointe__Color__c,geopointe__Description__c,geopointe__Dissolve__c,geopointe__Folder__r.Name,geopointe__Geometry_Last_Modified__c,geopointe__Invalid_Reason__c,geopointe__Invalid__c,geopointe__Label_Point__Latitude__s,geopointe__Label_Point__Longitude__s,geopointe__Lat_Lng_10__c,geopointe__Lat_Lng_1__c,geopointe__Lat_Lng_2__c,geopointe__Lat_Lng_3__c,geopointe__Lat_Lng_4__c,geopointe__Lat_Lng_5__c,geopointe__Lat_Lng_6__c,geopointe__Lat_Lng_7__c,geopointe__Lat_Lng_8__c,geopointe__Lat_Lng_9__c,geopointe__Lat_Max__c,geopointe__Lat_Min__c,geopointe__Lng_Max__c,geopointe__Lng_Min__c,geopointe__Opacity__c,geopointe__Personal__c,geopointe__Radius__c,geopointe__Show_Label__c,geopointe__Straddles_180__c,geopointe__Type__c,geopointe__Units__c,geopointe__Usage_Type__c"