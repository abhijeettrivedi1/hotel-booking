const express = require('express')
const fs= require('fs')
const app = express()
const bcrypt= require('bcryptjs')
const cors= require('cors');
require("dotenv").config()
const  mongoose = require('mongoose');
const User = require('./models/user');
const Place = require('./models/place');
const Chat = require("./models/chat");
const bcryptsalt=  bcrypt.genSaltSync(10);
const jwt = require("jsonwebtoken")
const jwtSecret = "mdskjadskjbkjzxzgk";
const cookieParser = require("cookie-parser");
const imageDownloader=require("image-downloader");
const multer=require("multer");
const Booking = require('./models/booking');
const cloudinary = require("cloudinary").v2;
const http = require("http");
const { Server } = require("socket.io");
app.use("/uploads",express.static(__dirname+'/uploads'))
app.use(express.json())
app.use(cookieParser())
const allowedOrigins = [
  "http://localhost:5173",
];

app.use(
  cors({
    origin: true, // Allow all origins
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed methods
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ] 
  })
);

 mongoose.connect(process.env.mongo_uri)
 .then(()=>console.log('Connected to Mongo'))
 .catch((err)=>console.log(err));
 
 cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});
const upload = multer({
  storage: multer.diskStorage({}),
  limits: { fileSize: 5000000 }, // 500 KB limit
});
const uploadFile = async (filePath) => {
  // console.log(filePath);
  console.log("abhijeet");
  try {
    const result = await cloudinary.uploader.upload(filePath);
    console.log(result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.log(error);
    return error;
  }
};

app.get('/api/test', (req, res) => {
  res.json('Hello World!')
});
app.post("/api/register", async(req, res) => {
  console.log(1);
  const {name,email,password} = req.body;
  try{
    console.log(2);

    const userdoc=await User.create({name,
      email,
      password:bcrypt.hashSync(password,bcryptsalt)
    })
    jwt.sign({email:userdoc.email,id:userdoc._id},jwtSecret,{},(err,token)=>{
        if(err) throw err;
        else{
          res.cookie("token",token,{
            expires: new Date(Date.now() + 1000 * 60 * 60 * 1000),
            maxAge: 1000 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "none",
            secure: true
          }).json(userdoc)
        }
      })

  
  }catch(e){
    console.log(e);
    res.status(422).json(e);
  }
  
})
app.post("/api/login", async(req, res) =>{
  const {email,password}=req.body;
  const userdoc=await User.findOne({email})
  if(!userdoc){
    res.status(422).json("Invalid Credentials")
  }
  else{
    if(bcrypt.compareSync(password,userdoc.password)){
      jwt.sign({email:userdoc.email,id:userdoc._id},jwtSecret,{},(err,token)=>{
        if(err) throw err;
        else{
          res.cookie("token",token,{
            expires: new Date(Date.now() + 1000 * 60 * 60 * 1000),
            maxAge: 1000 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "none",
            secure: true
          }).json(userdoc)
        }
      })
    }
    else{
      res.status(422).json("Invalid Credentials")
    }
  }
})

app.get("/api/profile", (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, jwtSecret, async (err, userdata) => {
      if (err) {
        res.status(422).json(err);
      } else {
        try {
          const { name, email, _id } = await User.findById(userdata.id); // Fix here
          res.json({ name, email, _id });
        } catch (error) {
          res.status(422).json(error);
        }
      }
    });
  } else {
    res.json(null);
  }
});


app.post("/api/logout", (req, res) => {
   res.cookie('token', '', {
        expires: new Date(0), // Expire the cookie immediately
        httpOnly: true,
        sameSite: "none",
        secure: true
    }).json({ success: true });
})
app.post("/api/upload-by-link", async (req, res) => {
  console.log("k")
  try {
    const { link } = req.body;
    // console.log(req.body);
    const fileurl = await cloudinary.uploader.upload(link);
    console.log(fileurl);
    // console.log(fileurl.secure_url);
    res.json(fileurl.secure_url);
  } catch (e) {
    res.status(422).json({ error: e.message });
    // res.status(422).json({ error: e.message });
  }
});
const photosmiddleware=multer({dest:"uploads/"})
const uploadFun = async (req, res) => {
  // console.log(req.files);
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files were uploaded." });
    }

    const uploadPromises = req.files.map((file) => {
      // Pass the file buffer and original name to the upload function
      // console.log(file.path);
      return uploadFile(file.path);
    });
    const uploadResults = await Promise.all(uploadPromises);

    res.json(uploadResults);
  } catch (e) {
    res.status(422).json({ error: e.message });
  }
};

// app.post("/upload", upload.array("photos", 100), uploadFun);
app.post("/api/upload", upload.array("photos", 100), uploadFun);
// app.post('/upload',photosmiddleware.array('photos',100),(req, res) => {
//     const uploadedfiles=[];
//    for(let i=0;i<req.files.length;i++) {
//         const {path,originalname}=req.files[i];
//         const parts=originalname.split(".")
//         const ext=parts[parts.length-1]
//         const newpath=path +"."+ext;
//         fs.renameSync(path,newpath)
//         uploadedfiles.push(newpath.replace("uploads\\",""))
//     }
//     res.json(uploadedfiles);    
// })
app.post("/api/places",(req, res) => {
  const { token } = req.cookies;
  const {title,address,addedphotos,description,perks,extraInfo,checkIn,checkOut,maxGuests,price}=req.body;
  jwt.verify(token, jwtSecret,{}, async (err, userdata) => {
    if (err) {
      throw err;
    }
    const placeDoc=await Place.create({
      owner:userdata.id,
      title,address,photos:addedphotos,description,
      perks,extraInfo,checkIn,checkOut,maxGuests,price
    })
    res.json(placeDoc);
  });
})
app.get("/api/user-places",(req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, jwtSecret, async (err, userdata) => {
      const{id}=userdata;
      res.json(await Place.find({owner:id}))
  });
})
app.get("/api/places/:id",async (req, res) => {
  const{id}=req.params;
  res.json(await Place.findById(id))
})

