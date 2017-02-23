var restify = require('restify');
var builder = require('botbuilder');

var http = require('http');


//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
 //   appId: process.env.MICROSOFT_APP_ID,
 //   appPassword: process.env.MICROSOFT_APP_PASSWORD

    appId: 'c028bc57-546b-44b0-953a-2e25e5f5973e',
    appPassword: 'fkieP7SZPR9se92J2ktyS37'
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Middleware
//=========================================================

// Anytime the major version is incremented any existing conversations will be restarted.
bot.use(builder.Middleware.dialogVersion({ version: 1.0, resetCommand: /^reset/i }));

//=========================================================
// Bots Global Actions
//=========================================================

bot.endConversationAction('goodbye', 'Goodbye :)', { matches: /^goodbye/i });
bot.beginDialogAction('help', '/help', { matches: /^help/i });
bot.beginDialogAction('menu', '/menu', { matches: /^menu/i });

//=========================================================
// Bots Dialogs
//=========================================================
bot.dialog('/', [
    function (session) {
        // Send a greeting and show help.
        var card = new builder.HeroCard(session)
            .title("Blocally Business Bot")
            .text("Connecting Businesses and Customers Socially.")
            .images([
                 builder.CardImage.create(session, "http://docs.botframework.com/images/demo_bot_image.png")
            ]);
        var msg = new builder.Message(session).attachments([card]);
        session.send(msg);
        session.send("Hi... I'm the Blocally Business Bot. I can help you find businesses in your local area.");
        session.beginDialog('/help');
    },
    function (session, results) {
        // Display menu
        session.beginDialog('/start');
    },
    function (session, results) {
        // Always say goodbye
        session.send("Ok... See you later!");
    }
]);

bot.dialog('/start', new builder.IntentDialog()   
        //root ‘/’ dialog responds to any message.
.matches('^businesses', builder.DialogAction.beginDialog('/businesses'))
        // The CommandDialog lets you add a RegEx that, when matched, 
        //will invoke a Dialog Handler.
.onDefault([
    //The first step of the root ‘/’ dialog checks to see if we know 
    //the user's location, and if not, it redirects them to the ‘/weather’ dialog
    //using a call to beginDialog(). 
    function (session, args, next) 
    {
        if (!session.userData.location) { session.beginDialog('/businesses'); }
        else { next(); }    
                //You can persist data for a user globally by assigning values 
                //to the session.userData object, like we've done here for location.
    },
    function (session, results) 
    {
        session.send('Hello from %s', session.userData.location + "!");
    }
])); //End of bot.add() root ‘/’ dialog and .onDefault();

bot.dialog('/menu', [
    function (session) {
        builder.Prompts.choice(session, "What demo would you like to run?", "prompts|picture|cards|list|carousel|receipt|actions|(quit)");
    },
    function (session, results) {
        if (results.response && results.response.entity != '(quit)') {
            // Launch demo dialog
            session.beginDialog('/' + results.response.entity);
        } else {
            // Exit the menu
            session.endDialog();
        }
    },
    function (session, results) {
        // The menu runs a loop until the user chooses to (quit).
        session.replaceDialog('/menu');
    }
]).reloadAction('reloadMenu', null, { matches: /^menu|show menu/i });

bot.dialog('/help', [
    function (session) {
        session.endDialog("Global commands that are available anytime:\n\n* menu - Exits a demo and returns to the menu.\n* goodbye - End this conversation.\n* help - Displays these commands.");
    }
]);

