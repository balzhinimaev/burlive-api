"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var allowedComplexities = [1, 1.5, 2, 2.5, 3];
var LessonSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String, required: false },
    content: { type: String, required: true },
    moduleId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: 'Module',
        required: true,
    },
    order: { type: Number, required: true },
    complexity: {
        type: Number,
        required: true,
        enum: allowedComplexities,
        default: 1,
    },
    questions: {
        type: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Question' }],
        default: [],
    },
    viewsCounter: { type: Number, default: 0 },
    views: {
        type: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'View' }],
        default: [],
    },
}, { timestamps: true });
exports.default = mongoose_1.default.model('Lesson', LessonSchema);
