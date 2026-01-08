const fs = require('fs');
const path = require('path');
// 打包时间
function getFormattedDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}${month}${day}-${hour}${minute}`;
}

const buildTime = getFormattedDate();
const content = JSON.stringify({ buildTime }, null, 2);
const outputPath = path.resolve(__dirname, '../src/build-time.json');

fs.writeFileSync(outputPath, content);
console.log(`Build time generated: ${buildTime} at ${outputPath}`);
