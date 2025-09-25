import app from "./app";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server Runnig on PORT ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});

