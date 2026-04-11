import express from "express";
import userRouter from "./routes/userRoutes";
import helmet from "helmet";
import cors from "cors";

const PORT = process.env.PORT || 5000;


const app = express();
app.use(express.json());
app.use(helmet());
app.use(cors())

app.use("/api/users", userRouter);
app.use("/api/auth", (await import("./routes/authRoutes")).default);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});





// app.use(cors())