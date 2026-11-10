export declare const chatOperations: {
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
export declare const chatFields: ({
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
})[];
