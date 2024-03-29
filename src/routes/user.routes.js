const express=require('express');
const router=express.Router();
const User=require("../models/user");
const auth = require('../middleware/auth');
const multer=require("multer")
const sharp =require('sharp')
const cookieParser = require('cookie-parser')
const storage = multer.memoryStorage()
const upload=multer({
    limits:{
        fileSize:1000000,
    },
    fileFilter(req,file,cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error("Please upload an image"))
        }
        cb(undefined,true)
    },
    storage:storage
})

router.get("/users/me",auth,async (req,res)=>{
    res.send(req.user)
})

router.post("/user/add",async(req,res)=>{
    const user=new User(req.body)
    try{     
        await user.save()
        const token =await user.generateAuthToken()
        res.cookie("token",token,{
            httpOnly:true
        })
        return res.redirect("/")

    }catch(e){
        res.status(400).redirect("/signUp")
    }
    
})


router.post("/users/login",async(req,res)=>{
    try{
        const user = await User.findByCredentials(req.body.email,req.body.password)
        const token =await user.generateAuthToken()
        res.cookie("token",token,{
            httpOnly:true
        })
        return res.redirect("/")
    }catch(e){
        return res.redirect("/login")
    }
})

router.post("/user/logout",auth, async(req,res)=>{
    try{
        req.user.tokens=req.user.tokens.filter((token)=>{
            return token.token!==req.token
        })
        await req.user.save()
        return res.redirect('/signUp')
    }catch(e){
        res.status(500).send(e)
    }
})
router.post("/users/logoutAll",auth, async(req,res)=>{
    try{
        req.user.tokens=[]
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send(e)
    }
})


router.patch("/user/me",auth,async(req,res)=>{

    const updates=Object.keys(req.body)
    const allowedUpdates=['name','password','email','age']
    const isValid=updates.every((update)=> allowedUpdates.includes(update))
    if(!isValid){
        return res.status(400).send({Error: "Invalid Updates!"})
    }

    try{
        updates.forEach((update)=>req.user[update]=req.body[update])
        await req.user.save()
        res.send(req.user)
    }catch(e){
        res.status(400).send(e)
    }
})
router.delete("/user/me",auth,async(req,res)=>{
    try{
        const user =await User.findById(req.user._id)
        user.deleteOne();
        if(!user){
            return res.status(404).send()
        }
        res.send(user)
    }catch(e){
        res.status(500).send(e)
    }
})

router.post('/users/me/avatar',auth,upload.single('avatar'),async(req,res)=>{
    const buffer = await sharp(req.file.buffer).resize({width:250,height:250}).png().toBuffer()
    req.user.avatar=buffer
    await req.user.save();
    res.redirect('/user')
},(error,req,res,next)=>{
    res.status(400).send({error:error.message})
})

router.delete('/users/me/avatar',auth,async(req,res)=>{
    req.user.avatar=undefined
    await req.user.save();
    res.redirect('/')
},(error,req,res,next)=>{
    res.status(400).send({error:error.message})
})
router.get("/users/:id/avatar",async(req,res)=>{
    try{
        const user=await User.findById(req.params.id)
        if(!user||!user.avatar){
            throw new Error()
        }
        res.set('Content-Type','image/png')
        res.send(user.avatar)
    }catch(e){
        res.status(400).send()
    }
})


module.exports=router