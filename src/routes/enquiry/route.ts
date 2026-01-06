import { Router, urlencoded } from "express";
import {
  individualOrInstitutionRegistration,
  
} from "./controller";
import multer from "multer";

const enquiryRouter = Router();
try{
enquiryRouter.post("/ind_inst", urlencoded({ extended: true }), individualOrInstitutionRegistration);
}
catch(err){
  console.log(err)
}



export default enquiryRouter;
