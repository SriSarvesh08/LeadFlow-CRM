const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../../..');
const sharedRoot = path.join(repoRoot, 'shared');
const shared = require('../../../shared');

const getJavaScriptFiles = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return getJavaScriptFiles(entryPath);
    }
    return entry.isFile() && entry.name.endsWith('.js') ? [entryPath] : [];
  });

const getBackendSourceFiles = () => {
  const gatewaySource = path.join(repoRoot, 'gateway', 'src');
  const servicesRoot = path.join(repoRoot, 'services');
  const serviceSources = fs.readdirSync(servicesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(servicesRoot, entry.name, 'src'))
    .filter((directory) => fs.existsSync(directory));

  return [gatewaySource, ...serviceSources].flatMap(getJavaScriptFiles);
};

const getSharedImports = (sourceFiles) => sourceFiles.flatMap((filePath) => {
  const source = fs.readFileSync(filePath, 'utf8');
  const importPattern = /\b(?:const|let|var)\s*\{\s*([^}]+)\s*\}\s*=\s*require\(\s*(['"])([^'"]+)\2\s*\)/g;
  const imports = [];
  let match;

  while ((match = importPattern.exec(source)) !== null) {
    const resolvedImport = path.resolve(path.dirname(filePath), match[3]);
    if (resolvedImport !== sharedRoot) {
      continue;
    }

    match[1].split(',').forEach((specifier) => {
      const importedName = specifier.trim().split(':')[0].trim();
      if (importedName) {
        imports.push({
          file: path.relative(repoRoot, filePath),
          name: importedName,
        });
      }
    });
  }

  return imports;
});

describe('Week 1 backend shared utility exports', () => {
  test('every shared utility imported by backend source files is exported', () => {
    const sharedImports = getSharedImports(getBackendSourceFiles());
    if (sharedImports.length === 0) {
      throw new Error('No shared utility imports were found in gateway or service source files.');
    }

    const missingExports = sharedImports.filter(
      ({ name }) => !Object.prototype.hasOwnProperty.call(shared, name)
    );

    if (missingExports.length > 0) {
      const details = missingExports
        .map(({ file, name }) => `- ${file}: "${name}" is not exported by shared/`)
        .join('\n');
      throw new Error(`Backend imports missing shared utility exports:\n${details}`);
    }
  });
});
