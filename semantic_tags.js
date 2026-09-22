const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'src/app/intelligence/page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');

// Replace the inner structure of the slide-over panel
pageContent = pageContent.replace(
  /<div style=\{\{display: 'flex', flexDirection: 'column', height: '100%'\}\}>/g,
  '<div style={{display: "flex", flexDirection: "column", height: "100%"}}>'
);

pageContent = pageContent.replace(
  /\{\/\* Header \(Fixed\) \*\/\}\s*<div style=\{\{padding: '24px 32px'/g,
  '{/* Header (Fixed) */}\n                        <header className="challenge-header" style={{padding: "24px 32px"'
);

// We know the header ends before `{/* Scrollable Content */}`
// The scrollable content starts at `<div style={{flexGrow: 1, overflowY: 'auto'`
pageContent = pageContent.replace(
  /\{\/\* Scrollable Content \*\/\}\s*<div style=\{\{flexGrow: 1, overflowY: 'auto'/g,
  '</header>\n                        {/* Scrollable Content */}\n                        <main className="challenge-content" style={{flexGrow: 1, overflowY: "auto"'
);

// The footer starts at `{/* Bottom CTA (Fixed at bottom) */}`
pageContent = pageContent.replace(
  /\{\/\* Bottom CTA \(Fixed at bottom\) \*\/\}\s*<div style=\{\{padding: '24px 32px'/g,
  '</main>\n                        {/* Bottom CTA (Fixed at bottom) */}\n                        <footer className="challenge-footer" style={{padding: "24px 32px"'
);

// We need to change the last `</div>` of the footer to `</footer>` and the last `</div>` of the flex column to `</div>`
// Wait, the block was:
/*
                        <footer ...>
                          ...
                        </div>
                      </div>
*/
pageContent = pageContent.replace(
  /<\/div>\s*<\/div>\s*\);\s*\}\)\(\)\}/,
  '</footer>\n                      </div>\n                    );\n                  })()}'
);

fs.writeFileSync(pagePath, pageContent);
console.log("Semantic tags updated.");
