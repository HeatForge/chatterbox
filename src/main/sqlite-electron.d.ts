declare module 'sqlite-electron' {
  export function setdbPath(
    path: string,
    isuri?: boolean,
    autocommit?: boolean,
  ): Promise<boolean>;

  export function executeQuery(
    query: string,
    values?: any[] | Record<string, any>,
  ): Promise<boolean>;

  export function fetchAll<T = any>(
    query: string,
    values?: any[] | Record<string, any>,
  ): Promise<T[]>;

  export function fetchOne<T = any>(
    query: string,
    values?: any[] | Record<string, any>,
  ): Promise<T>;

  export function fetchMany<T = any>(
    query: string,
    size: number,
    values?: any[] | Record<string, any>,
  ): Promise<T[]>;

  export function executeMany(
    query: string,
    values: any[][] | Record<string, any>[],
  ): Promise<boolean>;

  export function executeScript(scriptname: string): Promise<boolean>;

  export function load_extension(path: string): Promise<boolean>;

  export function backup(
    target: string,
    pages?: number,
    name?: string,
    sleep?: number,
  ): Promise<boolean>;

  export function iterdump(file: string, filter?: string): Promise<boolean>;
}
