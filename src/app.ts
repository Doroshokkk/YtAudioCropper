import * as express from "express";
import * as audioRoutes from "./downloader/routes/audioRoutes";
import { startConsumer } from "./downloader/consumer/consumer";

const app = express();
const port = 3003;

app.use("/audio", audioRoutes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

startConsumer()