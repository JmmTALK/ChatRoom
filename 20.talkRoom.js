const express=require("express");
const path=require("path");
const http=require("http");
const sio=require("socket.io");
const session=require("express-session");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const fs=require("fs");
const mongoClient=require("mongodb").MongoClient;

const app=express();
const server=http.createServer(app);
const io=sio.listen(server);
app.use(express.static(path.join(__dirname,"public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(session({
    secret:"Amumu",
    resave:false,
    saveUninitialized:true,
    cookie:{}
}));


let username='';
app.get('/',(req,res)=>{
    res.send(`<h1>Wellcome to <a href="/login" style="color:skyblue;text-decoration:none">Amm Talk</a></h1>`)
});
app.get("/login",(req,res)=>{
    console.log(req.ip);
    if(req.session.username)res.redirect("/talk");
    else res.sendFile(path.join(__dirname,"login.html"));
});
app.post("/user",(req,res)=>{
    mongoClient.connect("mongodb://localhost:27017/users",(err,db)=>{
        if(err) throw err;
        db.collection("users").find().toArray((err,dataArr)=>{
            let reg1=/</g;
            let reg2=/>/g;
            let username=req.body.username.trim().replace(reg1,"&lt;");
            username=username.replace(reg2,"&gt;");
            let isok=dataArr.some((ele,index)=>{
                return ele.username==username && ele.password==req.body.password;
            });
            if(isok){
                req.session.username=req.body.username;
                res.redirect("/talk");
            }else{
                res.send("用户名或密码错误<a href='/login' style='color:red'>返回</a>")
            }
        });
        db.close();
    })
});
app.get("/talk",(req,res)=>{
    let username=req.session.username;
    if(username){
        let str=fs.readFileSync("20.talkRoom.html","utf8");
        let html=ejs.render(str,{data:[{username:username}]});
        res.send(html);
    }else{
        res.redirect("/login");
    }
});
app.get("/regist",(req,res)=>{
    res.sendFile(path.join(__dirname,"regist.html"));
});
app.post("/regist",(req,res)=>{
    let reg1=/</g;
    let reg2=/>/g;
    let username=req.body.username.trim().replace(reg1,"&lt;");
    username=username.replace(reg2,"&gt;");
    let password=req.body.password.trim();
    mongoClient.connect("mongodb://localhost:27017/users",(err,db)=>{
        if(err) throw err;
        db.collection("users").insert({username:username,password:password,time:new Date().toLocaleString(),ip:req.ip});
        db.close();
    });
    res.send("<h3>注册成功 <a href='/login'>返回</a></h3>")
});
app.get("/check",(req,res)=>{
    let username=req.query.username.trim();
    mongoClient.connect("mongodb://localhost:27017/users",(err,db)=>{
        if(err) throw err;
        //console.log(db.collection("users").find({username:username},{}).toArray());
        db.collection("users").find({username:username}).toArray((err,dataArr)=>{
            if(dataArr[0]){
                res.send("对不起，该用户名已被注册")
            }else{
                res.send("可以使用该用户名")
            }
        });

        db.close();
    })
});
app.get("/logout",(req,res)=>{
    req.session.destroy();
    res.redirect("/");
});

io.on("connection",(socket)=>{
    console.log('a user is coming');
    socket.on("sendmsg",function(data){
        socket.broadcast.emit("locate",data)
    })
});

server.listen(3000);