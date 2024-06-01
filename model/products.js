const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  description: String,
  quantity: { type: Number, required: true },
  unit: String
});

module.exports = mongoose.model('Product', productSchema);