import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


import { v2 as cloudinary } from 'cloudinary';



    // Configuration
    cloudinary.config({ 
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key:CLOUDINARY_API_KEY , 
        api_secret: CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });
   
    const uploadOnCloudinary = async(localFilePath)=>{
        try{
            if(!localFilePath) return null
            // upload the file on cloudinary
            const response = await cloudinary.uploader.upload(localFilePath,{
                resource_type : "auto"
            })
            // file has been uploaded successfully
                fs.unlinkSync(localFilePath)
                return response;
        }catch(error){
            // remove the locally saved temporary file as the upload operation got failed
            fs.unlike(localFilePath)
            return null;
        }
    }
   export {uploadOnCloudinary}