import { join, normalize, Path, strings } from '@angular-devkit/core';
import {
  apply,
  branchAndMerge,
  chain,
  mergeWith,
  move,
  noop,
  Rule,
  SchematicsException,
  Source,
  template,
  Tree,
  url,
} from '@angular-devkit/schematics';
import { parse } from 'jsonc-parser';
import { normalizeToKebabOrSnakeCase } from '../../utils/formatting';
import {
  DEFAULT_AUTHOR,
  DEFAULT_DESCRIPTION,
  DEFAULT_LANGUAGE,
  DEFAULT_LIB_PATH,
  DEFAULT_PATH_NAME,
  DEFAULT_PUBLISH_LIBBDIR,
  PROJECT_TYPE,
} from '../defaults';
import { LibraryOptions } from './library.schema';
import { FileSystemReader } from '../readers';
import { YamlLoader } from '../yaml/indext';
import { npmignoreContent, npmrcContent } from './npm.content';

type UpdateJsonFn<T> = (obj: T) => T | void;
interface TsConfigPartialType {
  compilerOptions: {
    baseUrl: string;
    paths: {
      [key: string]: string[];
    };
  };
}

export function main(options: LibraryOptions): Rule {
  options = transform(options);
  return chain([
    addLibraryToCliOptions(options.path, options.name),
    updatePackageJson(options),
    updateJestEndToEnd(options),
    updateTsConfig(options.name, options.prefix, options.path),
    (host:Tree,context)=> 
      isMonorepo(host) ? 
    chain([
      branchAndMerge(mergeWith(generate(options,host))),
      branchAndMerge(mergeWith(generatePackages(options,host))),
    ])(host,context) : 
    chain([branchAndMerge(mergeWith(generate(options,host)))])(host,context),
    (tree:Tree)=>updatePnpmWorkspaceYaml(options,tree)
  ]);
}

function getDefaultLibraryPrefix(defaultLibraryPrefix = '@tsai-platform') {
  const fileSystemReader = new FileSystemReader(process.cwd())
  const content: string | undefined = fileSystemReader.readSyncAnyOf([
    'nest-cli.json',
    '.nestcli.json',
    '.nest-cli.json',
    'nest.json',
  ]);
  
  try {
    const nestJson = JSON.parse(content || '{}');
    if (nestJson.hasOwnProperty('defaultLibraryPrefix')) {
      return nestJson['defaultLibraryPrefix'];
    }
  } catch (e) {
  }
  
  return defaultLibraryPrefix;
}

function transform(options: LibraryOptions): LibraryOptions {
  const target: LibraryOptions = Object.assign({}, options);
  const defaultSourceRoot =
    options.rootDir !== undefined ? options.rootDir : DEFAULT_LIB_PATH;

  

  if (!target.name) {
    throw new SchematicsException('Option (name) is required.');
  }
  target.language = !!target.language ? target.language : DEFAULT_LANGUAGE;
  target.name = normalizeToKebabOrSnakeCase(target.name);
  target.path =
    target.path !== undefined
      ? join(normalize(defaultSourceRoot), target.path)
      : normalize(defaultSourceRoot);

  target.prefix = target.prefix || getDefaultLibraryPrefix();

  if(options.libPublishing){
    target.author = !!target.author ? target.author : DEFAULT_AUTHOR;
    target.description = !!target.description
      ? target.description
      : `${DEFAULT_DESCRIPTION} ${target.name}`;
  }

  target.pkgBase = options.pkgBase || DEFAULT_PUBLISH_LIBBDIR

  return target;
}

/**
 * 
 * @param options 
 * @returns tree
 */
function updatePackageJson(options: LibraryOptions) {
  return (host: Tree) => {
    if (!host.exists('package.json')) {
      return host;
    }
    const distRoot = join(options.path as Path, options.name, 'src');
    const packageKey = options.prefix
      ? options.prefix + '/' + options.name
      : options.name;

    return updateJsonFile(
      host,
      'package.json',
      (packageJson: Record<string, any>) => {
        updateNpmScripts(packageJson.scripts, options);
        updateJestConfig(packageJson.jest, options, packageKey, distRoot);
      },
    );
  };
}

