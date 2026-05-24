const moongoose = require('mongoose');

const product = new moongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,   
        required: true
    },
    stock: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    Description :{
        type : String,
    },
    description :{
        type : String,
    },
    image :{
        type : String,
    },
    badge :{
        type : String,
    },
    featured :{
        type : Boolean,
        default : false
    },
    latest :{
        type : Boolean,
        default : false
    },
    Reviews : [
        {
            user : {
                type : moongoose.Schema.Types.ObjectId,
                ref : 'user'
            },
            rating : {
                type : Number,
                required : true
            },
            comment : {
                type : String,
                required : true
            }
        }
    ]
}, {timestamps: true});

module.exports = moongoose.model('product', product);