bot.dialog('/prompts', [
    function (session) {
        session.send("Our Bot Builder SDK has a rich set of built-in prompts that simplify asking the user a series of questions. This demo will walk you through using each prompt. Just follow the prompts and you can quit at any time by saying 'cancel'.");
        builder.Prompts.text(session, "Prompts.text()\n\nEnter some text and I'll say it back.");
    },
    function (session, results) {
        session.send("You entered '%s'", results.response);
        builder.Prompts.number(session, "Prompts.number()\n\nNow enter a number.");
    },
    function (session, results) {
        session.send("You entered '%s'", results.response);
        session.send("Bot Builder includes a rich choice() prompt that lets you offer a user a list choices to pick from. On Facebook these choices by default surface using Quick Replies if there are 10 or less choices. If there are more than 10 choices a numbered list will be used but you can specify the exact type of list to show using the ListStyle property.");
        builder.Prompts.choice(session, "Prompts.choice()\n\nChoose a list style (the default is auto.)", "auto|inline|list|button|none");
    },
    function (session, results) {
        var style = builder.ListStyle[results.response.entity];
        builder.Prompts.choice(session, "Prompts.choice()\n\nNow pick an option.", "option A|option B|option C", { listStyle: style });
    },
    function (session, results) {
        session.send("You chose '%s'", results.response.entity);
        builder.Prompts.confirm(session, "Prompts.confirm()\n\nSimple yes/no questions are possible. Answer yes or no now.");
    },
    function (session, results) {
        session.send("You chose '%s'", results.response ? 'yes' : 'no');
        builder.Prompts.time(session, "Prompts.time()\n\nThe framework can recognize a range of times expressed as natural language. Enter a time like 'Monday at 7am' and I'll show you the JSON we return.");
    },
    function (session, results) {
        session.send("Recognized Entity: %s", JSON.stringify(results.response));
        builder.Prompts.attachment(session, "Prompts.attachment()\n\nYour bot can wait on the user to upload an image or video. Send me an image and I'll send it back to you.");
    },
    function (session, results) {
        var msg = new builder.Message(session)
            .ntext("I got %d attachment.", "I got %d attachments.", results.response.length);
        results.response.forEach(function (attachment) {
            msg.addAttachment(attachment);    
        });
        session.endDialog(msg);
    }
]);

bot.dialog('/picture', [
    function (session) {
        session.send("You can easily send pictures to a user...");
        var msg = new builder.Message(session)
            .attachments([{
                contentType: "image/jpeg",
                contentUrl: "http://www.theoldrobots.com/images62/Bender-18.JPG"
            }]);
        session.endDialog(msg);
    }
]);

bot.dialog('/cards', [
    function (session) {
        session.send("You can use either a Hero or a Thumbnail card to send the user visually rich information. On Facebook both will be rendered using the same Generic Template...");

        var msg = new builder.Message(session)
            .attachments([
                new builder.HeroCard(session)
                    .title("Hero Card")
                    .subtitle("The Space Needle is an observation tower in Seattle, Washington, a landmark of the Pacific Northwest, and an icon of Seattle.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
                    ])
                    .tap(builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle"))
            ]);
        session.send(msg);

        msg = new builder.Message(session)
            .attachments([
                new builder.ThumbnailCard(session)
                    .title("Thumbnail Card")
                    .subtitle("Pike Place Market is a public market overlooking the Elliott Bay waterfront in Seattle, Washington, United States.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/PikePlaceMarket.jpg/320px-PikePlaceMarket.jpg")
                    ])
                    .tap(builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Pike_Place_Market"))
            ]);
        session.endDialog(msg);
    }
]);

bot.dialog('/list', [
    function (session) {
        session.send("You can send the user a list of cards as multiple attachments in a single message...");

        var msg = new builder.Message(session)
            .attachments([
                new builder.HeroCard(session)
                    .title("Space Needle")
                    .subtitle("The Space Needle is an observation tower in Seattle, Washington, a landmark of the Pacific Northwest, and an icon of Seattle.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
                    ]),
                new builder.HeroCard(session)
                    .title("Pikes Place Market")
                    .subtitle("Pike Place Market is a public market overlooking the Elliott Bay waterfront in Seattle, Washington, United States.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/PikePlaceMarket.jpg/320px-PikePlaceMarket.jpg")
                    ])
            ]);
        session.endDialog(msg);
    }
]);

