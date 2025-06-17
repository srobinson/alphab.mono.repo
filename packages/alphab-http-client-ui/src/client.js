"use strict";
/**
 * Simple, elegant HTTP client for TypeScript/JavaScript frontends.
 *
 * Provides a clean interface for making HTTP requests with proper error handling,
 * timeouts, and TypeScript types.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClient = exports.HttpError = void 0;
exports.createClient = createClient;
var HttpError = /** @class */ (function (_super) {
    __extends(HttpError, _super);
    function HttpError(message, status, code, response, data) {
        var _this = _super.call(this, message) || this;
        _this.status = status;
        _this.code = code;
        _this.response = response;
        _this.data = data;
        _this.name = "HttpError";
        return _this;
    }
    return HttpError;
}(Error));
exports.HttpError = HttpError;
var HttpClient = /** @class */ (function () {
    function HttpClient(config) {
        this.config = __assign({ timeout: 10000, defaultHeaders: {} }, config);
    }
    HttpClient.prototype.request = function (endpoint_1) {
        return __awaiter(this, arguments, void 0, function (endpoint, options) {
            var url, controller, timeoutId, response, errorData, _a, message, data, contentType, error_1;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        url = "".concat(this.config.baseURL).concat(endpoint);
                        controller = new AbortController();
                        timeoutId = setTimeout(function () { return controller.abort(); }, this.config.timeout);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 13, , 14]);
                        return [4 /*yield*/, fetch(url, __assign(__assign({}, options), { signal: controller.signal, headers: __assign(__assign({ "Content-Type": "application/json" }, this.config.defaultHeaders), options.headers) }))];
                    case 2:
                        response = _b.sent();
                        clearTimeout(timeoutId);
                        if (!!response.ok) return [3 /*break*/, 8];
                        errorData = void 0;
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 5, , 7]);
                        return [4 /*yield*/, response.json()];
                    case 4:
                        errorData = _b.sent();
                        return [3 /*break*/, 7];
                    case 5:
                        _a = _b.sent();
                        return [4 /*yield*/, response.text().catch(function () { return null; })];
                    case 6:
                        errorData = _b.sent();
                        return [3 /*break*/, 7];
                    case 7:
                        message = (errorData === null || errorData === void 0 ? void 0 : errorData.message) ||
                            (errorData === null || errorData === void 0 ? void 0 : errorData.error) ||
                            "HTTP ".concat(response.status, ": ").concat(response.statusText);
                        throw new HttpError(message, response.status, (errorData === null || errorData === void 0 ? void 0 : errorData.code) || "HTTP_ERROR", response, errorData);
                    case 8:
                        data = void 0;
                        contentType = response.headers.get("content-type");
                        if (!(contentType === null || contentType === void 0 ? void 0 : contentType.includes("application/json"))) return [3 /*break*/, 10];
                        return [4 /*yield*/, response.json()];
                    case 9:
                        data = _b.sent();
                        return [3 /*break*/, 12];
                    case 10: return [4 /*yield*/, response.text()];
                    case 11:
                        data = (_b.sent());
                        _b.label = 12;
                    case 12: return [2 /*return*/, {
                            data: data,
                            status: response.status,
                            statusText: response.statusText,
                            headers: response.headers,
                        }];
                    case 13:
                        error_1 = _b.sent();
                        clearTimeout(timeoutId);
                        if (error_1 instanceof HttpError) {
                            throw error_1;
                        }
                        if (error_1 instanceof Error && error_1.name === "AbortError") {
                            throw new HttpError("Request timeout", 408, "TIMEOUT");
                        }
                        throw new HttpError(error_1 instanceof Error ? error_1.message : "Network error", 0, "NETWORK_ERROR");
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    // HTTP Methods
    HttpClient.prototype.get = function (endpoint, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.request(endpoint, __assign(__assign({}, options), { method: "GET" }))];
            });
        });
    };
    HttpClient.prototype.post = function (endpoint, data, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.request(endpoint, __assign(__assign(__assign({}, options), { method: "POST" }), (data !== undefined && { body: JSON.stringify(data) })))];
            });
        });
    };
    HttpClient.prototype.put = function (endpoint, data, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.request(endpoint, __assign(__assign(__assign({}, options), { method: "PUT" }), (data !== undefined && { body: JSON.stringify(data) })))];
            });
        });
    };
    HttpClient.prototype.patch = function (endpoint, data, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.request(endpoint, __assign(__assign(__assign({}, options), { method: "PATCH" }), (data !== undefined && { body: JSON.stringify(data) })))];
            });
        });
    };
    HttpClient.prototype.delete = function (endpoint, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.request(endpoint, __assign(__assign({}, options), { method: "DELETE" }))];
            });
        });
    };
    // Convenience methods for JSON responses
    HttpClient.prototype.getJson = function (endpoint, options) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.get(endpoint, options)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    HttpClient.prototype.postJson = function (endpoint, data, options) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.post(endpoint, data, options)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    HttpClient.prototype.putJson = function (endpoint, data, options) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.put(endpoint, data, options)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    HttpClient.prototype.patchJson = function (endpoint, data, options) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.patch(endpoint, data, options)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    HttpClient.prototype.deleteJson = function (endpoint, options) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.delete(endpoint, options)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    // Authentication helpers
    HttpClient.prototype.withAuth = function (token) {
        return new HttpClient(__assign(__assign({}, this.config), { defaultHeaders: __assign(__assign({}, this.config.defaultHeaders), { Authorization: "Bearer ".concat(token) }) }));
    };
    HttpClient.prototype.withHeaders = function (headers) {
        return new HttpClient(__assign(__assign({}, this.config), { defaultHeaders: __assign(__assign({}, this.config.defaultHeaders), headers) }));
    };
    return HttpClient;
}());
exports.HttpClient = HttpClient;
// Convenience function for creating a client
function createClient(config) {
    return new HttpClient(config);
}
