/**
 * Extracts or generates debug ID from React Native source map and bundle
 * Usage: node tools/scripts/extract-debug-id.mjs <project-root> [platform]
 * Platform: 'android' (default) or 'ios'
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { join } from 'path';

const projectRoot = process.argv[2] || process.cwd();
const platform = (process.argv[3] || 'android').toLowerCase();

const isIOS = platform === 'ios';

const sourceMapPath = isIOS
  ? join(projectRoot, 'ios/build/Build/Products/Release-iphoneos/main.jsbundle.map')
  : join(projectRoot, 'android/app/build/generated/sourcemaps/react/release/index.android.bundle.map');

const bundlePath = isIOS
  ? join(projectRoot, 'ios/build/Build/Products/Release-iphoneos/main.jsbundle')
  : join(projectRoot, 'android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle');

function hexToUUID(hex) {
  const uuid = hex.substring(0, 32);
  return `${uuid.substring(0, 8)}-${uuid.substring(8, 12)}-${uuid.substring(12, 16)}-${uuid.substring(16, 20)}-${uuid.substring(20, 32)}`;
}

function generateDebugIdFromBundle(bundlePath) {
  if (!existsSync(bundlePath)) {
    return null;
  }
  
  const bundleContent = readFileSync(bundlePath, 'utf8');
  const hash = createHash('md5').update(bundleContent).digest('hex');
  return hexToUUID(hash);
}

function extractDebugIdFromBundle(bundlePath) {
  if (!existsSync(bundlePath)) {
    return null;
  }
  
  const bundleContent = readFileSync(bundlePath, 'utf8');
  const match = bundleContent.match(
    /(?:bitdrift|bd)-dbid-([0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12})/i
  );
  return match ? match[1] : null;
}

try {
  let debugId = null;
  let debugIdSource = null;
  
  if (existsSync(sourceMapPath)) {
    const sourceMapContent = readFileSync(sourceMapPath, 'utf8');
    const sourceMap = JSON.parse(sourceMapContent);
    
    debugId = sourceMap.debug_id || sourceMap.debugId || sourceMap.bitdrift_debug_id;
    if (debugId) {
      debugIdSource = 'source_map';
    }
  } else {
    console.warn(`Source map not found at: ${sourceMapPath}`);
  }
  
  if (!debugId) {
    debugId = extractDebugIdFromBundle(bundlePath);
    if (debugId) {
      debugIdSource = 'bundle_injected';
    }
  }
  
  if (!debugId) {
    debugId = generateDebugIdFromBundle(bundlePath);
    if (debugId) {
      debugIdSource = 'generated_from_bundle';
    }
  }
  
  if (!debugId) {
    console.error('Could not extract or generate debug ID.');
    console.error('Source map path:', sourceMapPath);
    console.error('Bundle path:', bundlePath);
    console.error('Make sure you have built the release bundle first.');
    process.exit(1);
  }
  
  if (existsSync(sourceMapPath) && debugId) {
    const sourceMapContent = readFileSync(sourceMapPath, 'utf8');
    const sourceMap = JSON.parse(sourceMapContent);
    let sourceMapModified = false;
    
    if (!sourceMap.debug_id && !sourceMap.debugId) {
      sourceMap.debug_id = debugId;
      sourceMap.debugId = debugId;
      sourceMapModified = true;
      console.log('Injected debug_id into source map');
      debugIdSource = 'injected_into_source_map';
    } else if (sourceMap.debug_id || sourceMap.debugId) {
      const existingDebugId = sourceMap.debug_id || sourceMap.debugId;
      if (existingDebugId !== debugId) {
        console.warn(`Warning: Source map has different debug_id (${existingDebugId}) than generated one (${debugId})`);
        console.warn('Using the existing debug_id from source map.');
        debugId = existingDebugId;
        debugIdSource = 'source_map';
      }
    }
    
    const expectedFileName = isIOS ? 'main.jsbundle' : 'index.android.bundle';
    if (sourceMap.file && sourceMap.file !== expectedFileName) {
      console.log(`Updating source map 'file' field from "${sourceMap.file}" to "${expectedFileName}"`);
      sourceMap.file = expectedFileName;
      sourceMapModified = true;
    } else if (!sourceMap.file) {
      console.log(`Adding 'file' field to source map: "${expectedFileName}"`);
      sourceMap.file = expectedFileName;
      sourceMapModified = true;
    }
    
    if (sourceMapModified) {
      writeFileSync(sourceMapPath, JSON.stringify(sourceMap, null, 2), 'utf8');
      console.log('Updated source map file');
    }
  }
  
  console.log('Debug ID:', debugId);
  console.log('Debug ID Source:', debugIdSource);
  console.log('Source Map Path:', sourceMapPath);
  console.log('Bundle Path:', bundlePath);
  
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ 
      debugId, 
      debugIdSource,
      sourceMapPath,
      bundlePath 
    }, null, 2));
  } else {
    console.log(`export DEBUG_ID="${debugId}"`);
    console.log(`export SOURCE_MAP_PATH="${sourceMapPath}"`);
    console.log(`export BUNDLE_PATH="${bundlePath}"`);
  }
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

