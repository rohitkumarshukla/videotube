import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../model/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async(userId)=>{
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return { accessToken,refreshToken }
    } catch (error) {
        throw new ApiError(500, "Error while generating access and refresh tokens")
    }
}
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
 
const avatarLocalPath = req.files?.avatar?.[0]?.path;

let coverImageLocalPath ;
if(req.files&&Array.isArray(req.files.coverImage&&req.files.coverImage.length>0)){
    coverImageLocalPath = req.files.coverImage[0].path
}

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

const user = await User.create({
    fullname,
    email,
    password,
    username : username.toLowerCase(),
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

const loginUser = asyncHandler(async(req,res)=>{

    // Algorithm for login user
    // req body -> data
    // username or email basis access
    // find the user in DB
    // password check
    // access token & refresh token generation
    // send cookie to client

    const { username,email,password } = req.body
    console.log("email :",email);

    if(!(username || email)){
        throw new ApiError(400,"username or email is required")
    }

    // find the user in DB

    const user = await User.findOne({
        $or : [{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User doesn't exist")
    }

    // Authentication check for password

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }

    const { accessToken,refreshToken }  = await user.generateAccessAndrefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // send cookie to client

    const cookieOptions = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("refreshToken",refreshToken,cookieOptions)
    .cookie("accessToken",accessToken,cookieOptions)
    .json(
        new ApiResponse(
            200,
            {
            user : LoggedInUser,accessToken,refreshToken
            },
            "User Logged In Successfully"
        )
    )
})
const logoutUser = asyncHandler(async(req,res)=>{
    // cookie vgera clear karni padegi
    await User.findByIdandUpdate(
        req.user._id,
        {
            $unset : {
                // this removes the field from document
                refreshToken : 1 
            }
        },
        {
            new : true
        }
    )   
        const options = {
            httpOnly :  true,
            secure : true
        }

        return res
        .status(200)
        .clearCookie("refreshToken",options)
        .clearCookie("accessToken",options)
        .json(new ApiResponse(200,{},"User logged Out"))

})
const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken =  req.cookies.refreshToken||req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }
 try {
       const decodedToken = jwt.verify(
           incomingRefreshToken,
           process.env.REFRESH_TOKEN_SECRET
       )
       const user = await User.findById(decodedToken?._id)
       if(!user){
           throw new ApiError(404,"Invalid refresh token")
       }
       if(incomingRefreshToken!==user.refreshToken){
           throw new ApiError(401,"refresh token is expired or used")
       }
       const options = {
           httpOnly : true,
           secure : true
       }
       const {accessToken,newRefreshToken} = generateAccessandRefreshTokens(user._id)
       return res
       .status(200)
       .coookie("accessToken",accessToken,options)
       .cookie("refreshToken",newRefreshToken,options)
       .json(
           new ApiResponse(
               200,
               {accessToken,refreshToken : newRefreshToken},
               "Access token refreshed"
           )
       )
 } catch (error) {
    throw new ApiError(401,error?.message||"Invalid refresh Token")
 }
})
export { registerUser, loginUser, logoutUser, refreshAccessToken };