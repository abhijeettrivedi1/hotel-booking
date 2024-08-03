const mongoose= require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    email: {
        type:String,
        unique:true
    },
    password: String,
});

const UserModel = mongoose.model('Uer', userSchema);

module.exports =UserModel;