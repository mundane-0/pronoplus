declare module 'sql.js' {
  export interface Database {
    exec(sql: string): any[];
    export(): Uint8Array;
    close(): void;
  }

  export default class SqlJs {
    static init(options?: { locateFile?: (path: string) => string }): Promise<SqlJs>;
    runSql(sql: string): void;
    export(): Uint8Array;
  }
}