import * as express from "express";
import * as audioRoutes from "./routes/audioRoutes";

const app = express();
const port = 3003;

app.use("/audio", audioRoutes);

app.listen(port, () => {
  console.log(`Server is runninon port ${port}`);
});
