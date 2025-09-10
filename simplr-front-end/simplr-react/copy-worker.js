import { copyFile } from 'fs/promises';
import { join } from 'path';

async function copyWorker() {
  try {
    await copyFile('public/_worker.js', 'dist/_worker.js');
    console.log('✅ _worker.js copied to dist directory');
  } catch (error) {
    console.error('❌ Failed to copy _worker.js:', error);
    process.exit(1);
  }
}

copyWorker();