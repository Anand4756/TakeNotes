require('dotenv').config();
const express = require ("express");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require('express-session');
const nodemailer = require('nodemailer');
const passportLocalMongoose = require("passport-local-mongoose");
const passport = require("passport");
var multer = require('multer');
var path = require('path');
const timezone = require('mongoose-timezone');
const app = express();


app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({extended: true}));
app.use(session({
    secret: "College",
    resave: false,
    saveUninitialized: false,
    cookie:{
        maxAge:9999000000000
    }
    }));

    app.use(passport.initialize());
app.use(passport.session());

// mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser: true , useUnifiedTopology: true });

const mongoAtlasUri =
  `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.mg1dh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

try {
  mongoose.connect(
    mongoAtlasUri,
    { useNewUrlParser: true, useUnifiedTopology: true },
    () => console.log(" Mongoose is connected")
  );
} catch (e) {
  console.log("could not connect");
}

mongoose.set("useCreateIndex",true);


const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    fullname: String,
    isverified: {
        type: Boolean,
        default: false
    }
    
    });
    
    
        

    userSchema.plugin(passportLocalMongoose);
    
    const User = new mongoose.model("User", userSchema);


    const user = new User({
        username: "admin",
        password: "admin"
        
        });
        
        // user.save();

    const alltokenSchema = new mongoose.Schema({
        token: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
        },
        expiresat: {
            type: Date,
            default: Date.now,
            expires: 1000
        }
    })

    const Alltoken = new mongoose.model("Alltoken", alltokenSchema);


    passport.use(User.createStrategy());
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());

    const noteSchema = {
        notessubject: String,
        notestype: String,
        notestopic: String,
        course: String,
        semester: String,
        notesfile: String,
        
        uploadedby: String
    };
    
    const Note = mongoose.model("Note", noteSchema);
    var findmethod = Note.find();

    const searchSchema = {
        searchterm: String
    };
    
    const Search = mongoose.model("Search", searchSchema);

    const adminSchema = {
        noticetitle: String,
        noticebody: String
    };
    
    const Admin = mongoose.model("Admin", adminSchema);
        // const newnotice = new Admin({
        //     noticetitle: "Be a part of this free for everyone Notes helper",
        //     noticebody: "This website is created to help everyone who want to learn for free. This website is totally based on your contribution so if you have notes then pls share with everyone"
        // })
        // newnotice.save();


    var findadmin = Admin.find();

    
app.get("/",async function(req, res){
    try{
    await User.find({}.exec,function(err,data){
        Admin.find({},function(err, dataa){
            
       res.render("home",{nameofuser: req.user, notice: dataa});
        console.log("here" + req.user);
    
        
    }).sort({_id: -1});
    }); 



    }catch(e){
        console.log("error", e);
    }
    
});
         
app.get("/register",function(req, res){
    res.render("register");
    
    });
    app.get("/login",function(req, res){
        res.render("login");
        
        });
    app.post("/register",function(req, res){
  
        var fullnameofuser = req.body.fullname;
    User.register({fullname: req.body.fullname, username: req.body.username}, req.body.password, function(err, user){
        if(err){
            res.send(err);
            console.log(err);
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/");
                });
    }
    });
    });

    
    
    app.post("/login",function(req, res) {
        const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function(err) {
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/");
                });
        }
    });
 });

 app.get("/notice/:id", function(req, res){
    var id = req.params.id;
    var findnotice = Admin.findById(id);
    findnotice.exec(function(err, data){
        if(err) throw err;
        res.render("notice",{noticefromadmin: data})
    })
 });



 app.get("/logout",function(req, res) {
    req.logout();
    res.redirect("/");
});


app.get("/notes_upload",function(req, res){
 if(req.isAuthenticated()){
        User.find({}.exec,function(err,data){
         res.render("notes_upload",{nameofuser: req.user, success:''});
            console.log(data);
        }); 
    }else{
        res.redirect("/login");
    }

});

var storage = multer.diskStorage({
    destination: "./public/uploads/",
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now()+path.extname(file.originalname));
      }
    });

    // const maxSize = 26214400;
    const maxSize = 2097152;
    var upload = multer({ storage: storage, limits: { fileSize: maxSize }}).single('file');

    app.post("/notes_upload",upload, function(req, res) {
        const sname = req.body.subjectname;
        const ntype = req.body.typeofnote;
        const tname = req.body.topic;
        const cname = req.body.course;
        const semesterfile = req.body.semester;
        var success = req.file.originalname + " Uploaded successfully";
        var notesfiles = req.file.filename;

        var submittednotes = req.body.file;   
        console.log(submittednotes);
        console.log(notesfiles);
   
       const note = new Note({
        notessubject: sname,
        notestype: ntype,
        notestopic: tname,
        course: cname,
        semester: semesterfile,
        notesfile: notesfiles,
        uploadedby: req.user.username
       
       });
       note.save(function(err, req1) {
          if(err) throw err; 
          findmethod.exec(function (err, data) {
       if(err) throw err;
       res.render("notes_upload", {success: "Uploaded successflly"});
   });
   
       });
    });       

app.get("/question-papers", function(req, res){
        Note.find({}.exec,function(err,data){
         res.render("question-papers",{notesdata: data});
            
        }); 
   
  
});
app.get("/question-papers/bba", function(req, res){
    Note.find({}.exec,function(err,data){
     res.render("question-bba",{notesdata: data});
     
        
    }); 


});

app.get("/question-papers/mca", function(req, res){
    Note.find({}.exec,function(err,data){
     res.render("question-mca",{notesdata: data});
        
    }); 
});
app.get("/question-papers/llb", function(req, res){
    Note.find({}.exec,function(err,data){
     res.render("question-bachlerllb",{notesdata: data});
        
    }); 
});

app.get("/question-papers/bca", function(req, res){
    Note.find({}.exec,function(err,data){
     res.render("question-bca",{notesdata: data});
        
    }); 

});
app.get("/notes", function(req, res){
    Note.find({}.exec,function(err,data){
     res.render("notes",{notesdata: data});
    
    }); 


});

app.get("/course", function(req, res){
    Note.find({}.exec,function(err,data){
     res.render("course",{notesdata: data});
        
    }); 

});

app.get("/course-questions", function(req, res){
    Note.find({}.exec,function(err,data){
     res.render("course-questions",{notesdata: data});
     
        
    }); 
});







app.post("/",function(req, res){
    const filter = req.body.fltrname;
    console.log(filter);
    if(filter!=''){
         var flterParameter = {$or:[{notessubject:filter}, {notestopic:filter}]
            }
    }
    var notesfilter = Note.find(flterParameter);
    const search = new Search({
        searchterm: filter,
         });
      search.save();

    
    notesfilter.exec(function(err, data){
if(err) throw err;
res.render("search",{notesdata: data,nameofuser:'', hello: 'RESULTS RELATED TO' + ' ' + filter});
console.log(data);
    });
    

     });

    app.get("/admin-login",function (req, res) {
        res.render("admin-login");    
        });


app.post("/admin-login",function(req, res, next) {
            const admininput = req.body.adminuser;
            const adminpassinput = req.body.adminpass;
        User.findOne({username: admininput}, function(err, found){
        if(err){
            console.log(err);
        }else{
        if(found){
            if(found.password===adminpassinput && found.username===admininput){
                res.render("admin-panel",{notesdata: ''});
            }else{
                res.redirect("/admin-login");
            }
        }else{
            res.redirect("/admin-login");
        }
        }
        
        
        });
        }); 
               
        
        app.get("/admin-panel",function (req, res) {
            
            if(req.isAuthenticated()){
                findmethod.exec(function (err, data) {
                    if(err) throw err;
                    else{
                        res.render("admin-panel",{notesdata: data});
                    }
                });
                 }else{
                res.redirect("/admin-login");
                }
                });
        
           app.post("/admin-panel", function(req, res) {
            findmethod.exec(function (err, data) {
                if(err) throw err;
                else{
                    res.render("admin-panel",{notesdata: data});
                }   
            
        });
           });
           
           
  app.get("/delete/:id",function(req, res){

      var id = req.params.id;
      var del = Note.findByIdAndDelete(id);
      del.exec(function (err, data) {
        if(err) throw err;
        else{
            res.render("admin-panel",{notesdata: data});
        }   
    
});
   });
   
  app.get("/create-notice", function(req, res) {
   
    res.render("admin-noticeboard", {success: ''});
            
        });    
        
     app.post("/create-notice",function(req, res){
            const postheading = req.body.posttitle;
            const postbody = req.body.noticebody;    
            const admin = new Admin({
               
                noticetitle: postheading,
                noticebody: postbody
               });
               admin.save(function(err, req1) {
                  if(err) throw err; 
                  findadmin.exec(function (err, data) {
               if(err) throw err;
               res.render("admin-noticeboard", {success: "Uploaded successflly"});
           });
           
               });


        })

        app.get("/notes/btech", function(req, res){
            Note.find({}.exec,function(err,data){
             res.render("notes-btech",{notesdata: data});
                
            }); 
        
        });

        app.get("/notes/bba", function(req, res){
            Note.find({}.exec,function(err,data){
             res.render("notes-bba",{notesdata: data});
                
            }); 
        
        }); 
         app.get("/notes/bca", function(req, res){
            Note.find({}.exec,function(err,data){
             res.render("notes-bca",{notesdata: data});
                
            }); 
        
        });
        app.get("/notes/mca", function(req, res){
            Note.find({}.exec,function(err,data){
             res.render("notes-mca",{notesdata: data});
                
            }); 
        
        });
        app.get("/notes/ba", function(req, res){
            Note.find({}.exec,function(err,data){
             res.render("notes-ba",{notesdata: data});
                
            }); 
        
        });

app.get("/about-me",function(req, res){
res.render("about-us");

})


app.get("/verified/sendemail", (req, res) => {
    const uniquetoken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
   if(req.user.isverified){
    res.redirect("/");
   }else{
    const token = new Alltoken({
        token: uniquetoken,
        email: req.user.username
    })
    token.save();
        
        // res.render('home',{nameofuser:'',notice:''});
        // res.redirect('/');
        // res.send("mail sent..pls check your mail")
        var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.USER,
          pass: process.env.PASS
        }
      });
const url = "http://localhost:3000/verifyemail?token="+uniquetoken;
      var mailOptions = {
        from: process.env.USER,
        to: req.user.username,
        cc: 'anand.k4756@gmail.com',
        subject: 'PLEASE VERIFY YOUR ACCOUNT checking nodemailer  ' + req.user.fullname,
        html: 'Click on this link to verify your account' + '<a href="http://noteshelper.herokuapp.com/verifyemail?token='+uniquetoken+'"> Verify</a>'


              };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
          res.send(error+ "try again")
        } else {
          console.log("sent");
          res.send("mail sent..pls check your mail "+ req.user.username);
        }
      });
    
      

    console.log(url);
   }
})

// app.get("/verified/sendmail/:id",(req, res)=>{
//     var id= req.params.id;

// })


app.get("/verifyemail",async (req, res) => {
const token = req.query.token;
console.log("query"+req.query)
console.log("check token here" + token);

if(token){
    var check = await Alltoken.findOne({token: token})

if(check){
    var userdata = await User.findOne({username: check.email})
    userdata.isverified=true;
    userdata.save();

    res.redirect("/");
}


}else{
    res.redirect("/");
}

})



const port = process.env.PORT || 3000




app.listen(port,() => {
  console.log(`Server running at port `+port);
});
