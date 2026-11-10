export declare const broadcastOperations: {
    displayName: string;
    name: string;
    type: string;
    noDataExpression: boolean;
    displayOptions: {
        show: {
            resource: string[];
        };
    };
    options: ({
        name: string;
        value: string;
        action: string;
        description?: undefined;
    } | {
        name: string;
        value: string;
        description: string;
        action: string;
    })[];
    default: string;
}[];
export declare const broadcastFields: ({
    displayName: string;
    name: string;
    type: string;
    required: boolean;
    default: string;
    displayOptions: {
        show: {
            resource: string[];
            operation: string[];
            msgType?: undefined;
        };
    };
    description: string;
    placeholder: string;
    options?: undefined;
    typeOptions?: undefined;
} | {
    displayName: string;
    name: string;
    type: string;
    required: boolean;
    default: string;
    displayOptions: {
        show: {
            resource: string[];
            operation: string[];
            msgType?: undefined;
        };
    };
    description: string;
    placeholder?: undefined;
    options?: undefined;
    typeOptions?: undefined;
} | {
    displayName: string;
    name: string;
    type: string;
    default: string;
    displayOptions: {
        show: {
            resource: string[];
            operation: string[];
            msgType?: undefined;
        };
    };
    options: {
        name: string;
        value: string;
    }[];
    required?: undefined;
    description?: undefined;
    placeholder?: undefined;
    typeOptions?: undefined;
} | {
    displayName: string;
    name: string;
    type: string;
    default: string;
    displayOptions: {
        show: {
            resource: string[];
            operation: string[];
            msgType: string[];
        };
    };
    typeOptions: {
        rows: number;
    };
    required?: undefined;
    description?: undefined;
    placeholder?: undefined;
    options?: undefined;
} | {
    displayName: string;
    name: string;
    type: string;
    default: string;
    displayOptions: {
        show: {
            resource: string[];
            operation: string[];
            msgType: string[];
        };
    };
    required?: undefined;
    description?: undefined;
    placeholder?: undefined;
    options?: undefined;
    typeOptions?: undefined;
})[];
