const path = require('path')
const express = require('express');
const fs = require('fs').promises;
const Storage = require('node-storage')
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');



const crypto = require('crypto');

// Helper function to generate a unique verification token
function generateVerificationToken() {
    return crypto.randomBytes(16).toString('hex');
}
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) {
        console.log('No token provided');
        return res.sendStatus(401);
    }

    jwt.verify(token, 'your_secret_key', (err, user) => {
        if (err) {
            console.log('Token verification failed:', err);
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

function initializeAdminUser() {
    let users = storeUsers.get('users') || [];

    if (!users.some(user => user.email === 'admin@uwo.ca')) {
        const adminPassword = 'admin';
        const hashedAdminPassword = bcrypt.hashSync(adminPassword, 10);

        users.push({
            email: 'admin@uwo.ca',
            hashedPassword: hashedAdminPassword,
            nickname: 'Admin',
            isVerified: true,
            admin: true,
            isDeactivated: false
            
        });

        storeUsers.put('users', users);
    }
}



const storeLists = new Storage(path.join(__dirname,'storeLists.json'));
const storeUsers = new Storage(path.join(__dirname,'users.json'));  
const usersLists = new Storage(path.join(__dirname,'storeLists.json'));
const storePolicies = new Storage(path.join(__dirname, 'policies.json'));



const app = express();
const port = 8080;

// Routers initialization
const infoRouter = express.Router();
const powersRouter = express.Router();
const listRouter = express.Router();
const userRouter = express.Router();
const userListRouter = express.Router();


// File paths
const infoFilePath = 'server\\superhero_info.json';
const powersFilePath = 'server\\superhero_powers.json';

let superhero_info = [];
let superhero_powers = [];
// let superhero_lists = [];

// Load superhero information from the file
async function loadSuperheroData() {
    try {
        const data = await fs.readFile(infoFilePath, 'utf8');
        superhero_info = JSON.parse(data);
    } catch (error) {
        console.error('Error reading superhero info file:', error);
    }
}

// Load superhero powers information from the file
async function loadSuperheroPowersData() {
    try {
        const data = await fs.readFile(powersFilePath, 'utf8');
        superhero_powers = JSON.parse(data);
    } catch (error) {
        console.error('Error reading superhero powers file:', error);
    }
}

loadSuperheroData();
loadSuperheroPowersData();

// Middlewares
app.use(express.static(path.join(__dirname,'../static')));
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${req.method} request for ${req.url}`);
    next();
});
app.use(cors());
app.use(cors({
  exposedHeaders: ['Authorization'],
}));

let superhero_lists = storeLists.get('superhero_lists') || [];


// Routes for superhero_info
infoRouter.route('/')
    .get((req, res) => res.send(superhero_info));

infoRouter.route('/publishers')
    .get((req, res) => {
        let publishers = [];
        superhero_info.forEach(hero => {
            if (!publishers.includes(hero.Publisher)) {
                publishers.push(hero.Publisher);
            }
        });
        res.send(publishers);
    });

infoRouter.route('/:id(\\d+)')
    .get((req, res) => {
        const superhero = superhero_info.find(s => s.id === parseInt(req.params.id));
        superhero ? res.send(superhero) : res.status(404).send(`Superhero ${req.params.id} was not found!`);
    });
infoRouter.route('/allNames')
    .get((req, res) => {
        // Assuming superhero_info is an array with superhero objects
        const names = superhero_info.map(s => s.name);
        res.send(names);
    });
infoRouter.route('/getIDs')
    .post((req, res) => {
        const { names } = req.body;
        const ids = superhero_info
            .filter(hero => names.includes(hero.name))
            .map(hero => hero.id);
        res.json(ids);
    });



// Routes for superhero_powers
powersRouter.route('/')
    .get((req, res) => res.send(superhero_powers));

powersRouter.route('/:id(\\d+)')
    .get((req, res) => {
        const superheroId = parseInt(req.params.id);
        const superhero = superhero_info.find(s => s.id === superheroId);
        if (superhero) {
            const powers = superhero_powers.find(p => p.hero_names === superhero.name);
            if (powers) {
                // Filter out only the powers that are true
                const truePowers = Object.fromEntries(Object.entries(powers).filter(([power, hasPower]) => hasPower === "True" && power !== "hero_names"));
                res.send(truePowers);
            } else {
                res.status(404).send(`Powers for Superhero ${superhero.name} not found`);
            }
        } else {
            res.status(404).send(`Superhero ${superheroId} not found`);
        }
    });

powersRouter.route('/all')
    .get((req, res) => {
        const allPowers = new Set();
        superhero_powers.forEach(heroPowers => {
            Object.keys(heroPowers).forEach(power => {
                if (power !== "hero_names") {
                    allPowers.add(power);
                }
            });
        });
        res.send(Array.from(allPowers));
    });

powersRouter.route('/byPower')
    .get((req, res) => {
        const powerToSearch = req.query.power;

        const heroesWithPower = superhero_powers
            .filter(heroPower => String(heroPower[powerToSearch]).toLowerCase() === "true")
            .map(heroPower => superhero_info.find(hero => hero.name === heroPower.hero_names))
            .filter(hero => hero !== undefined); // Filter out any undefined heroes

        if (heroesWithPower.length > 0) {
            res.send(heroesWithPower);
        } else {
            res.status(404).send(`No heroes found with power: ${powerToSearch}`);
        }
    });

infoRouter.route('/match')
    .get((req, res) => {
        const { field, pattern } = req.query;
        const n = req.query.n ? Math.min(parseInt(req.query.n, 10), 999) : superhero_info.length; // Limit the max number of results to 999

        // const n = parseInt(req.query.n, 10) || superhero_info.length;

        // Check if the required parameters are provided
        if (!field || !pattern) {
            return res.status(400).send('Missing required parameters');
        }

        // Filter superheroes based on the given field and pattern
        const matchedSuperheroes = superhero_info.filter(hero => {
            if (typeof hero[field] === 'string') {
                return hero[field].toLowerCase().startsWith(pattern.toLowerCase());
            } else if (typeof hero[field] === 'number') {
                return hero[field] === parseInt(pattern, 10);
            }
            return false;
        }).slice(0, n);
        
        res.send(matchedSuperheroes);
    });


listRouter.route('/')
    .get((req, res) => {
        res.send(superhero_lists);
    })
    .post((req, res) => {
        const newLists = req.body;
        if (!Array.isArray(newLists)) {
            return res.status(400).send('Expected an array of lists');
        }
        let errors = [];
        newLists.forEach(newList => {
            if (superhero_lists.some(list => list.name === newList.name)) {
                errors.push(`List name "${newList.name}" already exists.`);
            } else {
                superhero_lists.push({ name: newList.name, ID: newList.ID || [] });
            }
        });
        if (errors.length) {
            res.status(400).send(errors.join(' '));
        } else {
            try {
                storeLists.put('superhero_lists', superhero_lists);
            } catch (error) {
                console.error('Error saving to storage:', error);
                // Handle the error appropriately
            }
                        
            res.status(201).send('Lists added successfully.');
        }
    });

listRouter.route('/listNames')
    .get((req, res) => {
        const listNames = superhero_lists.map(list => list.name);
        res.send(listNames);
    });

listRouter.route('/:name')
    .put((req, res) => {
        const listName = req.params.name;
        const newIDs = req.body.ID;
        const list = superhero_lists.find(list => list.name === listName);
        
        if (list) {
            const updatedIDs = new Set([...list.ID, ...newIDs]);
            list.ID = Array.from(updatedIDs);
            try {
                storeLists.put('superhero_lists', superhero_lists);
            } catch (error) {
                console.error('Error saving to storage:', error);
                // Handle the error appropriately
            }
                       
            res.send(list);
        } else {
            res.status(400).send('List name does not exist');
        }
    })
    .get((req, res) => {
        const listName = req.params.name;
        const list = superhero_lists.find(list => list.name === listName);
        list ? res.send(list.ID) : res.status(404).send('List not found');
    })
    .delete((req, res) => {
        const listName = req.params.name;
        const listIndex = superhero_lists.findIndex(list => list.name === listName);
        if (listIndex !== -1) {
            superhero_lists.splice(listIndex, 1);
            try {
                storeLists.put('superhero_lists', superhero_lists);
            } catch (error) {
                console.error('Error saving to storage:', error);
                // Handle the error appropriately
            }
                       
            res.send({ message: `List ${listName} deleted successfully!` });
        } else {
            res.status(404).send('List not found');
        }
    });

listRouter.route('/:name/update')
    .put((req, res) => {
        const listName = req.params.name;
        const { ID } = req.body;
        const listIndex = superhero_lists.findIndex(list => list.name === listName);
        
        if (listIndex > -1) {
            superhero_lists[listIndex].ID = ID;
            try {
                storeLists.put('superhero_lists', superhero_lists);
            } catch (error) {
                console.error('Error saving to storage:', error);
                // Handle the error appropriately
            }
                      
            res.status(200).send(superhero_lists[listIndex]);
        } else {
            res.status(404).send('List not found');
        }
    });

listRouter.route('/:name/info')
    .get((req, res) => {
        const listName = req.params.name;
        const list = superhero_lists.find(list => list.name === listName);
        if (!list) {
            return res.status(404).send('List not found');
        }
        const detailedSuperheroes = list.ID.map(heroID => {
            const superheroInfo = superhero_info.find(s => s.id === heroID);
            const superheroPowers = superhero_powers.find(p => p.hero_names === superheroInfo.name);
            return { ...superheroInfo, powers: superheroPowers };
        });
        res.send(detailedSuperheroes);
    });


//LAB4 


userRouter.post('/register', async (req, res) => {
    try {
        const { email, password, nickname } = req.body;

        // Check if this is the admin user
        const isAdmin = email === 'admin@uwo.ca';

        // Use a default password for the admin user
        const finalPassword = isAdmin ? 'admin' : password;

        const hashedPassword = await bcrypt.hash(finalPassword, 10);

        let users = storeUsers.get('users') || [];

        if (users.some(user => user.email === email)) {
            return res.status(400).json({message: 'User already exists'});
        }

        const verificationToken = generateVerificationToken();

        users.push({ 
            email, 
            hashedPassword, 
            nickname, 
            isVerified: false, 
            verificationToken,
            admin: isAdmin,
            isDeactivated: false
        });

        storeUsers.put('users', users);
            
        res.status(201).json({ message: 'User created successfully. Please verify your email.', verificationToken });
    } catch (error) {
        res.status(500).json('Error in user registration');
    }
});


userRouter.put('/updatePassword', async (req, res) => {
    try {
        const { email, oldPassword, newPassword } = req.body;

        // Retrieve existing users
        let users = storeUsers.get('users') || [];

        // Find the user
        const user = users.find(user => user.email === email);

        if (!user) {
            return res.status(404).json({message:'User not found'});
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(401).json({message:'Email not verified'});
        }

        // Verify old password
        const isMatch = await bcrypt.compare(oldPassword, user.hashedPassword);
        if (!isMatch) {
            return res.status(401).json({message:'Wrong old password'});
        }

        // Update user's password
        user.hashedPassword = await bcrypt.hash(newPassword, 10);

        // Store updated users array
        storeUsers.put('users', users);

        res.json({message:'Password updated successfully'});
    } catch (error) {
        console.error('Error in updating password:', error); // Log any errors
        res.status(500).json({message:'Error in updating password'});
    }

});


userRouter.get('/getUserByEmail', async (req, res) => {
    try {
        const { email } = req.query;  // Get email from query parameters

        // Retrieve existing users
        const users = storeUsers.get('users') || [];

        // Find the user by email
        const user = users.find(user => user.email === email);

        // If user is found, return user data
        if (user) {
            // Return user details except the hashed password
            const { hashedPassword, ...userDetails } = user;
            return res.status(200).send(userDetails);
        } else {
            // User not found
            return res.status(404).json({message:'User not found'});
        }
    } catch (error) {
        res.status(500).json({message:'Error during user retrieval'});
    }
});

// New endpoint for verifying email
userRouter.get('/verifyEmail', async (req, res) => {
    const { token } = req.query;

    // Retrieve existing users
    let users = storeUsers.get('users') || [];

    // Find user with the given token
    const userIndex = users.findIndex(user => user.verificationToken === token);

    if (userIndex === -1) {
        return res.status(404).json({message:'Invalid or expired verification link'});
    }

    // Set isVerified to true
    users[userIndex].isVerified = true;

    // Remove the verification token as it's no longer needed
    delete users[userIndex].verificationToken;

    // Store updated users array
    storeUsers.put('users', users);

    res.json({message:'Email verified successfully. You can now log in.'});
});

userRouter.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Retrieve existing users
        let users = storeUsers.get('users') || [];

        // Find user by email
        const user = users.find(user => user.email === email);

        if (!user) {
            return res.status(404).json({message:'User not found'});
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(401).json({message:'Email not verified'});
        }

        if (user.isDeactivated) {
            return res.status(403).json({ message: 'Account is deactivated. Please contact admin at admin@uwo.ca' });
        }
    
        // Verify password
        const isMatch = await bcrypt.compare(password, user.hashedPassword);
        if (!isMatch) {
            return res.status(401).json({message: 'Invalid password'});
        }
        if (isMatch) {
            // res.json({ message: 'Login successful', isAdmin: user.admin });
            const token = jwt.sign({ 
                email: user.email, 
                nickname: user.nickname, 
                admin: user.admin}, 'your_secret_key', { expiresIn: '1h' });
            res.json({ message: 'Login successful', token, isAdmin: user.admin });

        }
        // res.send('Login successful');}

    } catch (error) {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

function stringDifference(str1, str2) {
    let diff = 0;
    let i = 0, j = 0;

    while (i < str1.length && j < str2.length) {
        if (str1[i] !== str2[j]) {
            diff++;
            // Check next character in longer string
            if (str1.length > str2.length) {
                i++;
            } else if (str1.length < str2.length) {
                j++;
            } else {
                i++;
                j++;
            }
        } else {
            i++;
            j++;
        }
    }

    // Add remaining characters from the longer string
    diff += Math.max(str1.length - i, str2.length - j);

    return diff;
}


infoRouter.route('/search')

    .get((req, res) => {
        const { name, Race, Publisher } = req.query;
        let Power = req.query['Power '] || req.query['Power'];

        Power = Power ? decodeURIComponent(Power).trim().toLowerCase() : null;
        const queryName = name ? decodeURIComponent(name).trim().toLowerCase() : null;
        const queryRace = Race ? decodeURIComponent(Race).trim().toLowerCase() : null;
        const queryPublisher = Publisher ? decodeURIComponent(Publisher).trim().toLowerCase() : null;

        let results = superhero_info;

        if (queryName) {
            results = results.filter(hero => {
                const heroNameLower = hero.name.toLowerCase().trim();
                return heroNameLower === queryName || stringDifference(heroNameLower, queryName) <= 2;
            });
        }


        if (queryRace) {
            results = results.filter(hero => hero.Race && hero.Race.toLowerCase().trim().startsWith(queryRace));
        }

        if (queryPublisher) {
            results = results.filter(hero => hero.Publisher && hero.Publisher.toLowerCase().trim().startsWith(queryPublisher));
        }

        if (Power) {
            results = results.filter(hero => {
                // Trim and lowercase the hero name for accurate matching
                const heroNameLower = hero.name.toLowerCase().trim();
                const heroPowers = superhero_powers.find(p => p.hero_names.toLowerCase().trim() === heroNameLower);
                // Check for the power, making the comparison case-insensitive
                return heroPowers && Object.entries(heroPowers).some(([key, value]) => 
                    key.toLowerCase().trim() === Power && String(value).toLowerCase() === "true");
            });
        }

        // Return only name and publisher of each hero
        results = results.map(hero => ({ name: hero.name.trim(), Publisher: hero.Publisher.trim() }));

        res.json(results);
    });

infoRouter.route('/details/:name')
    .get((req, res) => {
        const superheroName = req.params.name;
        const superhero = superhero_info.find(s => s.name.toLowerCase() === superheroName.toLowerCase());
        
        if (!superhero) {
            return res.status(404).json({message: 'Superhero not found'});
        }

        // Exclude name and Publisher from the superhero details
        const { name, Publisher, ...details } = superhero;

        // Find the superhero's powers marked as True
        const powers = superhero_powers.find(p => p.hero_names === superheroName);
        const truePowers = powers ? Object.fromEntries(Object.entries(powers).filter(([power, hasPower]) => hasPower === "True" && power !== "hero_names")) : {};

        res.json({ details, powers: truePowers });
    });



    function getUserDetailsByEmail(email) {
        const users = storeUsers.get('users') || [];
        return users.find(user => user.email === email);
    }
    
    // Function to calculate average rating (placeholder implementation)
    function calculateAverageRating(heroIDs) {
        // Placeholder: Replace with actual logic to calculate average rating
        return heroIDs.length ? 4.5 : 0; // Example rating
    }
    
    userListRouter.route('/')
        .get((req, res) => {
            // Sort lists by last-modified date
            const sortedLists = superhero_lists.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    
            // Map to required structure
            const listsToShow = sortedLists.map(list => ({
                name: list.name,
                creatorNickname: list.creatorNickname,
                numberOfHeroes: list.ID.length,
                averageRating: calculateAverageRating(list.ID),
                lastModified: list.lastModified,
                isPublic: list.isPublic
            }));
    
            res.send(listsToShow);
        })
        userListRouter.post('/', authenticateToken, (req, res) => {
            const { name, ID, isPublic } = req.body;
        
            if (!req.user) {
                return res.status(403).send('User not authenticated');
            }
        
            const userEmail = req.user.email; // Email of the logged-in user
        
            // Check if a list with the same name already exists for the same user
            const existingList = superhero_lists.find(list => list.name === name && list.createdBy === userEmail);
        
            if (existingList) {
                return res.status(400).send('A list with the same name already exists.');
            }
        
            const newList = {
                name,
                ID: ID || [],
                createdBy: userEmail,
                creatorNickname: req.user.nickname, // Assuming nickname is also available in req.user
                lastModified: new Date().toISOString(),
                isPublic,
                reviews: [] 
            };
        
            superhero_lists.push(newList);
            storeLists.put('superhero_lists', superhero_lists);
        
            res.status(201).send('List created successfully.');
        });
    
        userListRouter.get('/:listName/authDetails', authenticateToken, (req, res) => {
            const { listName } = req.params;
            const userEmail = req.user.email; // Email of the authenticated user
            const superhero_lists = storeLists.get('superhero_lists') || [];
            
            const list = superhero_lists.find(l => l.name === listName && l.createdBy === userEmail);
            
            if (!list) {
                return res.status(404).send('List not found or not authorized to access this list');
            }
        
            const listDetails = list.ID.map(heroId => {
                const superhero = superhero_info.find(s => s.id === heroId);
                if (!superhero) return null;
        
                const powers = superhero_powers.find(p => p.hero_names === superhero.name);
                const truePowers = powers ? Object.fromEntries(Object.entries(powers).filter(([_, hasPower]) => hasPower === "True")) : {};
        
                return { ...superhero, powers: truePowers };
            }).filter(detail => detail !== null);
            if (!listDetails){
                return res.status(404).send('List not found or not authorized to access this list');
            }


        
            res.json({ listName: list.name, details: listDetails });
        });
        
    userListRouter.get('/:listName/details', (req, res) => {
    const { listName } = req.params;
    const list = superhero_lists.find(l => l.name === listName);

    if (!list) {
        return res.status(404).send('List not found');
    }

    // Get details for each superhero in the list
    const listDetails = list.ID.map(heroId => {
        const superhero = superhero_info.find(s => s.id === heroId);
        if (!superhero) return null; // or handle this case as you see fit

        const powers = superhero_powers.find(p => p.hero_names === superhero.name);
        const truePowers = powers ? Object.fromEntries(Object.entries(powers).filter(([_, hasPower]) => hasPower === "True")) : {};

        return { ...superhero, powers: truePowers };
    }).filter(detail => detail !== null); // Filter out any null values

    res.json({ listName: list.name, details: listDetails });
});

userListRouter.get('/mylists', authenticateToken, (req, res) => {
    // Extract email from the authenticated user details
    const userEmail = req.user.email;

    // Filter lists to include only those created by the authenticated user
    const userLists = superhero_lists.filter(list => list.createdBy === userEmail);

    // Respond with the user's lists
    res.json(userLists);

    if (userLists.length === 0) {
        return res.status(404).json({ message: 'No lists found for this user.' });
    }
    

});

// In userListRouter

userListRouter.put('/updateList', authenticateToken, async (req, res) => {
    const { listName, newIDs } = req.body; // Assuming newIDs is an array of superhero IDs
    const userEmail = req.user.email;

    const list = superhero_lists.find(list => list.name === listName && list.createdBy === userEmail);
    if (!list) {
        return res.status(404).json({ message: 'List not found or unauthorized access' });
    }

    // Update the list with new superhero IDs
    list.ID = [...new Set([...list.ID, ...newIDs])]; // Remove duplicates if any

    try {
        list.numberOfHeroes = list.ID.length;

        storeLists.put('superhero_lists', superhero_lists);
        res.json({ message: 'List updated successfully', list });
        

    } catch (error) {
        console.error('Error updating list:', error);
        res.status(500).json({ message: 'Error updating list' });
    }
});

userListRouter.put('/updatePublicStatus', authenticateToken, (req, res) => {
    const { listName, isPublic } = req.body;
    const userEmail = req.user.email;
    const listIndex = superhero_lists.findIndex(list => list.name === listName && list.createdBy === userEmail);

    if (listIndex >= 0) {
        superhero_lists[listIndex].isPublic = isPublic;
        storeLists.put('superhero_lists', superhero_lists);
        res.send({ message: `List ${listName} public status updated to ${isPublic}` });
    } else {
        res.status(404).send('List not found or not authorized to modify this list');
    }
});

userListRouter.delete('/:listName', authenticateToken, (req, res) => {
    const { listName } = req.params;
    const userEmail = req.user.email;

    const listIndex = superhero_lists.findIndex(list => list.name === listName && list.createdBy === userEmail);

    if (listIndex === -1) {
        return res.status(404).send('List not found or not authorized to delete this list');
    }

    superhero_lists.splice(listIndex, 1);

    try {
        storeLists.put('superhero_lists', superhero_lists);
        res.send({ message: `List ${listName} deleted successfully` });
    } catch (error) {
        console.error('Error deleting list:', error);
        res.status(500).send('Error deleting list');
    }
});


const listReviews = new Storage(path.join(__dirname, 'listReviews.json'));

userListRouter.post('/:listName/reviews', authenticateToken, (req, res) => {
    const { listName } = req.params;
    const { description, rating, comment } = req.body;
    const userEmail = req.user.email;

    // Check for valid rating
    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).send('Rating must be between 1 and 5.');
    }

    // Find the list
    const list = superhero_lists.find(list => list.name === listName);
    if (!list) {
        return res.status(404).send('List not found');
    }
 

    // Find existing review by the user
    const existingReviewIndex = list.reviews.findIndex(review => review.userEmail === userEmail);

    if (existingReviewIndex >= 0) {
        // Update existing review
        list.reviews[existingReviewIndex].description = description;
        list.reviews[existingReviewIndex].rating = rating;
        list.reviews[existingReviewIndex].comment = comment;
        list.reviews[existingReviewIndex].createdAt = new Date().toISOString();
    } else {
        // Add a new review
        const newReview = {
            id: uuidv4(), 
            userEmail,
            description,
            rating,
            comment,
            visible: true,
            createdAt: new Date().toISOString()
            
        };
        list.reviews.push(newReview);
    }

    // Update the list in the storage
    storeLists.put('superhero_lists', superhero_lists);

    res.status(201).send('Review added/updated successfully.');
});



userRouter.get('/nonAdminUsers', (req, res) => {
    let users = storeUsers.get('users') || [];
    // Filter out only non-admin users
    const nonAdminUsers = users.filter(user => !user.admin).map(({email}) => email);
    
    res.json(nonAdminUsers);
});




const isAdminUser = (email) => {
    const users = storeUsers.get('users') || [];
    const user = users.find(user => user.email === email);
    return user && user.admin;
};



// Endpoint to grant admin privileges
userRouter.put('/grantAdmin', authenticateToken, async (req, res) => {
    const adminEmail = req.user.email;

    // Check if the requester is an admin
    if (!isAdminUser(adminEmail)) {
        return res.status(403).json({ message: 'Only admins can perform this action' });
    }

    const { userEmail } = req.body;

    let users = storeUsers.get('users') || [];
    const userIndex = users.findIndex(user => user.email === userEmail);

    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
    }

    users[userIndex].admin = true; // Grant admin privileges
    storeUsers.put('users', users);

    res.json({ message: `Admin privileges granted to ${userEmail}` });
});

   





// Endpoint to hide a review
userListRouter.put('/:listName/reviews/hide', authenticateToken, async (req, res) => {
    const { listName, id } = req.body; // Assuming each review has a unique ID
    const adminEmail = req.user.email;

    if (!isAdminUser(adminEmail)) {
        return res.status(403).json({ message: 'Only admins can perform this action' });
    }

    const list = superhero_lists.find(list => list.name === listName);
    if (!list) {
        return res.status(404).json({ message: 'List not found' });
    }

    const reviewIndex = list.reviews.findIndex(review => review.id === id); // Assuming reviews have an 'id' property
    if (reviewIndex === -1) {
        return res.status(404).json({ message: 'Review not found' });
    }

    list.reviews[reviewIndex].visible = false; // Hide the review
    storeLists.put('superhero_lists', superhero_lists);

    res.json({ message: 'Review hidden successfully' });
});

// Endpoint to unhide a review
userListRouter.put('/:listName/reviews/unhide', authenticateToken, async (req, res) => {
    const { listName, id } = req.body;
    const adminEmail = req.user.email;

    if (!isAdminUser(adminEmail)) {
        return res.status(403).json({ message: 'Only admins can perform this action' });
    }

    const list = superhero_lists.find(list => list.name === listName);
    if (!list) {
        return res.status(404).json({ message: 'List not found' });
    }

    const reviewIndex = list.reviews.findIndex(review => review.id === id);
    if (reviewIndex === -1) {
        return res.status(404).json({ message: 'Review not found' });
    }

    list.reviews[reviewIndex].visible = true; // Unhide the review
    storeLists.put('superhero_lists', superhero_lists);

    res.json({ message: 'Review visibility restored' });
});




userRouter.put('/deactivateUser', authenticateToken, async (req, res) => {
    if (!isAdminUser(req.user.email)) {
        return res.status(403).json({ message: 'Only admins can perform this action' });
    }

    const { userEmail } = req.body;
    let users = storeUsers.get('users') || [];
    const userIndex = users.findIndex(user => user.email === userEmail);

    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
    }

    users[userIndex].isDeactivated = true;
    storeUsers.put('users', users);

    res.json({ message: `User account ${userEmail} has been deactivated.` });
});

userRouter.put('/reactivateUser', authenticateToken, async (req, res) => {
    if (!isAdminUser(req.user.email)) {
        return res.status(403).json({ message: 'Only admins can perform this action' });
    }

    const { userEmail } = req.body;
    let users = storeUsers.get('users') || [];
    const userIndex = users.findIndex(user => user.email === userEmail);

    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
    }

    users[userIndex].isDeactivated = false;
    storeUsers.put('users', users);

    res.json({ message: `User account ${userEmail} has been reactivated.` });
});


userListRouter.route('/revAndID')
.get((req, res) => {
    // Retrieve all lists
    const allLists = storeLists.get('superhero_lists') || [];

    // Flatten the structure to get a simple array of objects with listName and uuid
    let listsWithReviewUUIDs = [];
    allLists.forEach(list => {
        if (list.reviews && list.reviews.length > 0) {
            list.reviews.forEach(review => {
                listsWithReviewUUIDs.push({
                    listName: list.name,
                    id: review.id // Assuming each review has an 'id' property that is the UUID
                });
            });
        }
    });

    res.json(listsWithReviewUUIDs);
});

userListRouter.get('/:listName/reviews', authenticateToken, (req, res) => {
    const { listName } = req.params;
    const userEmail = req.user.email; // Email of the authenticated user

    const list = superhero_lists.find(list => list.name === listName);
    if (!list) {
        return res.status(404).send('List not found');
    }

    // Filter reviews by the authenticated user's email
    const userReviews = list.reviews.filter(review => review.userEmail === userEmail);

    res.json(userReviews);
});

const isAdmin = (req, res, next) => {
    // Assuming req.user is set in authenticateToken middleware
    if (req.user && req.user.admin) {
        next(); // Proceed if the user is an admin
    } else {
        res.status(403).json({ message: 'Access denied: Admin rights required.' });
    }
};
app.post('/api/policies', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { policyType, content } = req.body;

        // Validate input
        if (!policyType || !content) {
            return res.status(400).json({ message: 'Missing policy type or content' });
        }

        // Load existing policies
        const policies = storePolicies.get('policies') || {};
        
        // Update the specific policy content
        policies[policyType] = content;

        // Save updated policies
        storePolicies.put('policies', policies);

        res.status(201).json({ message: `Policy ${policyType} updated successfully.` });
    } catch (error) {
        console.error('Error updating policy:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Assuming Express app is set up

app.get('/api/policies/:policyType', async (req, res) => {
    const { policyType } = req.params;

    try {
        // Load policies from file or database
        const policies = storePolicies.get('policies') || {};

        // Check if the policy exists
        if (policies[policyType]) {
            res.json({ content: policies[policyType] });
        } else {
            res.status(404).json({ message: `Policy ${policyType} not found` });
        }
    } catch (error) {
        console.error('Error fetching policy:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


userListRouter.get('/publicReviews', (req, res) => {
    // Retrieve all lists
    const allLists = storeLists.get('superhero_lists') || [];

    // Filter for public lists and map to get their reviews
    const publicReviews = allLists
        .filter(list => list.isPublic)
        .flatMap(list => list.reviews.map(review => ({
            listName: list.name,
            reviewId: review.id,
            description: review.description,
            rating: review.rating,
            comment: review.comment,
            visible: review.visible
        })));

    res.json(publicReviews);
});

// Mount the users router
app.use('/api/superhero_info', infoRouter);
app.use('/api/superhero_powers', powersRouter);
app.use('/api/superhero_lists', listRouter);
app.use('/api/users', userRouter);
app.use('/api/user_lists', userListRouter);

app.listen(port, () => {
    initializeAdminUser();
    console.log(`Listening on port ${port}`);
});

