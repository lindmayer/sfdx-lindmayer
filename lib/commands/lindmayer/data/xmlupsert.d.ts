import { flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
export declare function bulkUpsert(conn: any, sobject: any, records: any, extIdField: any): Promise<unknown>;
export default class Org extends SfdxCommand {
    static description: string;
    static examples: string[];
    static args: {
        name: string;
    }[];
    protected static flagsConfig: {
        sobjecttype: flags.Discriminated<flags.Option<string>>;
        sourcedir: flags.Discriminated<flags.Option<string>>;
        externalid: flags.Discriminated<flags.Option<string>>;
        force: flags.Discriminated<flags.Boolean<boolean>>;
    };
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<AnyJson>;
}
