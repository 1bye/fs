import type { StorageFileTag, StorageTreeFolder } from "$lib/types/storage";

export function sortTagsByTagCount(tags: StorageFileTag[], tagCount: StorageTreeFolder["tagCount"]) {
    return tags.sort((a, b) => {
        const countA = tagCount[a.name] || 0;
        const countB = tagCount[b.name] || 0;

        // Sort in descending order (i.e., most frequent tags first)
        return countB - countA;
    });
}
