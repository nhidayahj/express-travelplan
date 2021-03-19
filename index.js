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


    app.get('/all', async (req, res) => {
        try {
            let all_country = await db.collection('country')
                .find({})
                .project({
                    'country':1,
                    'image_url':1,
                    'best_for':1
                })
                .toArray()
                
            let all_reviews = await db.collection('reviews')
                .find({})
                .project({
                    'country':1,
                })
                .toArray()
                // console.log("all reviews: " , all_reviews)
            res.status(200);
            res.send([all_country, all_reviews])
        } catch (e) {
            res.status(500);
            res.send({
                message: "Cannot fetch country database"
            })
            console.log(e)
        }
    })

    // display all reviews
    app.get('/:country', async (req, res) => {
        let country = req.params.country
        
        try {
            let selectedCountry = await db.collection("country")
                .find({
                    'country': country
                })
                .toArray()
            let allReviews = await db.collection("reviews")
                .find({
                    'country': selectedCountry[0]._id
                })
                .toArray();
                console.log("all reviews " ,allReviews)
            let allUsers = await db.collection("users")
                .find({})
                .project({
                    'username':1
                })
                .toArray()

                // console.log("display all users: ", allUsers)
            let data = [
                allReviews,
                selectedCountry,
                allUsers
            ]
            res.status(200);
            res.send(data)
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

        let username = req.body.username
        // usercode will be referenced to user collections
        let usercode = req.body.usercode
        let countryName = req.body.countryName;
        let cityTown = req.body.cityTown;
        let reviewCategory = req.body.reviewCategory
        let reviewType = req.body.reviewType
        let nameOfPlace = req.body.nameOfPlace
        let reviewAddress = req.body.reviewAddress
        let reviewTags = req.body.reviewTags
        let reviewDesc = req.body.reviewDesc
        let imageLink = req.body.imageLink
        let ratings = req.body.ratings
        // include user code
        // console.log("country:" +countryName)

        try {
            let country = await db.collection("country").find({
                'country': countryName
            }).toArray()
            console.log("country added: " + country[0])
            let user = await db.collection("users").insertOne({
                'username':username,
                'usercode':usercode
            })
            console.log("user added: " ,user.ops[0])

            let result = await db.collection("reviews").insertOne({
                user:user.ops[0]._id,
                country: country[0]._id,
                city_town: cityTown,
                review_category: reviewCategory,
                review_type: reviewType,
                name_of_place: nameOfPlace,
                review_address: reviewAddress,
                review_tags: reviewTags,
                review_desc: reviewDesc,
                image_link: imageLink,
                ratings: ratings,

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


    app.post('/:country', async(req,res) => {
        let queryString = req.body.queryBox
        console.log("Query string:" ,queryString)
        let country = req.params.country

        if(req.query.review_desc) {
            query['review_desc'] = {
                '$in':req.query.review_desc
            }
        }
        let resultCountry = await db.collection('country')
            .findOne({
                'country':country
            })
        let countryId = resultCountry._id
        console.log("Country ID: ", countryId)

        let result = await db.collection('reviews')
            .find({
                '$and': [
                    {
                        'country':countryId
                    },
                    {
                        '$or':[
                            {
                                'review_desc':{'$regex':queryString}
                            },
                            {
                                'city_town':{'$regex':queryString}
                            },
                            {
                                'review_type':{'$regex':queryString}
                            },
                            {
                                'name_of_place':{'$regex':queryString}
                            },
                            {
                                'ratings':{'$regex':queryString}
                            },
                            {
                                'review_tags':{'$in':[queryString]}
                            }
                        ]
                    }
                ]
            })
            .toArray();

        res.status(200);
        console.log("Query search: ",result)
        res.send(result)

    })

   


    app.get('/:review_id/update', async (req, res) => {
        let reviewId = req.params.review_id;
        // let countryId = req.params.country_id
        try {
            let resultReview = await db.collection('reviews')
                .find({
                    "_id": ObjectId(reviewId)
                })
                .toArray()
            res.status(200);
            // let resultCountry = await db.collection("country")
            //     .find({
            //         "_id":ObjectId(countryId)
            //     })
            res.send(resultReview)
        } catch (e) {
            res.status(500);
            res.send({
                'error': "Cant find such review in Reviews collection"
            });
            console.log(e)
        }
    })

    app.put("/review/:id/update", async (req, res) => {
        let review_id = req.params.id;
        let cityTown = req.body.cityTown;
        let reviewCategory = req.body.reviewCategory
        let reviewType = req.body.reviewType
        let nameOfPlace = req.body.nameOfPlace
        let reviewAddress = req.body.reviewAddress
        let reviewTags = req.body.reviewTags
        let reviewDesc = req.body.reviewDesc
        let imageLink = req.body.imageLink
        let ratings = req.body.ratings
        console.log(review_id)

        try {
            let result = await db.collection("reviews")
                .updateOne({
                    "_id": ObjectId(review_id)
                }, {
                    '$set': {
                        review_category: reviewCategory,
                        review_type: reviewType,
                        name_of_place: nameOfPlace,
                        review_address: reviewAddress,
                        review_tags: reviewTags,
                        review_desc: reviewDesc,
                        image_link: imageLink,
                        ratings: ratings,
                        city_town: cityTown
                    }
                })
                res.status(200);
                res.send(result)
        } catch (e) {
            res.status(500);
            res.send({
                'error':"Unable to update existing review"
            });
            console.log(e)
        }

    })

    app.post('/review/:id/delete', async (req,res) => {
        let review_id = req.params.id;

        try {
            let result = await db.collection('reviews')
                .deleteOne({
                    "_id":ObjectId(review_id)
                })
                res.status(200);
                res.send("Post deleted")
        } catch (e) {
            res.status(500);
            res.send({
                error: "Post in error or post unable to delete"
            });
            console.log(e)
        }
    })

    // review catgories collection
    // app.post('/category/review', async (req,res) => {
    //     let review_category = req.body.review_category

    //     try {
    //         let result_category = await db.collection("category").insertOne({
    //             review_category:review_category
    //         })
    //         res.status(200);
    //         res.send(result_category)
    //     } catch (e) {
    //         res.status(500);
    //         res.send({
    //             message:"review category not captured"
    //         });
    //         console.log(e)
    //     }
    // })

}

main()


app.listen(3001, () => {
    console.log("Server has started")
})
