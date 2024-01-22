"use strict";
/**********************
 * Conversation Types *
 **********************/
Object.defineProperty(exports, "__esModule", { value: true });
exports.SenderRole = void 0;
/* SenderRole is the role of the sender of a message. */
var SenderRole;
(function (SenderRole) {
    SenderRole[SenderRole["USER"] = 0] = "USER";
    SenderRole[SenderRole["AI"] = 1] = "AI";
})(SenderRole || (exports.SenderRole = SenderRole = {}));
/* CellKind is the type of cell. */
var CellKind;
(function (CellKind) {
    CellKind[CellKind["MARKDOWN"] = 0] = "MARKDOWN";
    CellKind[CellKind["CODE"] = 1] = "CODE";
})(CellKind || (CellKind = {}));
//# sourceMappingURL=types.js.map