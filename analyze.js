const fs = require('fs');

const content = fs.readFileSync('C:/Users/Hatice/LUMINEX/js/symptom-checker.js', 'utf8');
const lines = content.split('\n');

let braceCount = 0;
let parenCount = 0;
let bracketCount = 0;
let inSingleQuote = false;
let inDoubleQuote = false;
let inTemplate = false;
let prevChar = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  for (let j = 0; j < line.length; j++) {
    const char = line[j];

    // Handle escapes
    if (char === '\\' && prevChar === '\\') {
      prevChar = '';
      continue;
    }

    // String tracking
    if (!inTemplate && !inDoubleQuote && char === "'" && prevChar !== '\\') {
      inSingleQuote = !inSingleQuote;
    } else if (!inTemplate && !inSingleQuote && char === '"' && prevChar !== '\\') {
      inDoubleQuote = !inDoubleQuote;
    } else if (!inSingleQuote && !inDoubleQuote && char === '`' && prevChar !== '\\') {
      inTemplate = !inTemplate;
    } else if (!inSingleQuote && !inDoubleQuote && !inTemplate) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
      if (char === '[') bracketCount++;
      if (char === ']') bracketCount--;
    }

    prevChar = char;
  }

  if (braceCount < 0 || parenCount < 0 || bracketCount < 0) {
    console.log(`ERROR at line ${i+1}:`);
    console.log(`  Braces: ${braceCount}, Parens: ${parenCount}, Brackets: ${bracketCount}`);
    console.log(`  Line: ${line.trim()}`);
    console.log(`  Context:`);
    for (let k = Math.max(0, i-2); k < Math.min(lines.length, i+3); k++) {
      console.log(`    ${k+1}: ${lines[k]}`);
    }
    break;
  }

  // Print progress every 500 lines
  if ((i + 1) % 500 === 0) {
    console.log(`Line ${i+1}: braces=${braceCount} parens=${parenCount} brackets=${bracketCount}`);
  }
}

console.log(`\nFinal: braces=${braceCount} parens=${parenCount} brackets=${bracketCount}`);
