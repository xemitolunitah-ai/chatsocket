const mongoose=require('mongoose');
const Schema=mongoose.sChema;

const MessageSchema=new mongoose.Schema({
    username:String,
    message:String
});

const Message=mongoose.model('Message',MessageSchema)
module.exports=Message;