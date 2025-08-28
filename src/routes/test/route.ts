import { Router } from "express";
//import { redis } from "../../redis";

const testRouter = Router();

// testRouter.get("/redis-data", async (req, res) => {
//   const redisData = await redis.get("dummy");
//   console.log("🚀 ~ testRouter.get ~ redisData:", redisData);
//   res.send(redisData);
// });

testRouter.post("/redis-data", async (req, res) => {
  const data: { userIds: number[] } = req.body;
  if (!Array.isArray(data.userIds) || data.userIds.length === 0) {
    res.status(400).json({ error: "Invalid user IDs" });
    return;
  }

  // Enqueue jobs
  // const jobs = await Promise.all(
  //   data.userIds.map((userId) => pdfQ.add("generate-pdf", { userId })),
  // );

  res.json({ message: "PDF generation jobs added to the queue" });
});

export default testRouter;
