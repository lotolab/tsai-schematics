
import { task, src, dest } from 'gulp';
import {sourcesPaths} from '../config'

function copyLibMisc(){
    const miscFiles = src(['collection.json','schema.json', '.npmignore'])

    return sourcesPaths.reduce((stream,libPath)=>{
console.log(libPath)
        // return stream.pipe(dest(libPath))
    },miscFiles)
}

task('copy-misc', copyLibMisc);