const User =  require("../models/User");
const bcrypt =require("bcryptjs");
const jwt= require("jsonwebtoken");

// Register
const register = async (req, res) =>{
    try{
        const {name,email,password} =req.body;

        const userExists = await User.findOne({email});

        if(userExists){
            return res.status(400).json({message:"User Already Exists"});

        }

        const hashedPassword =await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password:hashedPassword,
        });

        // Never send password hash back to the client
        res.status(201).json({
            id: user._id,
            name: user.name,
            email: user.email,
        });

    }
    catch(error){
        res.status(500).json({message:"Server Error"});
    }
};

// Login

const login = async(req,res)=>{
    try{
        const {email,password} = req.body;
        const user = await User.findOne({email});

        if(!user){
            return res.status(400).json({message: "Invalid credentials"});
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.status(400).json({message:"Invalid credentials"})
        }

        //generate token

        const token =jwt.sign(
            {id:user._id},
            process.env.JWT_SECRET,
            {expiresIn:"1d"}
        );

        res.json({
            token,
            user:{
                id:user._id,
                name:user.name,
                email: user.email,
            },
        });

    }
    catch(error){
        res.status(500).json({message:"Server Error"});

    }
};

module.exports={register,login};