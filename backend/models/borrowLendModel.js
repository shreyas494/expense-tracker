import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  notes: {
    type: String,
    default: ""
  }
});

const borrowLendSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  type: {
    type: String,
    enum: ["borrow", "lend"],
    required: true,
  },
  person: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  remainingAmount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  dueDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ["pending", "partially_paid", "settled"],
    default: "pending",
  },
  payments: [paymentSchema],
  date: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

const borrowLendModel = mongoose.models.borrowLend || mongoose.model("borrowLend", borrowLendSchema);
export default borrowLendModel;
