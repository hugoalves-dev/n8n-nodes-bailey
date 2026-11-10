export declare const mediaOperations: {
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
        description: string;
    }[];
    default: string;
}[];
export declare const mediaFields: ({
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
        description: string;
    }[];
    required?: undefined;
    description?: undefined;
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
    options?: undefined;
})[];
