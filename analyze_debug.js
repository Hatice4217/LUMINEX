const fs = require('fs');

// Read the file
const content = fs.readFileSync('C:\\Users\\Hatice\\LUMINEX\\js\\symptom-checker.js', 'utf8');

// Find symptomData
const startIdx = content.indexOf('symptomData:');
const endIdx = content.indexOf('\n            }', startIdx);
const symptomDataText = content.substring(startIdx, endIdx + 20);

// Extract all symptom keys
const symptomKeys = [];
const keyRegex = /'([^']+)':\s*\{/g;
let match;
while ((match = keyRegex.exec(symptomDataText)) !== null) {
    symptomKeys.push(match[1]);
}

// Parse each symptom
const symptoms = {};
for (const key of symptomKeys) {
    const pattern = new RegExp(`'${key}':\\s*\\{\\s*question:\\s*"([^"]*)",\\s*options:\\s*\\[([\\s\\S]*?)\\]\\s*\\}`);
    const m = symptomDataText.match(pattern);
    if (m) {
        const question = m[1];
        const optionsText = m[2];

        // Parse options
        const options = [];
        const optRegex = /\{\s*text:\s*"([^"]+)",\s*(next|result):\s*(?:'([^']+)'|\{)/g;
        let optMatch;
        while ((optMatch = optRegex.exec(optionsText)) !== null) {
            options.push({
                text: optMatch[1],
                type: optMatch[2],
                next: optMatch[2] === 'next' ? optMatch[3] : null,
                hasResult: optMatch[2] === 'result'
            });
        }

        symptoms[key] = {
            question,
            options,
            numOptions: options.length
        };
    }
}

// Starting symptoms
const startingSymptoms = [
    'bas_agrisi', 'eklem_agrisi', 'goz_agrisi', 'dis_agrisi',
    'nefes_darligi', 'bogaz_agrisi', 'kulak_agrisi', 'burun_tikanikligi',
    'karin_agrisi', 'bulanti', 'kabizlik',
    'cilt_sorunu', 'halsizlik', 'carpinti', 'idrar_yanmasi'
];

// Recursive path analysis - returns detailed path information
function analyzePathsDetailed(key, visited = new Set(), currentPath = []) {
    if (visited.has(key) || !symptoms[key]) {
        return [];
    }

    visited.add(key);
    const symptom = symptoms[key];
    const paths = [];

    for (const opt of symptom.options) {
        if (opt.hasResult) {
            // This path ends here
            paths.push([...currentPath, key]);
        } else if (opt.next) {
            // This path continues
            const subPaths = analyzePathsDetailed(opt.next, new Set(visited), [...currentPath, key]);
            paths.push(...subPaths);
        }
    }

    return paths;
}

// Analyze all starting symptoms
const results = [];
for (const key of startingSymptoms) {
    if (symptoms[key]) {
        const paths = analyzePathsDetailed(key);

        if (paths.length > 0) {
            const lengths = paths.map(p => p.length);
            const min = Math.min(...lengths);
            const max = Math.max(...lengths);
            const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;

            results.push({
                id: key,
                min: min,
                max: max,
                avg: avg.toFixed(2),
                options: symptoms[key].numOptions,
                paths: paths.length
            });
        } else {
            console.log('No paths found for:', key);
        }
    } else {
        console.log('Missing symptom:', key);
    }
}

// Sort by symptom ID
results.sort((a, b) => a.id.localeCompare(b.id));

// Calculate overall statistics
const overallMin = Math.min(...results.map(r => r.min));
const overallMax = Math.max(...results.map(r => r.max));
const overallAvg = (results.reduce((sum, r) => sum + parseFloat(r.avg), 0) / results.length).toFixed(2);

// Top 10 by max questions
const top10ByMax = [...results].sort((a, b) => b.max - a.max).slice(0, 10);
// Bottom 10 by min questions
const bottom10ByMin = [...results].sort((a, b) => a.min - b.min).slice(0, 10);
// Top 10 by average questions
const top10ByAvg = [...results].sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg)).slice(0, 10);

// Output results
console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('                    SYMPTOM PATH ANALYSIS');
console.log('═══════════════════════════════════════════════════════════════════\n');

