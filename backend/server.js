import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { connectDB } from './config/db.js';
import userRouter from './routes/userRoute.js';
import incomeRouter from './routes/incomeRoute.js';
import expenseRouter from './routes/expenseRoute.js';
import dashboardRouter from './routes/dashboardRoute.js';
import borrowLendRouter from './routes/borrowLendRoute.js';
import challengeRouter from './routes/challengeRoute.js';

    
const app=express()
const port=4000

//MIDDLEWARE
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended:true}))


//DB
connectDB();


//ROUTES


app.use("/api/user",userRouter);
app.use("/api/income",incomeRouter);
app.use("/api/expense",expenseRouter);
app.use("/api/dashboard",dashboardRouter);
app.use("/api/borrow-lend",borrowLendRouter);
app.use("/api/challenges",challengeRouter);

app.get('/',(req,res)=>{
    res.send('API working')
})

app.listen(port,()=>{
    console.log(`Server running on port ${port}`)
})
