export declare const businessOperations: {
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
export declare const businessFields: ({
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
    typeOptions?: undefined;
    required?: undefined;
} | {
    displayName: string;
    name: string;
    type: string;
    typeOptions: {
        minValue: number;
        password?: undefined;
    };
    description: string;
    default: number;
    displayOptions: {
        show: {
            resource: string[];
            operation: string[];
        };
    };
    required?: undefined;
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
} | {
    displayName: string;
    name: string;
    type: string;
    typeOptions: {
        password: boolean;
        minValue?: undefined;
    };
    required: boolean;
    default: string;
    displayOptions: {
        show: {
            resource: string[];
            operation: string[];
        };
    };
    description?: undefined;
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
    description: string;
    typeOptions?: undefined;
})[];
