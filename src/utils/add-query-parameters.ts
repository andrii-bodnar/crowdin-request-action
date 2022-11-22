export function addQueryParameters(url: string, parameters: Record<string, unknown>): string {
    const separator = url.includes('?') ? '&' : '?';
    const names = Object.keys(parameters);

    if (names.length === 0) {
        return url;
    }

    return (
        url +
        separator +
        names
            .map((name: string) => {
                return `${name}=${encodeURIComponent(parameters[name]! as string)}`;
            })
            .join('&')
    );
}
