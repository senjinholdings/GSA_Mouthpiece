const fs = require('fs');

const css = fs.readFileSync('styles.min.css', 'utf8');

const checks = [
  {
    name: 'table-header with sticky',
    regex: /\.medical-columns-section\s*\.table-header\s*\{[^}]*position:\s*sticky[^}]*\}/,
  },
  {
    name: 'table-header with top:0',
    regex: /\.medical-columns-section\s*\.table-header\s*\{[^}]*top:\s*0[^}]*\}/,
  },
  {
    name: 'table-header with z-index',
    regex: /\.medical-columns-section\s*\.table-header\s*\{[^}]*z-index:\s*10[^}]*\}/,
  },
  {
    name: 'th with sticky',
    regex: /\.medical-columns-section\s*\.table-header\s+th\s*\{[^}]*position:\s*sticky[^}]*\}/,
  }
];

console.log('=== Checking styles.min.css ===\n');

checks.forEach(check => {
  const found = check.regex.test(css);
  console.log((found ? '✓' : '✗') + ' ' + check.name + ': ' + (found ? 'FOUND' : 'NOT FOUND'));
});

console.log('\n=== Actual CSS Rules ===\n');

const tableHeaderMatch = css.match(/\.medical-columns-section\s*\.table-header\s*\{[^}]*\}/);
if (tableHeaderMatch) {
  console.log('table-header:', tableHeaderMatch[0]);
}

const thMatch = css.match(/\.medical-columns-section\s*\.table-header\s+th\s*\{[^}]*\}/);
if (thMatch) {
  console.log('table-header th:', thMatch[0]);
}
