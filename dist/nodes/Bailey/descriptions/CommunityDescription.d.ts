export declare const communityOperations: {
    displayName: string;
    name: string;
    type: string;
    noDataExpression: boolean;
    displayOptions: {
        show: {
            resource: string[];
        };
    };
    options: {
        name: string;
        value: string;
        action: string;
    }[];
    default: string;
}[];
export declare const communityFields: ({
    displayName: string;
    name: string;
    type: string;
    required: boolean;
    default: string;
    displayOptions: {
        show: {
            resource: string[];
            operation: string[];
        };
    };
    description: string;
    typeOptions?: undefined;
    options?: undefined;
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
        };
    };
    description?: undefined;
    typeOptions?: undefined;
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
        };
    };
    typeOptions: {
        rows: number;
    };
    required?: undefined;
    description?: undefined;
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
        };
    };
    description: string;
    required?: undefined;
    typeOptions?: undefined;
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
        };
    };
    options: {
        name: string;
        value: string;
    }[];
    required?: undefined;
    description?: undefined;
    typeOptions?: undefined;
} | {
    displayName: string;
    name: string;
    type: string;
    default: number;
    displayOptions: {
        show: {
            resource: string[];
            operation: string[];
        };
    };
    options: {
        name: string;
        value: number;
    }[];
    required?: undefined;
    description?: undefined;
    typeOptions?: undefined;
})[];
