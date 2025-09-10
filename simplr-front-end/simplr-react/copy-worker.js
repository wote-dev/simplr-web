import { copyFile } from 'fs/promises';
import { join } from 'path';

async function copyWorker() {
  try {
    await copyFile('public/_worker.js', 'dist/_worker.js');
    await copyFile('public/.assetsignore', 'dist/.assetsignore');
    console.log('✅ _worker.js and .assetsignore copied to dist directory');
  } catch (error) {
    console.error('❌ Failed to copy files:', error);
    process.exit(1);
  }
}

copyWorker();