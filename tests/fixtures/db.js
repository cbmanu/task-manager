const jwt = require("jsonwebtoken")
const mongoose=require('mongoose')
const User =require("../../src/models/user")
const userOneId=new mongoose.Types.ObjectId()

const userOne={
    _id:userOneId,
    name: "mikee",
    password:"556what!!",
    email:"mikeefu@gmail.com",
    age:33,
    tokens:[{
        token:jwt.sign({_id:userOneId},process.env.JWT_SECRET)
    }]
}
const setupDatabase=async()=>{
    await User.deleteMany()
    await new User(userOne).save() 
}
module.exports={
    userOneId,
    userOne,
    setupDatabase
}
