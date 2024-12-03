import { src, task ,series} from 'gulp';
import * as clean from 'gulp-clean';

import { sources,dist } from '../config';
import * as rimraf from 'rimraf'
import path = require('path');



/**
 * Cleans the build output assets from the src folders
 */
function cleanSrc() {
  const files = sources.map(folder => [
    `${folder}/**/*.js`,
    `${folder}/**/*.d.ts`,
    `${folder}/**/*.js.map`,
    `${folder}/**/*.d.ts.map`,
  ]);
  return src(files.reduce((a, b) => a.concat(b), []), {
    read: false,
    ignore: ['**/files/**/*', '**/*.schema.d.ts', '**/workspace/**/*'],
  }).pipe(clean());
}

function cleanDist(){
  const files = dist.map(folder => 
    `${folder}/*`
  );
  return src(files,{read:false}).pipe(clean())
}

task('clean:dist',cleanDist);
task('clean:src',cleanSrc);
task('clean:all',series(cleanDist,cleanSrc))