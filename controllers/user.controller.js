import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js"

const registerUser = asyncHandler(async(req,res)=>{
//  Algorithm we gonna use to register my first user
// get user detail from frontend
// validation -> not empty
// check if user already exist : username,email
// check for images,check for avatar
// upload them to cloudinary->avatar check
// create user object - create entry in DB
// remove password & refresh token field from response 
// check for user creation
// return res to frontend
 const {fullname,email,username,password} = req.body
 console.log("email :",email);


//  Now validation 

// ek ek karke aise bhi check kar skhte 
// if(fullname===""){
//     throw new ApiError(400,"fullname is required");

// }

if(
    [fullname,username,email,password].some(field=>field?.trim()==="")
){
    throw new ApiError(400,"All fields are required");
}



//check if user already exist

const existedUser = await User.findOne({
    $or : [{username},{email}]
})
 if(existedUser){
    throw new ApiError(409,"User already exist with this username or email")
 }


//  check for images,check for avatar

const avatarLocalPath = req.files?.avatar[0]?.path;
const coverImageLocalPath = req.files?.coverImage[0]?.path;

if(!avatarLocalPath){
    throw new ApiError(400,"Avatar is required")
}


// upload them to cloudinary and check for avatar

const avatar = await uploadOnCloudinary(avatarLocalPath)
const coverImage = await uploadOnCloudinary(coverImageLocalPath)
if(!avatar){
    throw new ApiError(400,"Avatar upload is required")
}


// create user Object - create entry in DB

User.create({
    fullname,
    email,
    password,
    username : username.tolowerCase(),
    avatar : avatar.url,
    coverImage : coverImage?.url||""
})


// remove password & refresh token field from response

const CreatedUser = await User.findById(user._id).select(
    "-password -refreshToken" 
)


// check for user creation

if(!CreatedUser){
    throw new ApiError(500,"User not created due to some internal error")
}



// return res to client
return res.status(201).json(
    new ApiResponse(200,CreatedUser,"User created successfully")
)


})