console.log('┌────────────────────┬───────────────┬───────────────┬───────────────┬───────────────┐');
console.log('│ Symptom ID        │ Min Questions │ Max Questions │ Avg Questions │ Options Count │');
console.log('├────────────────────┼───────────────┼───────────────┼───────────────┼───────────────┤');
for (const r of results) {
    console.log(`│ ${r.id.padEnd(18)} │ ${String(r.min).padStart(13)} │ ${String(r.max).padStart(13)} │ ${String(r.avg).padStart(13)} │ ${String(r.options).padStart(13)} │`);
}
console.log('└────────────────────┴───────────────┴───────────────┴───────────────┴───────────────┘');

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('                    OVERALL STATISTICS');
console.log('═══════════════════════════════════════════════════════════════════\n');
console.log(`Total unique symptoms analyzed: ${results.length}`);
console.log(`Overall minimum questions:     ${overallMin}`);
console.log(`Overall maximum questions:     ${overallMax}`);
console.log(`Overall average questions:     ${overallAvg}`);

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('              TOP 10 SYMPTOMS BY MAXIMUM QUESTIONS');
console.log('═══════════════════════════════════════════════════════════════════\n');
console.log('┌──────┬────────────────────┬───────────────┬───────────────┬───────────────┐');
console.log('│ Rank │ Symptom ID        │ Min Questions │ Max Questions │ Avg Questions │');
console.log('├──────┼────────────────────┼───────────────┼───────────────┼───────────────┤');
top10ByMax.forEach((r, i) => {
    console.log(`│ ${String(i + 1).padStart(4)} │ ${r.id.padEnd(18)} │ ${String(r.min).padStart(13)} │ ${String(r.max).padStart(13)} │ ${String(r.avg).padStart(13)} │`);
});
console.log('└──────┴────────────────────┴───────────────┴───────────────┴───────────────┘');

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('              TOP 10 SYMPTOMS BY AVERAGE QUESTIONS');
console.log('═══════════════════════════════════════════════════════════════════\n');
console.log('┌──────┬────────────────────┬───────────────┬───────────────┬───────────────┐');
console.log('│ Rank │ Symptom ID        │ Min Questions │ Max Questions │ Avg Questions │');
console.log('├──────┼────────────────────┼───────────────┼───────────────┼───────────────┤');
top10ByAvg.forEach((r, i) => {
    console.log(`│ ${String(i + 1).padStart(4)} │ ${r.id.padEnd(18)} │ ${String(r.min).padStart(13)} │ ${String(r.max).padStart(13)} │ ${String(r.avg).padStart(13)} │`);
});
console.log('└──────┴────────────────────┴───────────────┴───────────────┴───────────────┘');

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('            BOTTOM 10 SYMPTOMS BY MINIMUM QUESTIONS');
console.log('═══════════════════════════════════════════════════════════════════\n');
console.log('┌──────┬────────────────────┬───────────────┬───────────────┬───────────────┐');
console.log('│ Rank │ Symptom ID        │ Min Questions │ Max Questions │ Avg Questions │');
console.log('├──────┼────────────────────┼───────────────┼───────────────┼───────────────┤');
bottom10ByMin.forEach((r, i) => {
    console.log(`│ ${String(i + 1).padStart(4)} │ ${r.id.padEnd(18)} │ ${String(r.min).padStart(13)} │ ${String(r.max).padStart(13)} │ ${String(r.avg).padStart(13)} │`);
});
console.log('└──────┴────────────────────┴───────────────┴───────────────┴───────────────┘');

// Additional information
const additionalNodes = Object.keys(symptoms).filter(k => !startingSymptoms.includes(k));
console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('                    ADDITIONAL INFORMATION');
console.log('═══════════════════════════════════════════════════════════════════\n');
console.log(`Total symptom nodes (including intermediate): ${Object.keys(symptoms).length}`);
console.log(`Root symptoms (user selectable):              ${startingSymptoms.length}`);
console.log(`Intermediate question nodes:                  ${additionalNodes.length}`);

// Write detailed JSON output
const output = {
    summary: {
        totalSymptoms: results.length,
        overallMin,
        overallMax,
        overallAvg,
        totalNodes: Object.keys(symptoms).length,
        intermediateNodes: additionalNodes.length
    },
    symptoms: results,
    top10ByMax,
    top10ByAvg,
    bottom10ByMin
};

fs.writeFileSync('C:\\Users\\Hatice\\LUMINEX\\symptom_analysis.json', JSON.stringify(output, null, 2));
console.log('\n✓ Detailed results saved to: C:\\Users\\Hatice\\LUMINEX\\symptom_analysis.json');
