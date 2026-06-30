const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEMP_DIR_NAME = 'clean_temp_pkg';
const ZIP_FILE_NAME = 'eproject2_nhom5.zip';

const IGNORE_LIST = [
  'node_modules',
  '.git',
  '.vscode',
  '.claude',
  'dist',
  TEMP_DIR_NAME,
  ZIP_FILE_NAME,
  'package-project.js'
];

function shouldCopy(srcPath) {
  const relative = path.relative(__dirname, srcPath);
  if (!relative) return true; // root path
  
  const parts = relative.split(path.sep);
  
  // Check if path contains any ignored directory/file
  for (const part of parts) {
    if (IGNORE_LIST.includes(part)) {
      return false;
    }
  }

  const baseName = path.basename(srcPath);

  // Exclude environment secrets files (keep env.example)
  if (baseName === '.env' || baseName.endsWith('.env.local') || baseName.endsWith('.env.development') || baseName.endsWith('.env.production')) {
    return false;
  }

  // Exclude Excel temporary files
  if (baseName.startsWith('~$')) {
    return false;
  }

  // Exclude existing zip files
  if (baseName.endsWith('.zip')) {
    return false;
  }

  return true;
}

function cleanDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

function run() {
  console.log('=== STARTING PROJECT CLEANUP AND PACKAGING ===');
  const tempDirPath = path.join(__dirname, TEMP_DIR_NAME);
  const zipFilePath = path.join(__dirname, ZIP_FILE_NAME);

  // 1. Clean previous runs
  console.log(`Cleaning old temp folder & zip...`);
  cleanDirectory(tempDirPath);
  if (fs.existsSync(zipFilePath)) {
    fs.unlinkSync(zipFilePath);
  }

  // 2. Copy source files recursively
  console.log(`Copying files to temporary folder '${TEMP_DIR_NAME}'...`);
  try {
    fs.mkdirSync(tempDirPath, { recursive: true });
    const items = fs.readdirSync(__dirname);
    for (const item of items) {
      const itemPath = path.join(__dirname, item);
      if (shouldCopy(itemPath)) {
        fs.cpSync(itemPath, path.join(tempDirPath, item), {
          recursive: true,
          filter: shouldCopy
        });
      }
    }
    console.log('✓ Source files copied successfully.');
  } catch (err) {
    console.error('✗ Copy failed:', err.message);
    process.exit(1);
  }

  // 3. Compress using PowerShell Compress-Archive
  console.log(`Compressing files to '${ZIP_FILE_NAME}'...`);
  try {
    const command = `powershell -Command "Compress-Archive -Path ${TEMP_DIR_NAME}\\* -DestinationPath ${ZIP_FILE_NAME} -Force"`;
    execSync(command, { stdio: 'inherit' });
    console.log(`✓ Compression completed successfully! Generated '${ZIP_FILE_NAME}'.`);
  } catch (err) {
    console.error('✗ Compression failed. Attempting fallback method...');
    try {
      // Fallback zip command if powershell failed or not on Windows
      execSync(`zip -r ${ZIP_FILE_NAME} ${TEMP_DIR_NAME}/*`, { stdio: 'inherit' });
      console.log(`✓ Compression completed successfully using zip fallback!`);
    } catch (fallbackErr) {
      console.error('✗ Fallback compression failed:', fallbackErr.message);
      console.log('Please zip the project manually. Clean source files are located in:', tempDirPath);
      process.exit(1);
    }
  }

  // 4. Clean up temp folder
  console.log(`Cleaning up temporary folder...`);
  cleanDirectory(tempDirPath);
  console.log('✓ Cleanup done.');
  
  console.log('\n=== PACKAGING SUCCESSFUL ===');
  console.log(`Your assignment code is packaged in: ${ZIP_FILE_NAME}`);
  console.log('To run the project:');
  console.log('  1. Unzip the file');
  console.log('  2. Run "npm install" in both backend/ and frontend/');
  console.log('  3. Configure your backend/.env (copy backend/.env.example)');
  console.log('  4. Run "npm run dev" in both backend/ and frontend/');
  console.log('============================================\n');
}

run();
