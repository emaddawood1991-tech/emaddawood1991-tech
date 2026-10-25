export const existsSync = () => false;
export const readdirSync = () => [];
export const statSync = () => ({ size: 0, mtimeMs: 0 });
export const mkdirSync = () => {};
export const dirname = (p) => p.replace(/\/[^/]*$/, '') || '/';
export const join = (...a) => a.join('/');
export const pathToFileURL = (p) => ({ href: String(p) });
