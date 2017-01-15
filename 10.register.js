/**
 * Created by Administrator on 2016/12/8.
 */
const express=require("express");
const path=require("path");
const session=require("express-session");
const bodyParser=require("body-parser");
const mongoClient=require("mongodb").MongoClient;

const app=express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(session({
    secret:"Amumu",
    resave:false,
    saveUninitialized:true,
    cookie:{}
}));

app.get("/",(req,res)=>{
    res.sendFile(path.join(__dirname,"index.html"))
});
app.get("/user",(req,res)=>{
    if(req.session.username){
        res.send(`<strong>${req.session.username}</strong> 欢迎访问 <a href='/' style='color:red'>返回首页</a><br><br><a href='/logout' style='color:red'>注销</a>`)
    }else{
        res.redirect("/login")
    }
});
app.get("/login",(req,res)=>{
    if(req.session.username){
        res.redirect("/user")
    }else{
        res.sendFile(path.join(__dirname,"login.html"))
    }
});
app.post("/user",(req,res)=>{
    mongoClient.connect("mongodb://localhost:27017/users",(err,db)=>{
        if(err) throw err;
        db.collection("users").find().toArray((err,dataArr)=>{
            let isok=dataArr.some((ele,index)=>{
                return ele.username==req.body.username && ele.password==req.body.password;
            });
            if(isok){
                req.session.username=req.body.username;
                res.redirect("/user");
            }else{
                res.send("用户名或密码错误<a href='/login' style='color:red'>返回</a>")
            }
        });
        db.close();
    })
});
app.get("/logout",(req,res)=>{
    req.session.destroy();
    res.redirect("/");
});
app.get("/regist",(req,res)=>{
    res.sendFile(path.join(__dirname,"regist.html"))
});
app.post("/regist",(req,res)=>{
    let username=req.body.username.trim();
    let password=req.body.password.trim();
    mongoClient.connect("mongodb://localhost:27017/users",(err,db)=>{
        if(err) throw err;
        db.collection("users").insert({username:username,password:password,time:new Date().toLocaleString()});
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

function isRegisted(ele,arr){
    return arr.some((item)=>{
        return item.username=ele;
    })
}

app.listen(3000);