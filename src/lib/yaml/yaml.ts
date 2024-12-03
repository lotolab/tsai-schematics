
import { Abortable } from 'events';
import  { PathLike } from 'fs'

export type ReaderOptions =  ({
    encoding?: null | undefined;
    flag?: string | undefined;
} & Abortable)|undefined |null

export interface Yaml {
    readSync(file:PathLike,options?:ReaderOptions):Record<string,any>|undefined
    writeSync(data:string,filename?:string):undefined
    writeYamlSync(data:Record<string,any>,file:PathLike):undefined
    mergePkgSync(pkgbase:string,filename?:string):Record<string,any>|undefined
    // writeSync(data:string,file:PathLike)
}

