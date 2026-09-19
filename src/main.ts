/**
 * Obsidian expects the compiled main.js to export the Plugin class
 * as the default export. This file simply re-exports the adapter entry.
 */

export { default } from "./adapter/plugin";