bot.dialog('/carousel', [
    function (session) {
        session.send("You can pass a custom message to Prompts.choice() that will present the user with a carousel of cards to select from. Each card can even support multiple actions.");
        
        // Ask the user to select an item from a carousel.
        var msg = new builder.Message(session)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments([
                new builder.HeroCard(session)
                    .title("Space Needle")
                    .subtitle("The Space Needle is an observation tower in Seattle, Washington, a landmark of the Pacific Northwest, and an icon of Seattle.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
                            .tap(builder.CardAction.showImage(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/800px-Seattlenighttimequeenanne.jpg")),
                    ])
                    .buttons([
                        builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle", "Wikipedia"),
                        builder.CardAction.imBack(session, "select:100", "Select")
                    ]),
                new builder.HeroCard(session)
                    .title("Pikes Place Market")
                    .subtitle("Pike Place Market is a public market overlooking the Elliott Bay waterfront in Seattle, Washington, United States.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/PikePlaceMarket.jpg/320px-PikePlaceMarket.jpg")
                            .tap(builder.CardAction.showImage(session, "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/PikePlaceMarket.jpg/800px-PikePlaceMarket.jpg")),
                    ])
                    .buttons([
                        builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Pike_Place_Market", "Wikipedia"),
                        builder.CardAction.imBack(session, "select:101", "Select")
                    ]),
                new builder.HeroCard(session)
                    .title("EMP Museum")
                    .subtitle("EMP Musem is a leading-edge nonprofit museum, dedicated to the ideas and risk-taking that fuel contemporary popular culture.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Night_Exterior_EMP.jpg/320px-Night_Exterior_EMP.jpg")
                            .tap(builder.CardAction.showImage(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Night_Exterior_EMP.jpg/800px-Night_Exterior_EMP.jpg"))
                    ])
                    .buttons([
                        builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/EMP_Museum", "Wikipedia"),
                        builder.CardAction.imBack(session, "select:102", "Select")
                    ])
            ]);
        builder.Prompts.choice(session, msg, "select:100|select:101|select:102");
    },
    function (session, results) {
        var action, item;
        var kvPair = results.response.entity.split(':');
        switch (kvPair[0]) {
            case 'select':
                action = 'selected';
                break;
        }
        switch (kvPair[1]) {
            case '100':
                item = "the Space Needle";
                break;
            case '101':
                item = "Pikes Place Market";
                break;
            case '102':
                item = "the EMP Museum";
                break;
        }
        session.endDialog('You %s "%s"', action, item);
    }    
]);

bot.dialog('/receipt', [
    function (session) {
        session.send("You can send a receipts for facebook using Bot Builders ReceiptCard...");
        var msg = new builder.Message(session)
            .attachments([
                new builder.ReceiptCard(session)
                    .title("Recipient's Name")
                    .items([
                        builder.ReceiptItem.create(session, "$22.00", "EMP Museum").image(builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/a/a0/Night_Exterior_EMP.jpg")),
                        builder.ReceiptItem.create(session, "$22.00", "Space Needle").image(builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/7/7c/Seattlenighttimequeenanne.jpg"))
                    ])
                    .facts([
                        builder.Fact.create(session, "1234567898", "Order Number"),
                        builder.Fact.create(session, "VISA 4076", "Payment Method")
                    ])
                    .tax("$4.40")
                    .total("$48.40")
            ]);
        session.send(msg);

        session.send("Or using facebooks native attachment schema...");
        msg = new builder.Message(session)
            .sourceEvent({
                facebook: {
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "receipt",
                            recipient_name: "Stephane Crozatier",
                            order_number: "12345678902",
                            currency: "USD",
                            payment_method: "Visa 2345",        
                            order_url: "http://petersapparel.parseapp.com/order?order_id=123456",
                            timestamp: "1428444852", 
                            elements: [
                                {
                                    title: "Classic White T-Shirt",
                                    subtitle: "100% Soft and Luxurious Cotton",
                                    quantity: 2,
                                    price: 50,
                                    currency: "USD",
                                    image_url: "http://petersapparel.parseapp.com/img/whiteshirt.png"
                                },
                                {
                                    title: "Classic Gray T-Shirt",
                                    subtitle: "100% Soft and Luxurious Cotton",
                                    quantity: 1,
                                    price: 25,
                                    currency: "USD",
                                    image_url: "http://petersapparel.parseapp.com/img/grayshirt.png"
                                }
                            ],
                            address: {
                                street_1: "1 Hacker Way",
                                street_2: "",
                                city: "Menlo Park",
                                postal_code: "94025",
                                state: "CA",
                                country: "US"
                            },
                            summary: {
                                subtotal: 75.00,
                                shipping_cost: 4.95,
                                total_tax: 6.19,
                                total_cost: 56.14
                            },
                            adjustments: [
                                { name: "New Customer Discount", amount: 20 },
                                { name: "$10 Off Coupon", amount: 10 }
                            ]
                        }
                    }
                }
            });
        session.endDialog(msg);
    }
]);

