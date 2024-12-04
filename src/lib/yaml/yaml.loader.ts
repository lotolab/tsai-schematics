import * as fs from "fs";
import * as path from 'path'
import { Yaml } from "./yaml";
import * as yaml from 'js-yaml'
import { PNPM_WORKSPACE_FILE } from "../defaults";



export class YamlLoader implements Yaml{

    constructor(private readonly directory:string){}

    /**
     * 
     * @param pkgbase 
     * @param filename 
     * @returns record or undefind
     */
    mergePkgSync(pkgbase:string,filename:string=PNPM_WORKSPACE_FILE ): Record<string, any> | undefined {
        const file = path.join(this.directory,filename)
        let data:Record<string,any> = {}
        if(!fs.existsSync(file)|| !fs.statSync(file).isFile()){
            data = {
                packages:[`${pkgbase}/*`]
            }
            this.writeYamlSync(data,file)
            return data
        }

        const origin = this.readSync(file)

        if(typeof origin === 'object'){
            data = Object.assign(data,origin)
        }

        if(!data?.packages){
            data.packages = []
        }

        const find  = (data.packages as unknown as string[]).find(
            (s)=>  new RegExp(`${pkgbase}\/*`,'g').test(s)
        )

        if(!find){
            (data.packages as unknown as string[]).push(`${pkgbase}/*`)
        }

        this.writeYamlSync(data,file)
        return data
    }

    

    /**
     * 
     * @param file 
     * 
     */
    readSync(file:fs.PathLike){
        if(!fs.existsSync(file)|| !fs.statSync(file).isFile())
            return undefined
        const data =  yaml.load(fs.readFileSync(file,'utf8'),{json:true})

        return data && Object.keys(data).length ? data as unknown as Record<string,any> : undefined
    }

    writeSync(data: string,filename:string=PNPM_WORKSPACE_FILE): undefined {
        const file = path.join(this.directory,filename)
        fs.writeFileSync(file,data,{encoding:"utf8"})
    }

    writeYamlSync( data: Record<string,any>,file:fs.PathLike ): undefined {
        const content = yaml.dump(data)
        fs.writeFileSync(file,content,{encoding:"utf8"})
    }
}