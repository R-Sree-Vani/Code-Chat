//requirements
const express = require("express");
const mongoose = require("mongoose");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const bcrypt = require("bcryptjs");
const LocalStorage = require("node-localstorage").LocalStorage;
localStorage = new LocalStorage("./scratch");
const cookieparser = require("cookie-parser");
const multer = require("multer");
const path = require("path");
const { error } = require("console");

const app = express();

//middlewares
mongoose.connect(
  "mongodb+srv://prempk7172:prem@cluster0.dkzlbmo.mongodb.net/codechat"
);
app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieparser());

//schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  job: String,
});
const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  authorname: String,
  comments: [String],
});
const imageSchema = new mongoose.Schema({
  name: String,
  about: String,
  email: String,
  imagePath: String,
});

//model
const User = new mongoose.model("User", userSchema);
const Post = new mongoose.model("Post", postSchema);
const Image = new mongoose.model("Image", imageSchema);

//get routes
app.get("/edit", async (req, res) => {
  var user = req.cookies.Userstatus;
  var Currentuser = JSON.parse(localStorage.getItem(user));
  const posts = await Post.findOne({ author: user });
  const username = await User.findOne({ email: user });
  var e = 0;
  const profileabout = await Image.findOne({ email: user })
  .then((data) => {
    if (data) {
      e = 1;
    }
    res.render("edit", {
      user: user,
      username: username,
      profileabout: data,
      e: e,
    });
  });
});

app.get("/error", (req, res) => {
  res.render("error");
});
app.get("/header", (req, res) => {
  var user = req.cookies.Userstatus;
  res.render("header", { user: user });
});
app.get("/userprofile", async (req, res) => {
  var user = req.cookies.Userstatus;
  var Currentuser = JSON.parse(localStorage.getItem(user));
  const posts = await Post.find({ author: user });

  var q = 0;
  if (posts) {
    q = 1;
  }
  var w = 0;

  const profiledetails = await Image.findOne({ email: user }).then((data) => {
    if (data.imagePath != "No profile") {
      w = 1;
      console.log(data);
    }
    res.render("userprofile", {
      user: user,
      post: posts,
      data: data,
      q: q,
      w: w,
    });
  });
});

app.get("/", (req, res) => {
  var user = req.cookies.Userstatus;
  var Currentuser = JSON.parse(localStorage.getItem(user));
  res.render("home", { user: user });
});
app.get("/login", (req, res) => {
  var user = req.cookies.Userstatus;
  res.render("login", { user: user });
});
app.get("/logout", (req, res) => {
  var user = req.cookies.Userstatus;
  localStorage.removeItem(user);
  res.clearCookie("User status");
  res.redirect("/");
});
app.get("/signup", (req, res) => {
  var user = req.cookies.Userstatus;
  res.render("signup", { user: user });
});
app.get("/createpost", (req, res) => {
  var user = req.cookies.Userstatus;
  res.render("createpost", { user: user });
});
app.get("/individual_post", (req, res) => {
  res.render("individual_post");
});
app.get("/inbox", async (req, res) => {
  var user = req.cookies.Userstatus;
  const posts = await Post.find({}).then((data) => {
    res.render("inbox", { posts: data, user: user });
  });
});
app.get("/inbox/:post_id", async (req, res) => {
  var user = req.cookies.Userstatus;
  const post_id = req.params.post_id;

  const post = await Post.findOne({ _id: post_id });

  res.render("individual_post", { post: post, user: user });
});
app.get("/comment/:post_id", async (req, res) => {
  try {
    var user = req.cookies.Userstatus;

    const post_id = req.params.post_id;

    const post = await Post.findById(post_id);
    const posttitle = Post.findOne({ _id: post_id });
    res.render("comment", { post: post, user: user });
  } catch (err) {
    res.json({ message: err });
  }
});

