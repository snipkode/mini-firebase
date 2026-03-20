#!/usr/bin/env node

/**
 * Backup Script for Mini Firebase
 * 
 * Usage: node scripts/backup.js [options]
 * Options:
 *   --restore <backup-file>  Restore from backup
 *   --list                   List available backups
 *   --help                   Show this help
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const logger = require('../logger');

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function getTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

function createBackup() {
    const backupName = `backup-${getTimestamp()}.tar.gz`;
    const backupPath = path.join(BACKUP_DIR, backupName);
    
    logger.info('Starting backup...', { dataDir: DATA_DIR, backupPath });
    
    try {
        // Read all data files
        const files = [];
        
        function readDirRecursive(dir, baseDir = dir) {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                // Skip hidden files and backup files
                if (entry.name.startsWith('.') && entry.name !== '.auth.json' && entry.name !== '.projects.json' && entry.name !== '.tokens.json') {
                    continue;
                }
                
                if (entry.isDirectory()) {
                    readDirRecursive(fullPath, baseDir);
                } else if (entry.isFile()) {
                    const relativePath = path.relative(baseDir, fullPath);
                    const content = fs.readFileSync(fullPath, 'utf8');
                    files.push({ path: relativePath, content });
                }
            }
        }
        
        readDirRecursive(DATA_DIR);
        
        // Create backup manifest
        const manifest = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            files: files.map(f => f.path),
            totalFiles: files.length
        };
        
        // Combine manifest and files
        const backupData = JSON.stringify({
            manifest,
            files: files.reduce((acc, f) => {
                acc[f.path] = f.content;
                return acc;
            }, {})
        });
        
        // Compress and save
        const compressed = zlib.gzipSync(Buffer.from(backupData));
        fs.writeFileSync(backupPath, compressed);
        
        logger.info('Backup completed successfully', {
            backupPath,
            totalFiles: files.length,
            size: compressed.length
        });
        
        console.log(`✓ Backup created: ${backupPath}`);
        console.log(`  Files: ${files.length}`);
        console.log(`  Size: ${(compressed.length / 1024).toFixed(2)} KB`);
        
        // Cleanup old backups (keep last 10)
        cleanupOldBackups();
        
        return backupPath;
    } catch (err) {
        logger.error('Backup failed', { error: err.message });
        console.error('✗ Backup failed:', err.message);
        process.exit(1);
    }
}

function listBackups() {
    const backups = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith('.tar.gz'))
        .sort()
        .reverse();
    
    if (backups.length === 0) {
        console.log('No backups found');
        return;
    }
    
    console.log('\nAvailable backups:\n');
    
    for (const backup of backups) {
        const backupPath = path.join(BACKUP_DIR, backup);
        const stats = fs.statSync(backupPath);
        const size = (stats.size / 1024).toFixed(2);
        const date = stats.mtime.toISOString().slice(0, 19).replace('T', ' ');
        
        console.log(`  ${backup}  ${size} KB  ${date}`);
    }
    
    console.log(`\nTotal: ${backups.length} backup(s)\n`);
}

function restoreBackup(backupFile) {
    let backupPath = backupFile;
    
    if (!path.isAbsolute(backupFile)) {
        backupPath = path.join(BACKUP_DIR, backupFile);
    }
    
    if (!fs.existsSync(backupPath)) {
        console.error(`✗ Backup file not found: ${backupPath}`);
        process.exit(1);
    }
    
    logger.info('Starting restore...', { backupPath });
    
    try {
        // Read and decompress
        const compressed = fs.readFileSync(backupPath);
        const backupData = zlib.gunzipSync(compressed).toString();
        const backup = JSON.parse(backupData);
        
        console.log(`\nRestoring backup from: ${backup.manifest.timestamp}`);
        console.log(`Files to restore: ${backup.manifest.totalFiles}\n`);
        
        // Restore files
        for (const [filePath, content] of Object.entries(backup.files)) {
            const fullPath = path.join(DATA_DIR, filePath);
            const dir = path.dirname(fullPath);
            
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(fullPath, content);
            console.log(`  ✓ ${filePath}`);
        }
        
        logger.info('Restore completed successfully', { 
            backupPath, 
            totalFiles: backup.manifest.totalFiles 
        });
        
        console.log('\n✓ Restore completed successfully!\n');
    } catch (err) {
        logger.error('Restore failed', { error: err.message });
        console.error('✗ Restore failed:', err.message);
        process.exit(1);
    }
}

function cleanupOldBackups(keep = 10) {
    const backups = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith('.tar.gz'))
        .sort()
        .reverse();
    
    if (backups.length > keep) {
        const toDelete = backups.slice(keep);
        
        for (const backup of toDelete) {
            const backupPath = path.join(BACKUP_DIR, backup);
            fs.unlinkSync(backupPath);
            logger.info('Deleted old backup', { backup });
        }
        
        console.log(`Cleaned up ${toDelete.length} old backup(s)`);
    }
}

function showHelp() {
    console.log(`
Mini Firebase Backup Tool

Usage: node scripts/backup.js [options]

Options:
  (none)                 Create a new backup
  --list                 List available backups
  --restore <file>       Restore from a backup file
  --help                 Show this help

Examples:
  node scripts/backup.js                    # Create backup
  node scripts/backup.js --list             # List backups
  node scripts/backup.js --restore backup-2024-01-01.tar.gz
  node scripts/backup.js --restore latest   # Restore most recent

Environment Variables:
  BACKUP_DIR   Directory to store backups (default: ../backups)
  DATA_DIR     Directory containing data (default: ../data)
`);
}

// Main
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    showHelp();
} else if (args.includes('--list')) {
    listBackups();
} else if (args.includes('--restore')) {
    const index = args.indexOf('--restore');
    const backupFile = args[index + 1];
    
    if (!backupFile) {
        console.error('Error: Please specify a backup file');
        process.exit(1);
    }
    
    if (backupFile === 'latest') {
        const backups = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.tar.gz'))
            .sort()
            .reverse();
        
        if (backups.length === 0) {
            console.error('No backups found');
            process.exit(1);
        }
        
        restoreBackup(backups[0]);
    } else {
        restoreBackup(backupFile);
    }
} else {
    createBackup();
}
