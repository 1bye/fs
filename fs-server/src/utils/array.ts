type OrderObject<T> = { [key: string]: T[] };

export function sortArrayByObject<T>(
    array: T[],
    orderObject: OrderObject<T>
): T[] {
    // Extract keys from the object and convert them to numbers
    const orderKeys = Object.keys(orderObject).map(Number).sort((a, b) => a - b);

    // Create a map from the order object for quick lookup
    const orderMap = new Map<T, number>();
    orderKeys.forEach((key, index) => {
        orderObject[key].forEach(value => {
            orderMap.set(value, index);
        });
    });

    // Define a function to get the sorting index for a given value
    const getSortIndex = (value: T): number => {
        return orderMap.has(value) ? orderMap.get(value)! : orderKeys.length;
    };

    // Sort the array based on the computed indexes
    return array.slice().sort((a, b) => getSortIndex(a) - getSortIndex(b));
}