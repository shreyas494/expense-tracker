import borrowLendModel from "../models/borrowLendModel.js";

// Add Borrow/Lend record
export async function addBorrowLend(req, res) {
  const userId = req.user._id;
  const { type, person, amount, description, dueDate, date } = req.body;

  try {
    if (!type || !person || amount == null) {
      return res.status(400).json({
        success: false,
        message: "Type, person name, and amount are required",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    if (type !== "borrow" && type !== "lend") {
      return res.status(400).json({
        success: false,
        message: "Type must be either 'borrow' or 'lend'",
      });
    }

    const newRecord = new borrowLendModel({
      userId,
      type,
      person,
      amount: Number(amount),
      remainingAmount: Number(amount),
      description: description || "",
      dueDate: dueDate ? new Date(dueDate) : undefined,
      date: date ? new Date(date) : undefined,
      status: "pending",
    });

    await newRecord.save();
    res.json({
      success: true,
      message: `${type === "borrow" ? "Borrowed" : "Lent"} record added successfully`,
      data: newRecord,
    });
  } catch (error) {
    console.error("AddBorrowLend error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

// Get all Borrow/Lend records for user
export async function getAllBorrowLend(req, res) {
  const userId = req.user._id;
  const { type } = req.query;

  try {
    const filter = { userId };
    if (type && (type === "borrow" || type === "lend")) {
      filter.type = type;
    }

    const records = await borrowLendModel.find(filter).sort({ date: -1 });
    res.json(records);
  } catch (error) {
    console.error("GetAllBorrowLend error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

// Update a Borrow/Lend record
export async function updateBorrowLend(req, res) {
  const { id } = req.params;
  const userId = req.user._id;
  const { type, person, amount, description, dueDate, date } = req.body;

  try {
    const record = await borrowLendModel.findOne({ _id: id, userId });
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    if (type && type !== "borrow" && type !== "lend") {
      return res.status(400).json({
        success: false,
        message: "Type must be either 'borrow' or 'lend'",
      });
    }

    if (person) record.person = person;
    if (type) record.type = type;
    if (description !== undefined) record.description = description;
    if (dueDate !== undefined) record.dueDate = dueDate ? new Date(dueDate) : undefined;
    if (date !== undefined) record.date = date ? new Date(date) : record.date;

    if (amount != null) {
      const newAmount = Number(amount);
      if (newAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Amount must be greater than 0",
        });
      }
      
      // Re-calculate remaining amount based on payments already made
      const totalPaid = record.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const newRemaining = newAmount - totalPaid;
      
      if (newRemaining < 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot decrease amount to ${newAmount} because ${totalPaid} has already been repaid`,
        });
      }

      record.amount = newAmount;
      record.remainingAmount = newRemaining;

      if (newRemaining === 0) {
        record.status = "settled";
      } else if (totalPaid > 0) {
        record.status = "partially_paid";
      } else {
        record.status = "pending";
      }
    }

    await record.save();
    res.json({
      success: true,
      message: "Record updated successfully",
      data: record,
    });
  } catch (error) {
    console.error("UpdateBorrowLend error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

// Delete record
export async function deleteBorrowLend(req, res) {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const record = await borrowLendModel.findOneAndDelete({ _id: id, userId });
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    res.json({
      success: true,
      message: "Record deleted successfully",
    });
  } catch (error) {
    console.error("DeleteBorrowLend error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

// Add repayment (installment payment)
export async function addRepayment(req, res) {
  const { id } = req.params;
  const userId = req.user._id;
  const { amount, date, notes } = req.body;

  try {
    if (amount == null || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid repayment amount is required",
      });
    }

    const record = await borrowLendModel.findOne({ _id: id, userId });
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    const payAmt = Number(amount);
    if (payAmt > record.remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `Repayment amount (₹${payAmt}) cannot exceed outstanding amount (₹${record.remainingAmount})`,
      });
    }

    record.payments.push({
      amount: payAmt,
      date: date ? new Date(date) : new Date(),
      notes: notes || "",
    });

    record.remainingAmount = Number((record.remainingAmount - payAmt).toFixed(2));
    
    if (record.remainingAmount === 0) {
      record.status = "settled";
    } else {
      record.status = "partially_paid";
    }

    await record.save();
    res.json({
      success: true,
      message: "Repayment recorded successfully",
      data: record,
    });
  } catch (error) {
    console.error("AddRepayment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

// Delete repayment
export async function deleteRepayment(req, res) {
  const { id, paymentId } = req.params;
  const userId = req.user._id;

  try {
    const record = await borrowLendModel.findOne({ _id: id, userId });
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    const paymentIndex = record.payments.findIndex(p => p._id.toString() === paymentId);
    if (paymentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Repayment record not found",
      });
    }

    const paymentAmount = record.payments[paymentIndex].amount;
    record.payments.splice(paymentIndex, 1);
    
    record.remainingAmount = Number((record.remainingAmount + paymentAmount).toFixed(2));

    const totalPaid = record.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    if (record.remainingAmount === record.amount) {
      record.status = "pending";
    } else if (totalPaid > 0) {
      record.status = "partially_paid";
    } else {
      record.status = "pending";
    }

    await record.save();
    res.json({
      success: true,
      message: "Repayment deleted successfully",
      data: record,
    });
  } catch (error) {
    console.error("DeleteRepayment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

// Get Overview Analytics for Borrow & Lend
export async function getBorrowLendOverview(req, res) {
  const userId = req.user._id;
  const now = new Date();

  try {
    const records = await borrowLendModel.find({ userId });
    
    let totalBorrowed = 0;
    let totalLent = 0;
    let overdueBorrowed = 0;
    let overdueLent = 0;

    const pendingBorrowedList = [];
    const pendingLentList = [];

    for (const record of records) {
      if (record.status !== "settled") {
        const isOverdue = record.dueDate && new Date(record.dueDate) < now;
        
        if (record.type === "borrow") {
          totalBorrowed += record.remainingAmount;
          if (isOverdue) overdueBorrowed += record.remainingAmount;
          pendingBorrowedList.push(record);
        } else {
          totalLent += record.remainingAmount;
          if (isOverdue) overdueLent += record.remainingAmount;
          pendingLentList.push(record);
        }
      }
    }

    res.json({
      success: true,
      data: {
        totalBorrowed,
        totalLent,
        overdueBorrowed,
        overdueLent,
        pendingBorrowedCount: pendingBorrowedList.length,
        pendingLentCount: pendingLentList.length,
      }
    });
  } catch (error) {
    console.error("GetBorrowLendOverview error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}