function updateJestConfig(
  jestOptions: Record<string, any>,
  options: LibraryOptions,
  packageKey: string,
  distRoot: string,
) {
  if (!jestOptions) {
    return;
  }
  if (jestOptions.rootDir === DEFAULT_PATH_NAME) {
    jestOptions.rootDir = '.';
    jestOptions.coverageDirectory = './coverage';
  }
  const defaultSourceRoot =
    options.rootDir !== undefined ? options.rootDir : DEFAULT_LIB_PATH;

  const jestSourceRoot = `<rootDir>/${defaultSourceRoot}/`;
  if (!jestOptions.roots) {
    jestOptions.roots = ['<rootDir>/src/', jestSourceRoot];
  } else if (jestOptions.roots.indexOf(jestSourceRoot) < 0) {
    jestOptions.roots.push(jestSourceRoot);
  }

  if (!jestOptions.moduleNameMapper) {
    jestOptions.moduleNameMapper = {};
  }
  const packageKeyRegex = '^' + packageKey + '(|/.*)$';
  const packageRoot = join('<rootDir>' as Path, distRoot);
  jestOptions.moduleNameMapper[packageKeyRegex] = join(packageRoot, '$1');
}

function updateNpmScripts(
  scripts: Record<string, any>,
  options: LibraryOptions,
) {
  if (!scripts) {
    return;
  }
  const defaultFormatScriptName = 'format';
  if (!scripts[defaultFormatScriptName]) {
    return;
  }

  if (
    scripts[defaultFormatScriptName] &&
    scripts[defaultFormatScriptName].indexOf(DEFAULT_PATH_NAME) >= 0
  ) {
    const defaultSourceRoot =
      options.rootDir !== undefined ? options.rootDir : DEFAULT_LIB_PATH;
    scripts[
      defaultFormatScriptName
    ] = `prettier --write "src/**/*.ts" "test/**/*.ts" "${defaultSourceRoot}/**/*.ts"`;
  }
}

function updateJestEndToEnd(options: LibraryOptions) {
  return (host: Tree) => {
    const pathToFile = join('test' as Path, 'jest-e2e.json');
    if (!host.exists(pathToFile)) {
      return host;
    }
    const distRoot = join(options.path as Path, options.name, 'src');
    const packageKey = options.prefix
      ? options.prefix + '/' + options.name
      : options.name;

    return updateJsonFile(
      host,
      pathToFile,
      (jestOptions: Record<string, any>) => {
        if (!jestOptions.moduleNameMapper) {
          jestOptions.moduleNameMapper = {};
        }
        const deepPackagePath = packageKey + '/(.*)';
        const packageRoot = '<rootDir>/../' + distRoot;
        jestOptions.moduleNameMapper[deepPackagePath] = packageRoot + '/$1';
        jestOptions.moduleNameMapper[packageKey] = packageRoot;
      },
    );
  };
}

function updateJsonFile<T>(
  host: Tree,
  path: string,
  callback: UpdateJsonFn<T>,
): Tree {
  const source = host.read(path);
  if (source) {
    const sourceText = source.toString('utf-8');
    const json = parse(sourceText);
    callback(json as unknown as T);
    host.overwrite(path, JSON.stringify(json, null, 2));
  }
  return host;
}

function updateTsConfig(
  packageName: string,
  packagePrefix: string,
  root: string,
) {
  return (host: Tree) => {
    if (!host.exists('tsconfig.json')) {
      return host;
    }
    const distRoot = join(root as Path, packageName, 'src');
    const packageKey = packagePrefix
      ? packagePrefix + '/' + packageName
      : packageName;

    return updateJsonFile(
      host,
      'tsconfig.json',
      (tsconfig: TsConfigPartialType) => {
        if (!tsconfig.compilerOptions) {
          tsconfig.compilerOptions = {} as any;
        }
        if (!tsconfig.compilerOptions.baseUrl) {
          tsconfig.compilerOptions.baseUrl = './';
        }
        if (!tsconfig.compilerOptions.paths) {
          tsconfig.compilerOptions.paths = {};
        }
        if (!tsconfig.compilerOptions.paths[packageKey]) {
          tsconfig.compilerOptions.paths[packageKey] = [];
        }
        tsconfig.compilerOptions.paths[packageKey].push(distRoot);

        const deepPackagePath = packageKey + '/*';
        if (!tsconfig.compilerOptions.paths[deepPackagePath]) {
          tsconfig.compilerOptions.paths[deepPackagePath] = [];
        }
        tsconfig.compilerOptions.paths[deepPackagePath].push(distRoot + '/*');
      },
    );
  };
}

