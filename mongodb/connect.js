import mongoose from 'mongoose';

const connect = async() => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("MONGODB Connected...");
    }catch(err){
        console.log("MongoDB connection error :", err. message);
    }
};

export default connect;