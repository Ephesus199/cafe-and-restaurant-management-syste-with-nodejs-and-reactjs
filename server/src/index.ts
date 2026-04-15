import express from "express";
import userRouter from "./routes/userRoutes";
import helmet from "helmet";
import cors from "cors";
import fileUpload from "express-fileupload";


const PORT = process.env.PORT || 5000;


const app = express();
app.use(express.json());
app.use(helmet());
app.use(cors())


app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/", // required for Cloudinary
  }),
);

app.use("/api/users", userRouter);
app.use("/api/auth", (await import("./routes/authRoutes")).default);
app.use("/api/branches", (await import("./routes/branchRoutes")).default);
app.use("/api/menu", (await import("./routes/menuRoutes")).default);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});





// app.use(cors())