// 
function addLibraryToCliOptions(
  projectRoot: string,
  projectName: string,
): Rule {
  const rootPath = join(projectRoot as Path, projectName);
  const project = {
    type: PROJECT_TYPE.LIBRARY,
    root: rootPath,
    entryFile: 'index',
    sourceRoot: join(rootPath, 'src'),
    compilerOptions: {
      tsConfigPath: join(rootPath, 'tsconfig.lib.json'),
    },
  };
  return (host: Tree) => {
    const nestFileExists = host.exists('nest.json');

    let nestCliFileExists = host.exists('nest-cli.json');
    if (!nestCliFileExists && !nestFileExists) {
      host.create('nest-cli.json', '{}');
      nestCliFileExists = true;
    }
    return updateJsonFile(
      host,
      nestCliFileExists ? 'nest-cli.json' : 'nest.json',
      (optionsFile: Record<string, any>) => {
        if (!optionsFile.projects) {
          optionsFile.projects = {} as any;
        }
        if (!optionsFile.compilerOptions) {
          optionsFile.compilerOptions = {};
        }
        if (optionsFile.compilerOptions.webpack === undefined) {
          optionsFile.compilerOptions.webpack = true;
        }
        if (optionsFile.projects[projectName]) {
          throw new SchematicsException(
            `Project "${projectName}" exists in this workspace already.`,
          );
        }
        optionsFile.projects[projectName] = project;
      },
    );
  };
}

function isMonorepo(host:Tree){
  const nestFileExists = host.exists('nest.json');
  const nestCliFileExists = host.exists('nest-cli.json');
  if (!nestFileExists && !nestCliFileExists) {
    return false;
  }
  const filename = nestCliFileExists ? 'nest-cli.json' : 'nest.json';
  const source = host.read(filename);
  if (!source) {
    return false;
  }
  const sourceText = source.toString('utf-8');
  const optionsObj = parse(sourceText) as Record<string, any>;
  return !!optionsObj.monorepo;
}

function generate(options: LibraryOptions,host:Tree): Source {
  const path = join(options.path as Path, options.name);

  const packageKey = !!options.libPublishing
  ? options.prefix || `@tsai-platform` + '/' + options.name
  : options.name;

  // write npm
  if(options.libPublishing){

    if(!host.exists('.npmrc')){
      host.create('.npmrc',npmrcContent)
    }

    if(!host.exists('.npmignore')){
      host.create('.npmignore',npmignoreContent)
    }
  }

  return apply(url(join('./files' as Path, !!options.libPublishing? `ts-lib` : options.language)), [
    template({
      ...strings,
      ...{
        ...options,
        packageKey
      },
    }),
    move(path),
  ]);
}

function updatePnpmWorkspaceYaml(options: LibraryOptions,host:Tree){
  if(!isMonorepo(host))return host
  const pkgbase = options.rootDir||DEFAULT_LIB_PATH
  try {
    const yamlLoader = new YamlLoader(process.cwd())
    yamlLoader.mergePkgSync(pkgbase)
  } catch (_e) {
    
  }

  return host
}

// 
function generatePackages(options: LibraryOptions,host:Tree){
  const pkgname = options.pkgBase?  options.pkgBase :DEFAULT_PUBLISH_LIBBDIR
  const pkgPath = join(host.root.path,pkgname)
  return apply(url(join('./workspace' as Path, 'packages')), [
    template({
      ...strings,
      ...options,
    }),
    move(pkgPath),
  ]);
}
