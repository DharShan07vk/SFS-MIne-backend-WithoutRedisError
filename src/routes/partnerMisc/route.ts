import { Router } from "express";
import { requireAuthToken } from "../../middleware";
import {
  getHomeStatistics,
  getProfileDetails,
  saveAccountDetails,
  savePartnerProfile,
} from "./controller";
import multer from 'multer'
const upload = multer({storage : multer.memoryStorage()})

const partnerMiscRouter = Router();

partnerMiscRouter.get("/", requireAuthToken("PARTNER"), getHomeStatistics);
partnerMiscRouter.get("/me", requireAuthToken("PARTNER"), getProfileDetails);
partnerMiscRouter.post(
  "/account",
  requireAuthToken("PARTNER"),
  saveAccountDetails,
);
partnerMiscRouter.post(
  "/profile",
  upload.fields([
    {name :'logo', maxCount:1},
    {name: 'digitalSign',maxCount:1}
  ]),
  requireAuthToken("PARTNER"),
  savePartnerProfile,
);

export default partnerMiscRouter;
