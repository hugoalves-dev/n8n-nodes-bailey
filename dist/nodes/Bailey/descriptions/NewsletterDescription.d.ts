export declare const newsletterOperations: {
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
export declare const newsletterFields: ({
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
        };
    };
    description?: undefined;
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
    typeOptions: {
        rows: number;
        minValue?: undefined;
        maxValue?: undefined;
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
    typeOptions: {
        minValue: number;
        maxValue: number;
        rows?: undefined;
    };
    required?: undefined;
    description?: undefined;
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
    required?: undefined;
    description?: undefined;
    options?: undefined;
    typeOptions?: undefined;
})[];
