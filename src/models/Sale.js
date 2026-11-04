import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: String,            // নামের snapshot
    category: String,        // category snapshot
    brand: String,           // brand snapshot
    qty: { type: Number, required: true },
    rate: { type: Number, required: true },        // পয়সা
    costSnapshot: { type: Number, default: 0 },    // approve-এর সময় product.buyPrice (D3)
    lineTotal: { type: Number, required: true },   // পয়সা
  },
  { _id: false }
);

const SaleSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String },                   // approve-এর সময় বরাদ্দ (D6)
    clientRef: { type: String },                   // ডাবল সাবমিট/রিট্রাই সুরক্ষা
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    date: { type: Date, required: true },
    items: { type: [ItemSchema], default: [] },    // খালি = শুধু কালেকশন/অ্যাডভান্স
    extraCostLabel: { type: String, default: "" }, // যেমন: গাড়ি ভাড়া / লেবার খরচ
    extraCost: { type: Number, default: 0 },       // পয়সা
    total: { type: Number, default: 0 },           // পয়সা (items lineTotal + extraCost)
    costTotal: { type: Number, default: null },    // aggregate historical cost, in paisa
    historicalImport: { type: Boolean, default: false },
    paid: { type: Number, default: 0 },            // পয়সা
    dueAfter: { type: Number, default: 0 },        // approve-এর পর কাস্টমার ব্যালেন্স
    status: { type: String, enum: ["pending", "approved", "declined"], default: "pending" },
    submittedBy: { type: String, required: true },
    submittedByName: { type: String, default: "" },
    approvedBy: String,
    approvedAt: Date,
    remarks: { type: String, default: "" },
    trackNumber: { type: String, default: "" },
    declineNote: { type: String, default: "" },
  },
  { timestamps: true }
);
SaleSchema.index({ invoiceNo: 1 }, { unique: true, sparse: true });
SaleSchema.index({ clientRef: 1 }, { unique: true, sparse: true });
SaleSchema.index({ status: 1, date: -1 });
SaleSchema.index({ submittedBy: 1 });
export default mongoose.models.Sale || mongoose.model("Sale", SaleSchema);