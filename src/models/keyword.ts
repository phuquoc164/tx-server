import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

const keywordSchema = new Schema({
    text: String,
    files: [{ type: Schema.Types.ObjectId, ref: 'fileSchema' }],
}, { collection: "keyword"});

mongoose.model("Keyword", keywordSchema);