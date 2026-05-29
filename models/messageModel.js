const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const MessageSchema=new mongoose.Schema({
    username:String,
    message:String
});

const Message=mongoose.model('Message',MessageSchema)
module.exports=Message;