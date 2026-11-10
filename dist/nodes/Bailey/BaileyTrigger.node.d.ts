import type { ICredentialTestFunctions, ICredentialsDecrypted, INodeCredentialTestResult, INodeType, INodeTypeDescription, ITriggerFunctions, ITriggerResponse } from 'n8n-workflow';
export declare class BaileyTrigger implements INodeType {
    description: INodeTypeDescription;
    methods: {
        credentialTest: {
            baileyCredentialTest(this: ICredentialTestFunctions, credential: ICredentialsDecrypted): Promise<INodeCredentialTestResult>;
        };
    };
    trigger(this: ITriggerFunctions): Promise<ITriggerResponse>;
}
