#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
// @ts-check

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = process.cwd();

const oldDirName = 'supervisor-mobile';
const newDirName = 'new-app-name';

const listOfFilesAndDirsToRemove = [
  'apps',
  'components',
  'hooks',
  'scripts',
  'app.json',
  'App.tsx',
  'babel.config.js',
  'package.json',
  'tsconfig.json',
  '.gitignore',
];

const DISCLAIMER_TEXT = `
This is a fresh Expo app using the ${newDirName} directory.

You can now start developing your app!
`;

/**
 * Remove files and directories from the project
 */
function removeFilesAndDirs() {
  console.log('🗑️  Removing old files and directories...');

  listOfFilesAndDirsToRemove.forEach((fileOrDir) => {
    const fullPath = path.join(root, fileOrDir);
    try {
      if (fs.existsSync(fullPath)) {
        if (fs.lstatSync(fullPath).isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(fullPath);
        }
        console.log(`   Removed: ${fileOrDir}`);
      }
    } catch (error) {
      console.error(`   Error removing ${fileOrDir}:`, error);
    }
  });
}

/**
 * Create new project structure
 */
function createNewStructure() {
  console.log('\n📁 Creating new project structure...');

  // Create basic directories
  const directories = ['app', 'components', 'hooks', 'assets'];
  directories.forEach((dir) => {
    const dirPath = path.join(root, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`   Created: ${dir}/`);
    }
  });

  // Create a basic app/index.tsx
  const indexContent = `import { View, Text, StyleSheet } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to ${newDirName}!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
`;

  fs.writeFileSync(path.join(root, 'app', 'index.tsx'), indexContent);
  console.log('   Created: app/index.tsx');
}

/**
 * Main reset function
 */
function resetProject() {
  console.log('🔄 Resetting project...\n');

  try {
    removeFilesAndDirs();
    createNewStructure();

    console.log('\n✅ Project reset complete!');
    console.log(DISCLAIMER_TEXT);
  } catch (error) {
    console.error('\n❌ Error resetting project:', error);
    process.exit(1);
  }
}

// Run the reset
resetProject();
