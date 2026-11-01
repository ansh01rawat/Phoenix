export const MAX_PROJECT_FILES = 200;
export const MAX_PROJECT_BYTES = 20 * 1024 * 1024;

const ignoredSegments = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', '.next', '.turbo']);
const ignoredCredentialDirectories = new Set(['.ssh', '.aws', '.azure', '.gcloud', '.kube', '.docker']);
const ignoredCredentialFiles = new Set(['.npmrc', '.pypirc', '.netrc', '.git-credentials', '.dockercfg', 'kubeconfig']);

function isCredentialPath(relativePath) {
  const segments = relativePath.split('/');
  const filename = segments.at(-1).toLowerCase();
  return segments.some((segment) => ignoredCredentialDirectories.has(segment.toLowerCase()))
    || ignoredCredentialFiles.has(filename)
    || /(?:^|[._-])secrets?(?:[._-]|$)/i.test(filename)
    || /(?:private[-_.]?key|service[-_.]?account)/i.test(filename)
    || /(?:^|\.)id_(?:rsa|ed25519|ecdsa|dsa)(?:$|\.)/i.test(filename)
    || /\.(?:pem|key|p12|pfx|keystore|jks)$/i.test(filename)
    || /(?:^|[._-])credentials?(?:[._-]|$)/i.test(filename);
}

export function isIgnoredProjectPath(relativePath) {
  const segments = relativePath.split('/');
  return segments.some((segment) => ignoredSegments.has(segment.toLowerCase()))
    || segments.some((segment) => segment.toLowerCase() === '.env' || segment.toLowerCase().startsWith('.env.'))
    || isCredentialPath(relativePath);
}

export function normalizeProjectPath(value) {
  if (typeof value !== 'string' || value.length === 0 || value.includes('\0')) {
    throw new Error('Each imported file needs a valid relative path.');
  }
  const normalized = value.replaceAll('\\', '/');
  if (normalized.startsWith('/') || /^[a-z]:/i.test(normalized)) {
    throw new Error('Imported file paths must stay inside the selected folder.');
  }
  const segments = normalized.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    throw new Error('Imported file paths cannot contain empty or traversal segments.');
  }
  return segments.join('/');
}

export function validateProjectFiles(files) {
  if (!Array.isArray(files) || files.length === 0) throw new Error('Choose a folder that contains website files.');
  if (files.length > MAX_PROJECT_FILES) throw new Error(`A folder can contain at most ${MAX_PROJECT_FILES} files for this MVP.`);

  const seen = new Set();
  const kept = [];
  let totalBytes = 0;
  let skippedCount = 0;
  for (const item of files) {
    const relativePath = normalizeProjectPath(item?.path);
    if (isIgnoredProjectPath(relativePath)) {
      skippedCount += 1;
      continue;
    }
    const key = relativePath.toLocaleLowerCase('en-US');
    if (seen.has(key)) throw new Error(`The selected folder contains duplicate file paths: ${relativePath}`);
    seen.add(key);
    if (typeof item.data !== 'string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(item.data)) {
      throw new Error(`Phoenix could not read ${relativePath}. Please choose the folder again.`);
    }
    const contents = Buffer.from(item.data, 'base64');
    totalBytes += contents.byteLength;
    if (totalBytes > MAX_PROJECT_BYTES) throw new Error('The selected source folder must be 20 MB or smaller for this MVP.');
    kept.push({ path: relativePath, contents });
  }
  if (kept.length === 0) throw new Error('The selected folder only contains generated or private files. Choose the website source folder.');
  return { files: kept, totalBytes, skippedCount };
}

export function projectDisplayName(value) {
  if (typeof value !== 'string') return 'Imported website';
  const name = value.trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').slice(0, 80);
  return name || 'Imported website';
}

function parsePackageManifest(manifestFile) {
  try {
    const manifest = JSON.parse(manifestFile.contents.toString('utf8'));
    return manifest && typeof manifest === 'object' ? manifest : {};
  } catch {
    return {};
  }
}

export function detectProjectMetadata(files) {
  const paths = files.map((file) => file.path);
  const packageFiles = files.filter((file) => file.path.split('/').at(-1).toLowerCase() === 'package.json')
    .sort((a, b) => a.path.split('/').length - b.path.split('/').length);
  const manifestFile = packageFiles[0];
  const manifest = manifestFile ? parsePackageManifest(manifestFile) : {};
  const dependencies = { ...manifest.dependencies, ...manifest.devDependencies };
  const scripts = manifest.scripts || {};
  const packageRoot = manifestFile?.path.split('/').slice(0, -1).join('/') || '';
  const withinPackage = (candidate) => !packageRoot || candidate.startsWith(`${packageRoot}/`);
  const packageNames = new Set(paths.filter(withinPackage).map((filePath) => filePath.slice(packageRoot ? packageRoot.length + 1 : 0).split('/')[0]));

  let framework = 'unknown';
  let entryPoint = null;
  if (dependencies.next || paths.some((filePath) => withinPackage(filePath) && /^next\.config\./i.test(filePath.split('/').at(-1)))) {
    framework = 'nextjs';
    entryPoint = `${manifestFile?.path || 'package.json'}#scripts.dev`;
  } else if (dependencies.vite || (typeof scripts.dev === 'string' && /\bvite\b/.test(scripts.dev))) {
    framework = dependencies.react ? 'react-vite' : 'vite';
    entryPoint = `${manifestFile?.path || 'package.json'}#scripts.dev`;
  } else if (manifestFile && typeof scripts.start === 'string') {
    framework = 'node';
    entryPoint = `${manifestFile.path}#scripts.start`;
  } else {
    const htmlEntry = paths.filter((filePath) => withinPackage(filePath) && filePath.split('/').at(-1).toLowerCase() === 'index.html')
      .sort((a, b) => a.split('/').length - b.split('/').length)[0];
    if (htmlEntry) {
      framework = 'static-html';
      entryPoint = htmlEntry;
    }
  }

  let packageManager = 'unknown';
  if (manifestFile) {
    if (packageNames.has('pnpm-lock.yaml')) packageManager = 'pnpm';
    else if (packageNames.has('yarn.lock')) packageManager = 'yarn';
    else if (packageNames.has('bun.lock') || packageNames.has('bun.lockb')) packageManager = 'bun';
    else if (packageNames.has('package-lock.json') || packageNames.has('npm-shrinkwrap.json')) packageManager = 'npm';
    else packageManager = 'npm';
  }

  return { framework, entryPoint, packageManager };
}