app.get("/delete/:post_id", async (req, res) => {
  var user = req.cookies.Userstatus;
  const post_id = req.params.post_id;
  if (!user) {
    res.redirect("/login");
  } else {
    const post = await Post.findOne({ _id: post_id });
    if (user == post.author) {
      const deleted = await Post.findByIdAndRemove(post_id);
      res.redirect("/inbox");
    } else {
      res.render("error.ejs");
    }
  }
});
app.get("/postauthor/:author_id", async (req, res) => {
  const author_email = req.params.author_id;
  const post = await Post.find({ author: author_email });
  const user = req.cookies.Userstatus;
  const Currentuser = JSON.parse(localStorage.getItem(user));
  const auth_in_user = await User.findOne({ email: author_email });
  var q = 0;
  if (post) {
    q = 1;
  }
  var w = 0;
  const profiledetails = await Image.findOne({ email: author_email })
  .then((data) => {
    if (data.imagePath != "No profile") {
      w = 1;
    }
    res.render("authorprofile", {
      user: user,
      post: post,
      auth_in_user: auth_in_user,
      q: q,
      profiledetails: data,
      w: w,
    });
  });
});

//post routes
app.post("/login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = await User.findOne({ email: email });
  if (!user) {
    res.render("signup");
  } else {
    const ismatchpassword = await bcrypt.compare(password, user.password);
    if (!ismatchpassword) {
      res.write(
        "<html><body style='background:rgb(0,149,255);display:flex;align-items:center;justify-content:center;color:white;font-size:20px;'><center><strong>Invalid password</strong><br><br><a href='/login' style='color:white;font-size:18px'>Login</a></center></body></html>"
      );
    } else {
      res.cookie("Userstatus", email);
      localStorage.setItem(email, JSON.stringify(user));
      res.redirect("/");
    }
  }
});
app.post("/signup", async (req, res) => {
  const name = req.body.fname;
  const email = req.body.email;
  const password = req.body.password;
  const job = req.body.job;
  const hashedpassword = await bcrypt.hash(password, 12);
  const user = new User({
    name: name,
    email: email,
    password: hashedpassword,
    job: job,
  });
  User.findOne({ email: email }).then((data) => {
    try {
      if (data) {
        res.redirect("/login");
      } else {
        user.save();
        const newImage = new Image({
          imagePath: "No profile",
          name: name,
          about: "Enter about",
          email: email,
        });
        newImage.save();
        res.redirect("/login");
      }
    } catch {
      console.log("err");
    }
  });
});
app.post("/post", (req, res) => {
  const title = req.body.title;
  const content = req.body.content;
  const user = req.cookies.Userstatus;
  const Currentuser = JSON.parse(localStorage.getItem(user));
  const name = Currentuser.name;
  const post = new Post({
    title: title,
    content: content,
    author: user,
    authorname: name,
  });
  post
    .save()
    .then((data) => {
      res.redirect("/inbox");
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/comment/:post_id", async (req, res) => {
  try {
    var user = req.cookies.Userstatus;

    const content = req.body.content;
    const post_id = req.params.post_id;
    const postupdate = await Post.updateOne(
      { _id: post_id },
      { $push: { comments: content } }
    );
    postupdate.save();
    res.redirect("/inbox");
  } catch (err) {
    res.redirect("/inbox");
  }
});

var Storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: (req, image, cb) => {
    cb(
      null,
      image.fieldname + "_" + Date.now() + path.extname(image.originalname)
    );
  },
});

var upload = multer({
  storage: Storage,
}).single("image");

app.post("/upload", upload, async (req, res) => {
  var user = req.cookies.Userstatus;
  var Currentuser = JSON.parse(localStorage.getItem(user));
  const name = req.body.name;
  const about = req.body.about;
  const email = req.body.email;

  const posts = await Post.find({ author: user });
  var q = 0;
  if (posts) {
    q = 1;
  }
  const profiledetails = await Image.findOne({ email: user });
  var w = 0;
  if (profiledetails) {
    w = 1;
  }
  const imagePath = req.file.filename;
  const imgid = await Image.findOne({ email: user });

  const newimage = await Image.findByIdAndUpdate(
    { _id: imgid._id },
    {
      $set: {
        imagePath: imagePath,
        about: about,
      },
    }
  );
  newimage.save();

  const imgdata = await Image.findOne({ email: user })
    .then((data) => {
      res.render("userprofile", {
        data: data,
        user: user,
        post: posts,
        q: q,
        w: w,
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

//start the port at 3000
app.listen(3000, () => {
  console.log("Server started on port 3000");
});