bot.dialog('/actions', [
    function (session) { 
        session.send("Bots can register global actions, like the 'help' & 'goodbye' actions, that can respond to user input at any time. You can even bind actions to buttons on a card.");

        var msg = new builder.Message(session)
            .attachments([
                new builder.HeroCard(session)
                    .title("Space Needle")
                    .subtitle("The Space Needle is an observation tower in Seattle, Washington, a landmark of the Pacific Northwest, and an icon of Seattle.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
                    ])
                    .buttons([
                        builder.CardAction.dialogAction(session, "weather", "Seattle, WA", "Current Weather")
                    ])
            ]);
        session.send(msg);

        session.endDialog("The 'Current Weather' button on the card above can be pressed at any time regardless of where the user is in the conversation with the bot. The bot can even show the weather after the conversation has ended.");
    }
]);

// Create a dialog and bind it to a global action
bot.dialog('/businesses', [
    function (session, args, next) 
    {
//        if (session.userData.location) 
//        { 
//            builder.Prompts.text(session, "Is that a new city? Hang on, let me go check..."); 
//        } 
//        else 
//        {
            builder.Prompts.text(session, "Hello. I can tell you about any city " +
            "if you type it like 'businesses Atlanta, GA'.");
//        }
        //check to see if user is requesting a new location.
        if (session.userData.location) {
             next(); 
            }
    },
    
    
        
    function (session, results) {

        // capture location

        //Try to read in a string of "weather City, ST"
            var txt = session.message.text;
                            //convert "Weather" to "weather", then delete it
            txt = txt.toLowerCase().replace('businesses ', '');
                            //split City, State by ‘,’ and replace spaces with _ 
            var city = txt.split(',')[0].trim().replace(' ', '_');
                            //assign state variable to the back half of the string 
            var state = txt.split(',')[1].trim();
                 
                    //log City, ST to the console for debugging 
            console.log(city + ', ' + state);
                            //set user's global location to City, ST 
            
                            //set user's global location to City, ST 
            session.userData.location = (city + ', ' + state.toUpperCase());
            session.userData.cityName = (city);

        // End capture location


        var style = builder.ListStyle.list;
        builder.Prompts.choice(session, "Select a category.", "Arts & Entertainment|Beauty & Personal Care|Business & Professional Services|Community & Education|Financial|Health & Medicine|Restaurants", { listStyle: style });
    },
    function (session, results) {

        var txt2 = results.response.entity;
        console.log(txt2);
		session.userData.category = txt2;
        var path;
		var catNum;
		
		if (txt2 == "Arts & Entertainment") {
			catNum = 2;
            path = "arts-entertainment";

		} else if (txt2 == "Beauty & Personal Care") {
			catNum = 40;
            path = "beauty-personal-care";

		} else if (txt2 == "Business & Professional Services") {
			catNum = 54;
            path = "business-professional-services";

		} else if (txt2 == "Community & Education") {
			catNum = 276;
            path = "community-education";

		} else if (txt2 == "Financial") {
			catNum = 161;
            path = "financial";

		} else if (txt2 == "Health & Medicine") {
			catNum = 240;
            path = "health-medicine";

		} else if (txt2 == "Restaurants") {
			catNum = 279;
            path = "restaurants";
		}
		
		console.log(catNum);
        session.send("You chose '%s'", results.response.entity);
		//session.send("Your category number is '%s'", catNum);
        //builder.Prompts.confirm(session, "Simple yes/no questions are possible. Answer yes or no now.");

// Find Subcategories

        try 
        {           
            
// Begin HTTP Code

var arrCat = []; 
//session.userData.bizArray = arr;
                http.get("http://www.blocally.com/json/getNearbySubCategoriesURL.php?friendly_url_path=" + path, function (response) {
			//http.get("http://www.blocally.com/json/nearbyBusinessesBySubCat3.php?address=" + session.userData.cityName +"&sub_cat=277&radius=99", function (response) {
                    var d = '';
					var i;
                    response.on('data', function (chunk) { d += chunk; })
                    response.on('end', function () {
                        var e = JSON.parse(d);
						for (i = 0; i < e.data.length; i++) {  
							console.log(i + 1 + ":" + e.data[i].title); 
                        //    console.log("city is " + city); 
                        //    console.log("location is " + session.userData.location);   
                        //    console.log("cityName is " + session.userData.cityName);
							arrCat.push({ 
								"id": e.data[i].id, 
								"name": e.data[i].title,   
								"url": e.data[i].friendly_url_path  
								  
							});  
						} // ends for loop
						

						// added new code		
						 
						 // new for loop test
						 var a;
						 var cards = [];
						 
						 for (a = 0; a < 5;) {					
						
					
						    
        					var card = new builder.HeroCard(session)
									.title(""+ arrCat[a].name +"")
									.text("" + arrCat[a].url +"")
//									.images([
//										 builder.CardImage.create(session, "http://maps.googleapis.com/maps/api/staticmap?center="
//       +arr[a].lat+","+arr[a].lon+"&zoom=14&size=400x300&sensor=false")
//									])
                                    .images([
										 builder.CardImage.create(session, "http://docs.botframework.com/images/demo_bot_image.png")
									])
									.buttons([
										builder.CardAction.dialogAction(session, "businesslist", arrCat[a].id, "View Businesses")
									]);
									cards.push(card);

                            if (a == 4) {
                            var card = new builder.HeroCard(session)
									.title("Next 5 Categories")
								//	.text("" + arr[a].address + " in " + arr[a].city + ", "+ arr[a].state)
									.images([
										 builder.CardImage.create(session, "http://docs.botframework.com/images/demo_bot_image.png")
									])
									.buttons([
										//builder.CardAction.imBack(session, "select:102", "Next 5 >")
                                        builder.CardAction.dialogAction(session, "searchCat", "5", "Next 5 >")
								//		
									]);
									cards.push(card);

                        
							} // ends if 5 items have been shown
                            a++;
		 				 } // ends for loop
                   

                    
								session.send("We found the following " + arrCat.length +" categories.  Showing " + a + " out of " + arrCat.length + ".");
								
								var msg = new builder.Message(session)
									.textFormat(builder.TextFormat.xml)
									.attachmentLayout(builder.AttachmentLayout.carousel)
									.attachments(cards);
								session.send(msg);
								
						
        
	//	session.beginDialog('/menu');	
                    
								
// end new code							
                    }); // response on end code
			
                    
                   
        
                }) // end http code

// End HTTP Code



        } //End of try 
        catch (e) 
        { session.send("Whoops, that didn't match! Try again."); }
        session.endDialog();




// End Find Subcategories




    },
    function (session, results) {
        session.send("You chose '%s'", results.response ? 'yes' : 'no');
    //    builder.Prompts.time(session, "Prompts.time()\n\nThe framework can recognize a range of times expressed as natural language. Enter a time like 'Monday at 7am' and I'll show you the JSON we return.");
    }
    
]); //End of ‘/weather’ dialog waterfall 
bot.beginDialogAction('businesses', '/businesses');   // <-- no 'matches' option means this can only be triggered by a button.


