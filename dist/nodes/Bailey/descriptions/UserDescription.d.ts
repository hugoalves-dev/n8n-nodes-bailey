export declare const userOperations: {
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
export declare const userFields: ({
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
    placeholder: string;
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
        };
    };
    description: string;
    required?: undefined;
    placeholder?: undefined;
    options?: undefined;
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
    description: string;
    typeOptions: {
        minValue: number;
        maxValue: number;
    };
    required?: undefined;
    placeholder?: undefined;
    options?: undefined;
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
    description: string;
    required?: undefined;
    placeholder?: undefined;
    options?: undefined;
    typeOptions?: undefined;
})[];
