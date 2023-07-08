//const mongoose = require('mongoose');
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: Number, unique: true, required: true },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  imageLink: String,
});

const warehouseSchema = new mongoose.Schema({
  warehouseNumber: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  state: { type: String, required: true },
  location: { type: Array, required: true },
  stockLimit: { type: Number, default: Infinity },
});


const orderSchema = new mongoose.Schema({
  customerId: { type: String, required: true },
  sku: { type: String, required: true },
  orderQty: { type: Number, required: true },
  fulfillmentStatus: { type: String, enum: ['Pending', 'Fulfilled', 'Out of Stock'], default: 'Pending' },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
}, { timestamps: true });

export const Order = mongoose.model('Order', orderSchema);

 export const Product = mongoose.model('Product', productSchema);
export const Warehouse = mongoose.model('Warehouse', warehouseSchema);


// module.exports = { Product, Warehouse };