// Create a dialog and bind it to a global action
bot.dialog('/subcategories', [
    function (session, args) {
    //    session.endDialog("The weather in %s is 71 degrees and raining.", args.data);
         // new for loop test
						  // new for loop test
    var num = args.data;
	console.log("name 0 is " + session.userData.bizArray[0].name); 
    console.log("last number used " + num);
    session.userData.count = parseInt(num)+5;
    var bizAmount = session.userData.bizArray.length;
    var howManyLeft = parseInt(bizAmount) - parseInt(num);
     // new for loop test

     if (howManyLeft < 5) {
         nextFiveLabel = "Next " + howManyLeft + " >";
     } else {
         nextFiveLabel = "Next 5 >";
     }
						 var a;
						 var cards = [];
						 
						 for (a = num; a < session.userData.count;) {					
						
						
						    
        					var card = new builder.HeroCard(session)
									.title(""+ session.userData.bizArray[a].name +"")
									.text("" + session.userData.bizArray[a].address + " in " + session.userData.bizArray[a].city + ", "+ session.userData.bizArray[a].state)
//									.images([
//										 builder.CardImage.create(session, "http://maps.googleapis.com/maps/api/staticmap?center="
//        +session.userData.bizArray[a].lat+","+session.userData.bizArray[a].lon+"&zoom=14&size=400x300&sensor=false")
//									])
                                    .images([
										 builder.CardImage.create(session, "https://maps.googleapis.com/maps/api/staticmap?center=&zoom=13&size=400x300&maptype=roadmap&markers=color:red%7Clabel:S%7C"+session.userData.bizArray[a].lat+","+session.userData.bizArray[a].lon+"")
									])
									.buttons([
										builder.CardAction.openUrl(session, "http://m.blocally.com/businessDetails.php?id="+ session.userData.bizArray[a].id, "More Details"),
										builder.CardAction.imBack(session, "select:102", "Track Purchase")
									]);
									cards.push(card);

                            if (a == (parseInt(session.userData.count)-1)) {
                            var card = new builder.HeroCard(session)
									.title("Next 5 Businesses")
								//	.text("" + arr[a].address + " in " + arr[a].city + ", "+ arr[a].state)
									.images([
										 builder.CardImage.create(session, "http://docs.botframework.com/images/demo_bot_image.png")
									])

                                    .buttons([
										//builder.CardAction.imBack(session, "select:102", "Next 5 >")
                                        builder.CardAction.dialogAction(session, "search", "" + session.userData.count +"", "" + nextFiveLabel +"")
								//		
									]);
									cards.push(card);

                        
							} // ends if 5 items have been shown
                            a++;
		 				 } // ends for loop

                          session.send("We found the following " +  session.userData.bizArray.length +" businesses.  Showing " + a + " out of " +  session.userData.bizArray.length + ".");
								
								var msg = new builder.Message(session)
									.textFormat(builder.TextFormat.xml)
									.attachmentLayout(builder.AttachmentLayout.carousel)
									.attachments(cards);
								session.send(msg);


    }
]);
bot.beginDialogAction('subcategories', '/subcategories'); // <-- no 'matches' option means this can only be triggered by a button.



