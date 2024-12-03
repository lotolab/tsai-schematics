// All paths are related to the base dir
import { getDirs } from './utils'
export const sources = ['src'];
export const dist = ['dist'];
export const packages = ['packages'];

export const sourcesPaths = getDirs(sources[0]);
