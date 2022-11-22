import {extractUrlVariableNames} from './extract-url-variable-names';

export function replacePathParameters(route: string, params: Map<string, unknown>): string {
    const variables = extractUrlVariableNames(route);
    let result = route;

    if (variables.length === 0) {
        return route;
    }

    variables.map((variable: string) => {
        const placeholderValue = params.get(variable.toLowerCase());

        if (placeholderValue === undefined) {
            throw new Error(`Can't find variable ${variable} among passed parameters!`);
        }

        result = result.replace(`{${variable}}`, placeholderValue as string);
    });

    return result;
}
