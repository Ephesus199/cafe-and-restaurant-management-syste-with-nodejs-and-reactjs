import express from "express";
import userRouter from "./routes/userRoutes";

const PORT = process.env.PORT || 5000;


const app = express();
app.use(express.json());

app.use("/api/users", userRouter);
app.use("/api/auth", (await import("./routes/authRoutes")).default);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});





// app.use(cors())