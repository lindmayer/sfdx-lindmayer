import { flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
export default class Org extends SfdxCommand {
    static description: string;
    static examples: string[];
    protected static flagsConfig: {
        sobjecttype: flags.Discriminated<flags.Option<string>>;
        outputdir: flags.Discriminated<flags.Option<string>>;
        filenameproperty: flags.Discriminated<flags.Option<string>>;
        query: flags.Discriminated<flags.Option<string>>;
        force: flags.Discriminated<flags.Boolean<boolean>>;
    };
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<AnyJson>;
}
