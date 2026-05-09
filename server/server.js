import express from "express";
import "dotenv/config";
import cors from "cors";
import { clerkMiddleware } from '@clerk/express'
import {serve} from "inngest/express";
import {inngest, functions} from "./inngest/index.js"
import listingRouter from "./routes/listingRoutes.js";
import chatRouter from "./routes/chatRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";
import recRouter from "./routes/recommendationRoutes.js";
import searchRouter from "./routes/searchRoutes.js";

const app = express();

app.use(express.json());
app.use(cors())
app.use(clerkMiddleware())

app.get("/",(req, res)=> res.send("Server is live!"))

app.use("/api/payment", paymentRouter)
app.use("/api/inngest", serve({client: inngest, functions}))
app.use("/api/listing", listingRouter)
app.use("/api/chat", chatRouter)
app.use("/api/admin",adminRouter)
app.use("/api/recommendations", recRouter)
app.use("/api/search", searchRouter)

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;