app.put("/api/places",async (req, res) => {

  const { token } = req.cookies;
  const {id,title,
    address,
    addedphotos,
    description,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,price}=req.body;
    jwt.verify(token, jwtSecret, async (err, userdata) => {
      
      const placeDoc=await Place.findById(id);
      if(userdata.id===placeDoc.owner.toString()){
        
       placeDoc.set({
        title,
        address,
        photos:addedphotos,
        description,
        perks,
        extraInfo,
        checkIn,
        checkOut,
        maxGuests,price
       })
       await placeDoc.save()
       res.json("ok")
      }
      
  });

})

// ✅ Get messages by placeId and senderId (receiver is auto-calculated)
// Get chat messages between current user and otherUserId
app.get("/api/chat/:otherUserId", async (req, res) => {
  try {
    const userdata = await getuserdatafromtoken(req);
    const userId = userdata.id;
    const { otherUserId } = req.params;

    // find conversation
    const chat = await Chat.findOne({
      participants: { $all: [userId, otherUserId] },
    }).populate("messages.sender", "name email");

    if (!chat) return res.json({ messages: [] });

    res.json({ chatId: chat._id, messages: chat.messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get list of chats for current user (latest message preview)
app.get("/api/chats", async (req, res) => {
  try {
    const userdata = await getuserdatafromtoken(req);
    const userId = userdata.id;

    // Find chats containing the user and return last message and participant info
    const chats = await Chat.find({ participants: userId })
      .sort({ updatedAt: -1 })
      .lean();

    // map to a lighter object
    const results = await Promise.all(
      chats.map(async (c) => {
        const other = c.participants.find((p) => p.toString() !== userId.toString());
        const lastMsg = c.messages[c.messages.length - 1] || null;
        // optionally populate other user's profile
        const otherUser = await User.findById(other, "name email");
        return {
          chatId: c._id,
          otherUser,
          lastMsg,
        };
      })
    );

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});



app.get("/api/places",async(req,res) => {
  res.json(await Place.find())
})

app.post("/api/bookings",async (req,res)=>{
  const userdata=await getuserdatafromtoken(req);
  const {place,checkIn,checkOut,numberofGuests,name,phone,price}=req.body;
   Booking.create({
    place,checkIn,checkOut,numberofGuests,name,phone,price,user:userdata.id
  }).then((doc)=>{
    
    res.json(doc)
    
  })
  .catch((err)=>{
    throw err
  })
})

function getuserdatafromtoken(req){
    return new Promise((resolve,reject)=>{
      jwt.verify(req.cookies.token, jwtSecret, async (err, userdata) => {
        if(err) throw err;
        else{
          resolve(userdata);
        }
      });
    })
    
}
app.get("/api/bookings",async (req,res)=>{
  const userdata=await getuserdatafromtoken(req)
  res.json(await Booking.find({user:userdata.id}).populate("place")) 
})

// server-side relevant imports (already in your file)
// ... keep existing jwt, jwtSecret, io setup, etc.

// Create server & io (you already do this — keep server variable)
const server = http.createServer(app);
const io = new Server(server, {
  path: "/api/socket.io",
  cors: {
    origin: true,
    credentials: true,
  },
});

// Middleware for socket auth using handshake.auth.token (optional but recommended).
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) {
      // allow connecting without token, but the client must call "register" with userId
      return next();
    }
    jwt.verify(token, jwtSecret, (err, userdata) => {
      if (err) return next(); // allow connect but without verified user
      socket.user = userdata; // { id, email }
      next();
    });
  } catch (err) {
    next();
  }
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // If token-based auth succeeded, auto join user's personal room
  if (socket.user && socket.user.id) {
    socket.join(socket.user.id.toString());
    console.log(`Socket ${socket.id} joined user room ${socket.user.id}`);
  }

  // Fallback: client can register its userId after connect if token wasn't supplied
  socket.on("register", ({ userId }) => {
    if (!userId) return;
    socket.join(userId.toString());
    socket.user = socket.user || {};
    socket.user.id = userId;
    console.log(`Socket ${socket.id} registered as user ${userId}`);
  });

  // sendMessage: payload: { receiverId, text }
  socket.on("sendMessage", async (payload) => {
    try {
      const senderId = (socket.user && socket.user.id) || payload.senderId;
      const { receiverId, text } = payload;

      if (!senderId || !receiverId || !text) {
        return socket.emit("error", "Missing fields for sendMessage");
      }

      // find existing chat between the two users (order-independent)
      let chat = await Chat.findOne({
        participants: { $all: [senderId, receiverId] },
      });

      if (!chat) {
        chat = new Chat({
          participants: [senderId, receiverId],
          messages: [],
        });
      }

      const message = {
        sender: senderId,
        text,
        timestamp: new Date(),
      };
      chat.messages.push(message);
      await chat.save();

      // normalized message to emit
      const emitMsg = {
        chatId: chat._id,
        sender: senderId,
        receiver: receiverId,
        text,
        timestamp: message.timestamp,
      };

      // Emit to receiver room (if online)
      io.to(receiverId.toString()).emit("receiveMessage", emitMsg);

      // Emit to sender's room (ack + delivered to other open tabs)
      io.to(senderId.toString()).emit("receiveMessage", emitMsg);
    } catch (err) {
      console.error("sendMessage error:", err);
      socket.emit("error", "Server error on sendMessage");
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});


// ---------------- START SERVER ---------------- //
server.listen(3000, () => {
  console.log("Server running on port 3000");
});
