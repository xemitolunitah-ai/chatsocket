const express=require('express')
const app=express()
const connection=require('./database/connection')
const socket=require('socket.io')
const path=require('path')

const server=require('http').createServer(app)
const io=socket(server)
require('./socket')(io)

app.set('views',path.join(__dirname,'views'))
app.set('view engine','ejs')
app.use(express.static(__dirname+'/public'))

app.use(express.json())
app.get('/',(req,res)=>{
    res.render('index')
})


server.listen(3000,()=>{
    console.log('aplicacion con express ejecutandose en el puerto 3000')
})