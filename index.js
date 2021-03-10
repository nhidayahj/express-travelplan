const express = require('express')
const cors = require('cors')

require("dotenv").config();
const ObjectId = require('mongodb').ObjectId
const MongoUtil = require('./MongoUtil')

const mongoUrl = process.env.MONGO_URL;

let app = express()
app.use(express.urlencoded({
    extended: false
}))

app.use(express.json())
app.use(cors())

async function main() {

    let db = await MongoUtil.connect(mongoUrl, "travel");
    console.log("Mongo database connected")

    // display all reviews
    app.get('/allreviews', async (req, res) => {

        try {
            let allReviews = await db.collection("reviews")
                .find({})
                .toArray();
            res.status(200);
            res.send(allReviews)
        } catch (e) {
            res.status(500);
            res.send({
                'error': "Trouble displaying data"
            });
            console.log(e);
        }
    })

  

    // create reviews 
    app.post('/createreviews', async (req, res) => {
        let username=req.body.username
        // usercode will be referenced to user collections
        let usercode = req.body.usercode
        let countryName = req.body.countryName;
        let cityTown = req.body.cityTown;
        let reviewCategory=req.body.reviewCategory
        let reviewType = req.body.reviewType 
        let nameOfPlace = req.body.nameOfPlace
        let reviewAddress = req.body.reviewAddress
        let reviewTags = req.body.reviewTags
        let reviewDesc = req.body.reviewDesc
        let imageLink = req.body.imageLink
        let ratings = req.body.ratings
        // include user code


        try {
            let result = await db.collection("reviews").insertOne({
                username:username,
                user_id:usercode,
                country: countryName,
                city_town: cityTown,
                review_category: reviewCategory,
                review_type: reviewType,
                name_of_place: nameOfPlace,
                review_address:reviewAddress,
                review_tags:reviewTags,
                review_desc:reviewDesc,
                image_link:imageLink,
                ratings:ratings,

            });
            res.status(200)
            //results.ops[0]  is the message shown in API 
            res.send(result.ops[0])
        } catch (e) {
            res.status(500);
            res.send({
                'message': "internal server error"
            });
            console.log(e)
        }

    })

}





main()




app.listen(3001, () => {
    console.log("Server has started")
})



