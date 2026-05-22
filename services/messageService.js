const Message=require('../models/messageModel.js')

class MessageService{
    constructor(){}

    async getAll(){
        const messages=await Message.find({})
        return messages;
    }

    async create(msg){
        const message=new Message(msg)
        return await message.save()
    }
}
module.exports=MessageService