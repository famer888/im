import fs from 'fs';
import nodePath from 'path';

/**
 * 检测文件头（magic bytes）来确定真实文件类型
 * @param {string} filePath - 文件路径
 * @returns {string|null} - 文件类型或 null
 */
export const detectFileTypeFromMagicBytes = (filePath) => {
    try {
        const buffer = fs.readFileSync(filePath, { start: 0, end: 20 });
        const bytes = Array.from(buffer);
        
        // PE executable (Windows EXE, DLL)
        if (bytes[0] === 0x4D && bytes[1] === 0x5A) {
            return 'exe';
        }
        
        // ELF executable (Linux)
        if (bytes[0] === 0x7F && bytes[1] === 0x45 && bytes[2] === 0x4C && bytes[3] === 0x46) {
            return 'elf';
        }
        
        // Mach-O executable (macOS)
        if ((bytes[0] === 0xFE && bytes[1] === 0xED && bytes[2] === 0xFA && (bytes[3] === 0xCE || bytes[3] === 0xCF)) ||
            (bytes[0] === 0xCE && bytes[1] === 0xFA && bytes[2] === 0xED && (bytes[3] === 0xFE || bytes[3] === 0xFF))) {
            return 'macho';
        }
        
        // ZIP archive (could contain executables)
        if (bytes[0] === 0x50 && bytes[1] === 0x4B && (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07)) {
            return 'zip';
        }
        
        // RAR archive
        if (bytes[0] === 0x52 && bytes[1] === 0x61 && bytes[2] === 0x72 && bytes[3] === 0x21) {
            return 'rar';
        }
        
        // 7Z archive
        if (bytes[0] === 0x37 && bytes[1] === 0x7A && bytes[2] === 0xBC && bytes[3] === 0xAF) {
            return '7z';
        }
        
        // MSI installer
        if (bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0) {
            return 'msi';
        }
        
        // Batch file (text-based, check content)
        if (buffer.includes('cmd.exe') || buffer.includes('@echo') || buffer.includes('goto :')) {
            return 'batch';
        }
        
        // PowerShell script
        if (buffer.includes('powershell') || buffer.includes('Get-Command') || buffer.includes('Write-Host')) {
            return 'powershell';
        }
        
        // VBScript
        if (buffer.includes('vbscript') || buffer.includes('CreateObject') || buffer.includes('MsgBox')) {
            return 'vbscript';
        }
        
        return null;
    } catch (error) {
        console.error('Error detecting file type from magic bytes:', error);
        return null;
    }
};

/**
 * 获取文件的 MIME 类型
 * @param {string} filePath - 文件路径
 * @returns {string|null} - MIME 类型或 null
 */
export const getFileMimeType = (filePath) => {
    try {
        const ext = nodePath.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.exe': 'application/x-msdownload',
            '.bat': 'text/plain',
            '.cmd': 'text/plain',
            '.vbs': 'text/vbscript',
            '.js': 'text/javascript',
            '.ps1': 'text/plain',
            '.scr': 'application/x-msdownload',
            '.pif': 'application/x-msdownload',
            '.msi': 'application/x-msi',
            '.com': 'application/x-msdownload',
            '.lnk': 'application/x-ms-shortcut',
            '.wsf': 'text/plain',
            '.zip': 'application/zip',
            '.rar': 'application/x-rar-compressed',
            '.7z': 'application/x-7z-compressed'
        };
        
        return mimeTypes[ext] || null;
    } catch (error) {
        console.error('Error getting file MIME type:', error);
        return null;
    }
};

/**
 * 危险文件检测：只在拿到正面证据时才判危险，避免把加密下载（magic bytes 不可识别）误判。
 *  - 声明为危险扩展名 → 危险
 *  - 文件头明确识别为可执行 / 脚本 → 危险（用于伪装扩展名兜底；加密文件 magic bytes 命中不上，不会触发）
 *  - 其余（加密、普通图片/视频/文档、无法识别）→ 放行
 * @param {string} filePath - 文件路径
 * @param {string} fileName - 文件名
 * @returns {boolean} - 是否为危险文件
 */
export const isDangerousFile = (filePath, fileName) => {
    const dangerousExts = ['.exe','.bat','.cmd','.vbs','.js','.ps1','.scr','.pif','.msi','.com','.lnk','.wsf'];
    if (typeof fileName === "string" && dangerousExts.some(ext => fileName.toLowerCase().endsWith(ext))) {
        return true;
    }

    const fileType = detectFileTypeFromMagicBytes(filePath);
    if (['exe', 'elf', 'macho', 'batch', 'powershell', 'vbscript'].includes(fileType)) {
        return true;
    }

    return false;
};
