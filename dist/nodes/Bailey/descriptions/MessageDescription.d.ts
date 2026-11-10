export declare const messageOperations: {
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
export declare const messageFields: ({
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
    description: string;
    typeOptions: {
        rows: number;
        minValue?: undefined;
    };
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
        };
    };
    description: string;
    required?: undefined;
    placeholder?: undefined;
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
    description: string;
    placeholder?: undefined;
    typeOptions?: undefined;
    options?: undefined;
} | {
    displayName: string;
    name: string;
    type: string;
    default: boolean;
    displayOptions: {
        show: {
            resource: string[];
            operation: string[];
        };
    };
    description: string;
    required?: undefined;
    placeholder?: undefined;
    typeOptions?: undefined;
    options?: undefined;
} | {
    displayName: string;
    name: string;
    type: string;
    required: boolean;
    default: number;
    displayOptions: {
        show: {
            resource: string[];
            operation: string[];
        };
    };
    description: string;
    placeholder?: undefined;
    typeOptions?: undefined;
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
    typeOptions: {
        minValue: number;
        rows?: undefined;
    };
    required?: undefined;
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
    placeholder?: undefined;
    typeOptions?: undefined;
})[];
