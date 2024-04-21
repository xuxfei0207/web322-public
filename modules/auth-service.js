require('dotenv').config(); 
const bcrypt = require('bcryptjs');

const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let userSchema = new Schema({
  userName: {
    type: String, 
    unique: true,
  },
  password: String, //hashed
  email: String,
  loginHistory: [
    {
        dateTime: Date,
        userAgent: String,
    },
  ],
});

let User; // to be defined on new connection (see initialize)

function initialize() {
    return new Promise(function (resolve, reject) {
        console.log("connecting to mongodb with ", process.env.MONGODB)
        let db = mongoose.createConnection(process.env.MONGODB);

        db.on('error', (err)=>{
            console.log("error connecting to mongodb")
            reject(err); // reject the promise with the provided error
        });
        db.once('open', ()=>{
            console.log("successfully connecting to mongodb")
           User = db.model("users", userSchema);
           resolve();
        });
    });
}

function registerUser(userData) {
    return new Promise(async (resolve, reject) => {
        // check if passwords match
        if (userData.password != userData.password2) {
            reject('Passwords do not match');
        } else {
            try {
                userData.password = await bcrypt.hash(userData.password, 10);
                let newUser = new User(userData);
                newUser.save()
                    .then(() => {
                        resolve();
                    })
                    .catch((err) => {
                        console.log("error saving user: ", err)
                        if (err.code === 11000) {
                            reject('User Name already taken');
                        } else {
                            reject(
                                'There was an error creating the user: ' + err);
                        }
                    });
            } catch (error) {
                reject('There was an error encrypting the password: ' + error);
            }
        }
    });
}

function checkUser(userData) {
    return new Promise(async (resolve, reject) => {
        try {
            const users = await User.find({userName: userData.userName}).exec();
            
            if (userData.length === 0) {
                reject('Unable to find user: ' + userData.userName);
            }
            // .find() return an array
            const hashedPassword = users[0].password;
            const passwordMatch = await bcrypt.compare(
                userData.password,
                hashedPassword,
            );

            if (!passwordMatch) {
                reject(`Incorrect Password for user: ${userData.userName}`);
            } else {
                if (users[0].loginHistory.length === 8) {
                    users[0].loginHistory.pop();
                }
                users[0].loginHistory.unshift({
                    dateTime: new Date().toString(),
                    userAgent: userData.userAgent,
                });

                await User
                    .updateOne(
                        {userName: users[0].userName},
                        {$set: {loginHistory: users[0].loginHistory}},
                    )
                    .exec();

                resolve(users[0]);
            }
        } catch (err) {
            reject('There was an error verifying the user: ' + err.message);
        }
    });
}

module.exports = {
    initialize,
    registerUser,
    checkUser
};