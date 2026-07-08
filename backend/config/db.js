import mongoose from "mongoose";
export const connectDB = async () => {
    await mongoose.connect("mongodb+srv://shreyaskulkarni04sk_db_user:TnCr3yZF4aCJYJ8c@cluster0.jwtlnlw.mongodb.net/Expense")
    .then(() => console.log("DB connected"))
}