bot.dialog('/businesslist', [
	
	
	
	function (session, args)      //WeatherUnderground API 
    {

    //var subCatID = 41;	
	var subCatID = args.data;
	session.userData.subcatid = subCatID;
		
        try 
        {           
            
// Begin HTTP Code

var arrBiz = []; 
session.userData.bizArray = arrBiz;
console.log("The location is " + session.userData.location); 
console.log("The Session Sub Cat ID is " + session.userData.subcatid); 
console.log("The Subcatid is " + subCatID); 

                http.get("http://www.blocally.com/json/botNearbyBusinessList.php?address="+ session.userData.location +"&sub_cat="+ session.userData.subcatid +"&radius=99", function (response) {
			//http.get("http://www.blocally.com/json/nearbyBusinessesBySubCat3.php?address=" + session.userData.cityName +"&sub_cat=277&radius=99", function (response) {
                    var d = '';
					var i;
                    response.on('data', function (chunk) { d += chunk; })
                    response.on('end', function () {
                        var e = JSON.parse(d);
						for (i = 0; i < e.listings.length; i++) { 
                        //var g = JSON.parse(f);
						//for (h = 0; h < g.listings.length; h++) {  
							console.log(i + 1 + ":" + e.listings[i].title); 
                            console.log("This is a test "); 
                        //    console.log("location is " + session.userData.location);   
                        //    console.log("cityName is " + session.userData.cityName);
							arrBiz.push({ 
								"id": e.listings[i].id, 
								"name": e.listings[i].title,    
                                "address": e.listings[i].listing_address1,
                                "city": e.listings[i].location_text_1,
                                "state": e.listings[i].StateAbrev,
                                "description": e.listings[i].description_short
							});  
						} // ends for loop
						

						// added new code		
						 
						 // new for loop test
						 var x;
						 var cards = [];
						 
						 for (x = 0; x < 5;) {					
						
					
						    
        					var card = new builder.HeroCard(session)
									.title(""+ arrBiz[x].name +"")
									.text("" + arrBiz[x].address +" " + arrBiz[x].city +" " + arrBiz[x].state +"")
									.images([
										 builder.CardImage.create(session, "http://maps.googleapis.com/maps/api/staticmap?center="
       +arrBiz[x].lat+","+arrBiz[x].lon+"&zoom=14&size=400x300&sensor=false")
									])
                                    .images([
										 builder.CardImage.create(session, "https://maps.googleapis.com/maps/api/staticmap?center=&zoom=13&size=400x300&maptype=roadmap&markers=color:red%7Clabel:S%7C"+arrBiz[x].lat+","+arrBiz[x].lon+"")
                                    //    builder.CardImage.create(session, "https://maps.googleapis.com/maps/api/staticmap?center=&zoom=13&size=400x300&maptype=roadmap&markers=color:red%7Clabel:S%7C")
									])
									.buttons([
										builder.CardAction.openUrl(session, "http://m.blocally.com/businessDetails.php?id="+arrBiz[x].id, "More Details"),
										builder.CardAction.imBack(session, "select:102", "Track Purchase")
									]);
									cards.push(card);

                            if (x == 4) {
                            var card = new builder.HeroCard(session)
									.title("Next 5 Businesses")
								//	.text("" + arr[a].address + " in " + arr[a].city + ", "+ arr[a].state)
									.images([
										 builder.CardImage.create(session, "http://docs.botframework.com/images/demo_bot_image.png")
									])
									.buttons([
										//builder.CardAction.imBack(session, "select:102", "Next 5 >")
                                        builder.CardAction.dialogAction(session, "search", "5", "Next 5 >")
								//		
									]);
									cards.push(card);

                        
							} // ends if 5 items have been shown
                            x++;
		 				 } // ends for loop
                   

                    
								session.send("We found the following " + arrBiz.length +" businesses.  Showing " + x + " out of " + arrBiz.length + ".");
								
								var msg = new builder.Message(session)
									.textFormat(builder.TextFormat.xml)
									.attachmentLayout(builder.AttachmentLayout.carousel)
									.attachments(cards);
								session.send(msg);
								
						
        
	//	session.beginDialog('/menu');	
                    
								
// end new code							
                    }); // response on end code
			
                    
                   
        
                }) // end http code

// End HTTP Code



        } //End of try 
        catch (e) 
        { session.send("Whoops, that didn't match! Try again."); }
        session.endDialog();
    } //End of WeatherUnderground API function
	
]);
bot.beginDialogAction('businesslist', '/businesslist'); // <-- no 'matches' option means this can only be triggered by a button.


