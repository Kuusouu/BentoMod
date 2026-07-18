/**
 * Hero/character detection utilities
 */

/**
 * Detects heroes from file paths using the dynamic character data.
 */
export function detectHeroesWithData(files: string[], characterData: any[]): string[] {
    const heroIds = new Set<string>();

    const pathRegex = /(?:Characters|Hero_ST|Hero)\/(\d{4})/;
    const filenameRegex = /[_/](10[1-6]\d)(\d{3})/;

    files.forEach(file => {
        const pathMatch = file.match(pathRegex);
        if (pathMatch) {
            heroIds.add(pathMatch[1]);
            return;
        }

        const filename = file.split('/').pop() || '';
        if (!filename.toLowerCase().startsWith('mi_')) {
            const filenameMatch = filename.match(filenameRegex);
            if (filenameMatch) {
                heroIds.add(filenameMatch[1]);
            }
        }
    });

    const heroNames = new Set<string>();
    heroIds.forEach(id => {
        const char = characterData.find((c: any) => c.id === id);
        if (char) {
            heroNames.add(char.name);
        }
    });

    return Array.from(heroNames);
}

// ponytail: detectHeroes(files) was the static-data variant; upgrade path is detectHeroesWithData(files, characterData)
