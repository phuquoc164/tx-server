import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

const keywordSchema = new Schema({
    text: String,
}, { collection: "keyword"});

mongoose.model("Keyword", keywordSchema);