// Create a dialog and bind it to a global action
bot.dialog('/search', [
    function (session, args) {
    //    session.endDialog("The weather in %s is 71 degrees and raining.", args.data);
         // new for loop test
						  // new for loop test
    var num = args.data;
	//console.log("name 0 is " + session.userData.bizArray[0].name); 
    console.log("last number used " + num);
    //session.userData.count = parseInt(num)+5;
    var count = parseInt(num)+5;
    var bizAmount = session.userData.bizArray.length;
    var howManyLeft = parseInt(bizAmount) - parseInt(num);
     // new for loop test

     if (howManyLeft < 5) {
         nextFiveLabel = "Next " + howManyLeft + " >";
     } else {
         nextFiveLabel = "Next 5 >";
     }
						 var a;
						 var cards = [];
						 
						 for (a = num; a < count;) {					
						
						
						    
        					var card = new builder.HeroCard(session)
									.title(""+ session.userData.bizArray[a].name +"")
									.text("" + session.userData.bizArray[a].address + " in " + session.userData.bizArray[a].city + ", "+ session.userData.bizArray[a].state)
//									.images([
//										 builder.CardImage.create(session, "http://maps.googleapis.com/maps/api/staticmap?center="
//        +session.userData.bizArray[a].lat+","+session.userData.bizArray[a].lon+"&zoom=14&size=400x300&sensor=false")
//									])
                                    .images([
										 builder.CardImage.create(session, "https://maps.googleapis.com/maps/api/staticmap?center=&zoom=13&size=400x300&maptype=roadmap&markers=color:red%7Clabel:S%7C"+session.userData.bizArray[a].lat+","+session.userData.bizArray[a].lon+"")
									])
									.buttons([
										builder.CardAction.openUrl(session, "http://m.blocally.com/businessDetails.php?id="+ session.userData.bizArray[a].id, "More Details"),
										builder.CardAction.imBack(session, "select:102", "Track Purchase")
									]);
									cards.push(card);

                            if (a == (parseInt(count)-1)) {
                            var card = new builder.HeroCard(session)
									.title("Next 5 Businesses")
								//	.text("" + arr[a].address + " in " + arr[a].city + ", "+ arr[a].state)
									.images([
										 builder.CardImage.create(session, "http://docs.botframework.com/images/demo_bot_image.png")
									])

                                    .buttons([
										//builder.CardAction.imBack(session, "select:102", "Next 5 >")
                                        builder.CardAction.dialogAction(session, "search", howManyLeft, "" + nextFiveLabel +"")
								//		
									]);
									cards.push(card);

                        
							} // ends if 5 items have been shown
                            a++;
		 				 } // ends for loop

                          session.send("We found the following " +  session.userData.bizArray.length +" businesses.  Showing " + a + " out of " +  session.userData.bizArray.length + ".");
								
								var msg = new builder.Message(session)
									.textFormat(builder.TextFormat.xml)
									.attachmentLayout(builder.AttachmentLayout.carousel)
									.attachments(cards);
								session.send(msg);


    }
]);
bot.beginDialogAction('search', '/search'); // <-- no 'matches' option means this can only be triggered by a button.
