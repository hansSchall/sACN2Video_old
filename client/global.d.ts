type Position = {
    x: number,
    y: number,
    h: number,
    w: number
}
declare const $: <T = HTMLElement>(query: string) => T;
declare const $$: <T extends Node = HTMLElement>(query: string) => NodeListOf<T>;
declare const $el: <T = HTMLElement>(classname?: string | string[], tagname?: string | null | undefined | 0 | false, html?: string, fn?: (el: T) => void) => T;
interface HTMLElement extends Node {
    $: <T = HTMLElement>(query: string) => T;
    $$: <T extends Node = HTMLElement>(query: string) => NodeListOf<T>;
    goUpInTree: (query: string) => HTMLElement | null;
    setClass: (classname: string, active: boolean) => void;
}
interface Array<T> {
    readonly lastElement: T
}
interface NodeListOf<TNode extends Node> {
    [Symbol.iterator](): IterableIterator<TNode>
}
declare type MayAsync<T = void> = T | Promise<T>;