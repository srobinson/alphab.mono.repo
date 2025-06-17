"use strict";
/**
 * @alphab/http-client-ui - Simple, elegant HTTP client for TypeScript/JavaScript frontends
 *
 * A lightweight HTTP client with proper error handling, timeouts, and TypeScript types.
 * Follows KISS principles for easy maintenance and usage.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = exports.HttpError = exports.HttpClient = void 0;
var client_1 = require("./client");
Object.defineProperty(exports, "HttpClient", { enumerable: true, get: function () { return client_1.HttpClient; } });
Object.defineProperty(exports, "HttpError", { enumerable: true, get: function () { return client_1.HttpError; } });
Object.defineProperty(exports, "createClient", { enumerable: true, get: function () { return client_1.createClient; } });
