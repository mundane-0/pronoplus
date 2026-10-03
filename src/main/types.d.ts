/**
 * Déclarations TypeScript des dépendances qui n'en fournissent pas.
 *
 * `sql.js` (SQLite compilé en WebAssembly) et `pdfkit` (générateur PDF)
 * n'embarquent aucun fichier `.d.ts`.
 */

declare module 'sql.js' {
  /** Résultat d'un `SELECT`. */
  export interface QueryResult {
    columns: string[];
    values: unknown[][];
  }

  /** Requête préparée, renvoyée par `prepare()`. */
  export interface Statement {
    bind(params: unknown[]): boolean;
    step(): boolean;
    getAsObject(): Record<string, unknown>;
    get(...params: unknown[]): unknown[];
    run(...params: unknown[]): void;
    free(): void;
  }

  export interface Database {
    run(sql: string, params?: unknown[]): void;
    exec(sql: string, params?: unknown[]): QueryResult[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
  }

  const initSqlJs: (config?: {
    locateFile?: (file: string) => string;
  }) => Promise<{ Database: new (data?: unknown) => Database }>;

  export default initSqlJs;
}

declare module 'pdfkit';
